var Base = require('../core/Server');
/**
 * @class NGN.core.SmtpServer
 * A utility class for bidirectional communication as or with an SMTP server. Based on [simplesmtp](https://github.com/andris9/simplesmtp).
 * @extends NGN.core.RemoteServer
 * @private
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new SMTP server.
	 * @param {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			
			
		});
		
	}
	
});

module.exports = Class;
