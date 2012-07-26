var Base = require('../Transport');

/**
 * @class NGNX.mail.service.Gmail
 * Send messages using a Gmail server. This is a convenience wrapper around NGNX.mail.Transport
 * @extends NGNX.mail.Transport
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new Gmail server connection
	 * @param {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
		config.service = 'Gmail';

		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String}
			 * The username of the Gmail account to connect with.
			 */
			username: {
				value:		config.username || null,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The password of the Gmail account to connect with.
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
