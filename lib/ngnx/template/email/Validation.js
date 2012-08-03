var Base = require('../../../util/Template.js');
/**
 * @class NGNX.template.email.Validation
 * A simplified object for creating email validation messages. This template
 * basically provides a standard set of variables for email validation templates.
 * @extends NGN.util.Template
 * @author Corey Butler
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new email validation template.
	 * @param {Object} config
	 */
	constructor: function(config) {
		
		config = config || {};
	
		Class.super.constructor.call(this,config);
		
		var props = {
			
			/**
			 * @cfg {String} [code=null]
			 * The validation code.
			 */
			code: {
				value:		config.code || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} url
			 * The URL which will be provided as a means for the user to validate their
			 * email account. 
			 */
			url: {
				value:		config.url || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [email=null]
			 * The email address this template will be created for.
			 */
			email: {
				value:		config.email || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [appendCode=false]
			 * Append the code to the end of the URL.
			 */
			appendCode: {
				value:		__NGN.coalesce(config.appendCode,false),
				enumerable:	true,
				writable:	true
			}
			
		};
		
		Object.defineProperties(this,props);
		
		for(var prop in props){
			if (props.hasOwnProperty(prop))
				this.data[prop] = this[prop];
		}
	}
	
});

module.exports = Class;
