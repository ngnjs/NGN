var Base = require('../../web/Proxy'),
	fs	 = require('fs');

/**
 * @class NGNX.web.Proxy
 * A dynamic reverse proxy. This is the same as NGN.web.Proxy, but with the addition of configuration caching.
 * @extends NGN.web.Proxy
 * @author Corey Butler
 */
var Class = Base.extend({

    constructor: function(config) {

        // Inherit from NGN.web.Proxy
        Class.super.constructor.call(this,config);

		if (this._cache == null)
			this._cache = 'config.json';
		
		Object.defineProperties(this,{
			
			_cachepath: {
				enumerable:	false,
				writable:	true,
				value:		this._cache
			}
			
		});
		
		var me = this;
		
		this.on('change',function(){
			me.cache();
		});
		
		this.openCache(function(){
			me.loadCache();
		});

    },
    
    /**
     * @method
     * Save the current configuration to the local cache (file).
     */
    cache: function() {
    	
		this._cache.cache = this.getConfiguration();
    	
    	this.onBeforeCache(this._cachepath,this._cache);
    	
    	var me = this,
    		fp = this._cachepath.substr(this._cachepath.length-5).toLowerCase() == '.json' ? this._cachepath : __NGN.path.join(this._cachepath,'cache.json');
    	
    	fs.writeFileSync(fp,JSON.stringify(this._cache,null,4),'utf8',function(err){
    		if (err)
    			me.fireError(err);
    		me.onCache(this._cachepath);
    	});
    	
    	//TODO: Handle remote updates
    },

    /**
	 * @method
	 * Load the cache
	 */
	loadCache: function(){
		for (var i=0;i<this._cache.cache.length;i++) {
			this.createVirtualHost(this._cache.cache[i]);
		}
		this.onReady();
	},
	
	/**
	 * @method
	 * Get the cache & load it.
	 * @param {Function} [callback]
	 * Execute the function after the cache is loaded. No arguments are passed to this function. 
	 * @private
	 */
	openCache: function(callback) {
		
		callback = callback || __NGN.noop;
		var me = this;

		// Get the configuration if supplied
		if (this._cache){
			if (typeof this._cache === 'string'){
				if (this._cache.substr(0,4).trim().toLowerCase() == 'http'){
					var client = new NGN.web.Client();
					
					client.GET(this._cache,function(err,res,body){
						if (err) throw err;
						try {
							me._cache = JSON.parse(body);
						} catch (e) {
							me._cache = body;
						}
						callback();
					});
				} else {
					fs.exists(this._cache,function(exists){
						if (exists){
							me._cachepath 	= me._cache;
							me._cache 		= require(me._cachepath);				
						} else {
							try {
								// First look in local directory for config
								me._cachepath 	= __NGN.path.join(process.cwd(),me._cache);
								me._cache 		= require(me._cachepath);
							} catch (e) {
								try {
									// Then look in the node module directory
									me._cachepath 	= __NGN.path.join(__dirname,me._cache);
									me._cache 		= require(me._cachepath);
								} catch (ee) {
									try {
										// Then look for the default cache.json in the running directory
										me._cachepath 	= __NGN.path.join(process.cwd(),'lib','cache.json');
										me._cache 		= require(me._cachepath);
									} catch (eee) {
										try {
											// Then look for the default cache.json in the node_modules directory
											me._cachepath	= __NGN.path.join(__dirname,'cache.json');
											me._cache 		= require(me._cachepath);
										} catch (eeee) {
											me._cachepath 	= __NGN.cwd;
											me._cache 		= {cache:[]};
											// If all fails, then there is no cache available.
											me.fireWarning(eeee.message+'. Using '+__NGN.path.join(__NGN.cwd,'cache.json')+' instead.');
										}
									}
								}
							}
						}
						
						// Refresh the cache from remote source if remote source is available.
						if (me._cache.hasOwnProperty('remote')){
							if (me._cache.remote) {
								var client = new NGN.web.Client();
						
								client.GET(me._cache.remote,function(err,res,body){
									if (!err) {
										try {
											me._cache = JSON.parse(body);
										} catch (e) {
											me._cache = body;
										}
									}
									callback();
								});
							} else
								callback();
						} else 
							callback();
					});
				}
			}
		} else {
			callback();
		}
	},
	
	/**
	 * @event beforecache
	 * Fired before the configuration is cached to a local file.
	 * @param {String} outfile
	 * The filepath of the cache.
	 * @param {Object} data
	 * The data to write to the cache.
	 */
	onBeforeCache: function(outfile,data){
		this.emit('beforecache',{output:outfile,data:data});
	},
	
	/**
	 * @event cache
	 * Fired when the configuration is cached. Callback receives the output file path as the only argument.
	 * @param {String} outfile
	 * The path to the output file. 
	 */
	onCache: function(outfile) {
		this.emit('cache',outfile);
	}

});

module.exports = Class;