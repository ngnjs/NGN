var Base = require('../../core/MailTransport');

/**
 * @class NGNX.mail.Common
 * Send messages using a specific server. This is a convenience wrapper around NGN.core.MailTransport
 * @extends NGN.core.MailTransport
 * @private
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new commonly used server connection.
	 * @param {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String}
			 * The username of the account to connect with.
			 */
			username: {
				value:		config.username || null,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The password of the account to connect with.
			 */
			password: {
				value:		config.password || null,
				enumerable:	false,
				writable:	true
			}
			
		});
		
		this.auth = {
			user: this.username,
			pass: this.password
		}

		this.init();
		
	}
	
});

module.exports = Class;
