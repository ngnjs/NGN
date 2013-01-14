var Core = require('./Server');

/**
 * @class NGN.core.RemoteServer
 * A generic utility class representing a remote server used in the application.
 * This class typically isn't invoked directly.
 * @extends NGN.core.Server
 * @private
 */
var Class = Core.extend({
	
	/**
	 * @constructor
	 * Create a new server.
	 * @params {Object} config
	 */
	constructor: function(config){
		
		Class.super.constructor.call(this, config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [host=localhost]
			 * The host name or IP address of the remote server.
			 */
			host: {
				value:		config.host || 'localhost',
				enumerable:	true,
				writable:	true,
				configurable:true
			}

		});
	}
		
});

module.exports = Class;
