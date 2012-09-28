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
					if (this._cache == 'config.json'){
						this._cachepath = __NGN.path.join(process.cwd(),'cache.json');

						if (!fs.existsSync(this._cachepath)){
							this._cachepath = __NGN.path.join(__dirname,'cache.json');

							if (!fs.existsSync(this._cachepath)){
								this._cachepath = __NGN.path.join(process.cwd(),'lib','cache.json');
							
								if (!fs.existsSync(this._cachepath)){
									this._cachepath 	= __NGN.cwd;
									this._cache 		= {cache:[]};
									// If all fails, then there is no cache available.
									this.fireWarning('Using '+__NGN.path.join(__NGN.cwd,'cache.json')+' instead.');
								}
							}
						}
					}
					
					if (!fs.existsSync(this._cachepath))
						this._cache = {cache:[]};

					if (!this._cache.hasOwnProperty('cache')){
						try {
							this._cache = require(this._cachepath);
						} catch(e) {
							if (e.message.indexOf('Cannot find module') >= 0){
								this._cache = require(__NGN.path.resolve(this._cachepath));
							}
						}
					}
						
					// Refresh the cache from remote source if remote source is available.
					if (this._cache.hasOwnProperty('remote')){
						if (this._cache.remote) {
							var client = new NGN.web.Client();
					
							client.GET(this._cache.remote,function(err,res,body){
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