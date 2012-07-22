var events      = require('events'),
    request     = require('request'),
    uuid        = require('node-uuid'),
    Core		= require('../NGN.core');

/**
 * @class NGN.app.Email
 * Represents an email address and provides helper methods for managing it, such as
 * validation.
 * @extends NGN.core
 * @param {String} address Email address
 * @requires node-uuid
 * @docauthor Corey Butler
 * @uses NGN.datasource.Redis
 */
var Class = Core.extend({
	
	/**
	 * @constructor
	 */
	constructor: function( config ){
		
		Class.super.constructor.call( this );
		
		Object.defineProperties(this,{
			
			/**
             * @property
             * The {@see RegExp} pattern that complies with (RFC 2822)[http://www.faqs.org/rfcs/rfc2822.html].
             * @private
             */
            _emailRegex: {
                value:       /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
                enumerable:  false,
                writable:    false
            },
			
			/**
			 * @property {String} address
			 * The email address (i.e. me@domain.com);
			 */
			address: {
			    value:      config.address || null,
			    enumerable: true,
			    writable:   false
			},
			
			/**
			 * @property
			 * @returns {Boolean}
			 * @readonly
			 * `true`/`false` indicator of whether #address is syntactically valid.
			 */
		    isValidSyntax: {
			    enumerable: true,
			    get:        function() {
                                return this._emailRegex.test(this.address);
            			    }
			},
			
			/**
			 * @property {String} [validationCode=null]
			 * The validation code assigned to this email address
	         * @readonly  
			 */
			validationCode: {
                value:       null,
			    enumerable:  true,
			    writable:    false
			}
		});
		
	},
	
	/**
	 * @method
	 * Generates a validation code.
	 * @returns {String} 
	 */
	createValidationCode: function() {
	    this.validationCode = uuid.v1().replace(/-/gi,'');
	    
	    //TODO: Throw an error if the email address is syntactically invalid.
	    //TODO: Add the code to redis for the email address.
	    
	    return this.validationCode;
	},
	
	test: function(){
	    console.log('Test');
	}
	
});


// Create a module out of this.
module.exports = Class;
