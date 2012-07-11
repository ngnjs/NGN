var https       = require('https'),
    email       = require('mailer'),
    events      = require('events'),
    NGN         = require('../NGN.Base');

var Sendgrid    = {};

/**
 * @class NGN.service.sendgrid.Server
 * This class connects to the [Sendgrid API](http://docs.sendgrid.com/documentation/api/)
 * @extends NGN.Base
 * @param {Object} [config]
 * Configuration.  
 */
Sendgrid.Server = NGN.extend({
    
    /**
     * @constructor 
     */
    constructor: function( config ){
        
        Sendgrid.super.constructor.call( this, config );
        
        Object.defineProperties(this,{
            
            /**
             * @property {String}
             * @readonly
             * @static
             */
            host: {
                value:          'smtp.sendgrid.net',
                enumerable:     true,
                writable:       false,
                configurable:   false
            },
            
            /**
             * @cfg {Number} [port=587]
             * The port used for smtp traffic with Sendgrid. 
             */
            /**
             * @property {Number} [port=587]
             * The #port used to connect to Sendgrid.
             */
            port: {
                value:          config.port     || 587,
                enumerable:     true,
                writable:       true
            },
            
            /**
             * @cfg {String} [domain=localhost]
             * The domain from which email is sent (i.e. me@`mydomain.com`). 
             */
            /**
             * @property {String} [domain=localhost]
             * The #domain from which email is sent. 
             */
            domain: {
                value:          config.domain   || 'localhost',
                enumerable:     true,
                writable:       true
            },
            
            /**
             * @cfg {String} [username=null]
             * The Sendgrid account username.  
             */
            username: {
                value:          config.username || null,
                enumerable:     true,
                writable:       true
            },
            
            /**
             * @cfg {String} [password=null]
             * The Sendgrid account password used to connect to the API's.
             */
            password: {
                value:          config.password || null,
                enumerable:     false,
                writable:       true
            },
            
            /**
             * @cfg {Boolean} [debug=false]
             * Set to `true` to turn on debugging (using the debugger defined by the application).
             * This defaults to using the console for debugging. 
             */
            debug: {
                value:          config.debug    || false,
                enumerable:     true,
                writable:       true
            },
            
            _sender: {
                value:          (config.from || 'noreply') +'@'+ (config.domain || 'localhost'),
                enumerable:     false
            },
            
            /**
             * @cfg {String} [defaultSenderAddress=noreply@domain.com]
             * The default email address to use when none is specified.
             * Uses #domain in placer of `domain.com`. 
             */
            defaultSenderAddress: {
                enumerable:     true,
                get:            function() {
                                    return this._sender;
                                },
                set:            function( value ) {
                                    if (!isValidEmailSyntax(value))
                                        this.fireError('Invalid email syntax for \''+value+'\'.');
                                    else
                                        this._sender = value;
                                }
            },
            
            /**
             * @cfg {String} [defaultSenderName=null]
             * The default name to use as the sender. If none is specified, the #defaultSenderAddress will be used (i.e. no name) when sending messages.
             */
            defaultSenderName: {
                value:          config.defaultSenderName    || null,
                enumerable:     true,
                writable:       true
            },
            
            /**
             * @cfg {String} [replyToAddress=null]
             * The default reply-to email address. If this is null when sending an email, the #defaultSenderAddress will be used as a fallback. 
             */
            replyToAddress: {
                value:          config.replyToAddress       || null,
                enumerable:     true,
                writable:       true
            },
            
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
            
        });
        
    },
    
    /**
     * @method
     * Indicates whether the provided email address passes syntax validation checks.
     * @param {String} address
     * The email address to check for syntax validity.
     * @returns {Boolean} 
     */
    isValidEmailSyntax: function( address ) {
        return this._emailRegex.test(address);
    }
    
    //TODO: PUT EVENTS HERE AS METHODS
    
});


/**
 * Module Exports
 */
module.exports = exports = Sendgrid;