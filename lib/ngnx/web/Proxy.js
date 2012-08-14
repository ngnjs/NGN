var Base = require('../../web/Proxy');

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
		
		var me = this;
		this.openCache(function(){
			me.loadCache();
		});

    },

    /**
	 * @method
	 * Load the cache
	 */
	loadCache: function(){
		for (var i=0;i<this._cache.cache.length;i++) {
			this.addVirtualHost(this._cache.cache[i]);
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
		
		callback = callback || NGN.emptyFn;
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
					try {
						// First look in local directory for config
						this._cache = require(__NGN.path.join(process.cwd(),this._cache));
					} catch (e) {
						try {
							// Then look in the node module directory
							this._cache = require(__NGN.path.join(__dirname,this._cache));						
						} catch (ee) {
							try {
								// Then look for the default cache.json in the running directory
								this._cache = require(__NGN.path.join(process.cwd(),'lib','cache.json'));
							} catch (eee) {
								try {
									// Then look for the default cache.json in the node_modules directory
									this._cache = require(__NGN.path.join(__dirname,'cache.json'));
								} catch (eeee) {
									// If all fails, then there is no cache available.
									this._cache = {};
								}
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

});

module.exports = Class;