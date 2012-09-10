var Base		= require('./Model');

/**
 * @class NGN.model.Email
 * Represents an email address and provides helper methods for managing it, such as
 * syntax validation.
 * @extends NGN.model.Model
 * @docauthor Corey Butler
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 */
	constructor: function( config ){
		
		var me = this;
		
		config = config || {};
		
		config.type = 'Email';
		
		Class.super.constructor.call( this, config );
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} address
			 * The email address (i.e. me@domain.com).
			 * @required
			 */
			/**
			 * @property {String} address
			 * The email address (i.e. me@domain.com).
			 */
			address: {
			    enumerable: true,
			    get:		function(){
						    	return this.id;
						    },
				set:		function(value){
								this.id = value;
								this.validSyntax = __NGN.pattern.isEmail(this.id);
							}
			},
			
			/**
			 * @property {Boolean}
			 * Indicates the address is valid syntax
			 * @readonly
			 */
			validSyntax: {
				value:		false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [valid=false]
			 * Indicates the address is valid.
			 */
			/**
			 * @property {Boolean}
			 * Indicates the address is valid.
			 * @readonly
			 */
			valid: {
				value:		__NGN.coalesce(config.valid,false),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @property {String} [validationCode=null]
			 * The validation code assigned to this email address
	         * @readonly  
			 */
			validationCode: {
                value:       config.validationCode || null,
			    enumerable:  true,
			    writable:    false
			},
			
			lastValidated: {
				value:		config.lastValidated || null,
				enumerable:	true,
				writable:	true
			}
		});
		
		this.id = config.address || config.id;
		
		this.nonDataProperties.push('validSyntax');
		this.nonDataProperties.push('address');
		
		this.validSyntax = __NGN.pattern.isEmail(this.id);
		
		this.addValidator('id',__NGN.pattern.email);
		
	},
	
	/**
	 * @method
	 * Generates a validation code.
	 * @returns {String} 
	 */
	createValidationCode: function() {
	    this.validationCode = __NGN.uuid.v1().replace(/-/gi,'');
	    return this.validationCode;
	}
	
});


// Create a module out of this.
module.exports = Class;
