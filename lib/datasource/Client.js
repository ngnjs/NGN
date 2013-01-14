var Base        = require('../NGN.core');

/**
 * @class NGN.datasource.Client
 * Represents a client used to interact with a NGN.datasource.Connection.
 * This is a lightweight wrapper around the connection's native client. It is
 * designed as a base for expanding common client actions.
 * @extends NGN.core
 * @private
 * @requires NGN
 * @author Corey Butler
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {NGN.datasource.Connection/String} connection (required)
			 * The connection object or the NGN.datasource.Connection#dsnName string representing a datasource connection.
			 */
			_client: {
				value:		(typeof config.connection === 'string' ? __NGN.system.DSN[config.connection] || new __NGN.datasource.Connection() : config.connection).getClient(),
				enumerable:	false,
				writable:	true,
				configurable:true
			}
			
		});
		
	}
	
});

module.exports = Class;