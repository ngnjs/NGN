var TemplateEngine  = require('../Mustache')

/**
 * @class NGN.template.email.Validation
 * The validation email template used when sending an validation code to a user..
 * 
 * The **HTML** email looks like:
 * <div style="border:1px dashed #ccc;padding:8px;border-radius:6px;margin:12px;width:80%;background: #eee !important;">
 * <h2>Welcome to {{service}}, {{firstname}}!</h2>
 * <p>Please validate your email address within 48 hours at <a href="{{urlRoot}}/{{code}}">{{urlRoot}}/{{code}}</a>.</p>
 * <hr/><h3>Having trouble?</h3>
 * <p>If the link above does not work, please visit <a href="{{urlRoot}}">{{urlRoot}}</a> and enter <u>{{code}}</u> (your validation code).</p>
 * <p>Remember, your code is only valid for 48 hours. If you need further assistance, please contact <i>{{supportEmailAddress}}</i>. Again, welcome to the service!</p>
 * </div>
 * 
 * The **text** version looks like:
 * <div style="color:#333;font-family:Courier;border:1px dashed #ccc !important;padding:8px;border-radius:6px;margin:12px;width:80%;background: #eee !important;">
 * Welcome to {{service}}, {{firstname}}!
 * <br/><br/>
 * Please validate your email address within 48 hours at {{urlRoot}}/{{code}}.
 * <br/><br/>
 * HAVING TROUBLE?
 * <br/><br/>  
 * If the link above does not work, please visit {{urlRoot}} and enter {{code}} (your validation code).
 * Remember, your code is only valid for 48 hours. If you need further assistance, please contact {{supportEmailAddress}}. 
 * Again, welcome to the service!
 * </div>
 * @param {Object} [config] 
 * Configuration
 * @requires mustache
 * @docauthor Corey Butler
 * @extends NGN.template.renderer.Mustache
 */
var TPL = TemplateEngine.extend({
    
    constructor: function( config ){
        
        config = config || {};
        
        TPL.super.constructor.call( this, config );
        
        Object.defineProperties(this,{
            
            /**
             * @cfg {String} (required)
             * The validation code to be delivered to the user.
             */
            code: {
                value:      config.code         || 'UNKNOWN',
                enumerable: true,
                writable:   true
            },
            
            /**
             * @cfg {String} (required)
             * The given name of the person to whom the email is sent.
             */
            firstname: {
                value:      config.firstname    || 'User',
                enumerable: true,
                writable:   true
            },
            
            /**
             * @cfg {String} [service=Move Your Axis]
             * The name of the service or website on whose behalf the vaidation message is sent.
             */
            service: {
                value:      'Move Your Axis',
                enumerable: true,
                writable:   true
            },
            
            /**
             * @cfg {String} [urlRoot=http://moveyouraxis.com/validate]
             * The base URL prepended to the #code. This string is concatenated with #code
             * to create a complete validation link.
             * 
             * For example, if the urlRoot is `http://mydomain.com/validate` and the validation code is
             * `12345`, the template will generate `http://mydomain.com/validate/12345` in the message body.
             */
            urlRoot: {
                value:      'http://moveyouraxis.com/validate',
                enumerable: true,
                writable:   true
            },
            
            /**
             * @cfg {String} [supportEmailAddress=support@moveyouraxis.com]
             * The email address to contact when support is required. 
             */
            supportEmailAddress: {
                value:      'support@moveyouraxis.com',
                enumerable: true,
                writable:   true
            },
            
            /**
             * @property {String}
             * The HTML template.
             * @private
             * @hide
             */
            _htmlTpl: {
                value:      '<h2>Welcome to {{service}}, {{firstname}}!</h2>'
                            + '<p>Please validate your email address within 48 hours at <a href="{{urlRoot}}/{{code}}">{{urlRoot}}/{{code}}</a>.</p>'
                            + '<hr/><h3>Having trouble?</h3>'
                            + '<p>If the link above does not work, please visit <a href="{{urlRoot}}">{{urlRoot}}</a> and enter <u>{{code}}</u> (your validation code).</p>'
                            + '<p>Remember, your code is only valid for 48 hours. If you need further assistance, please contact <i>{{supportEmailAddress}}</i>. Again, welcome to the service!</p>',
                enumerable: false,
                writable:   true
            },
            
            /**
             * @property {String}
             * The text template.
             * @private
             * @hide
             */
            _textTpl: {
                value:      'Welcome to {{service}}, {{firstname}}!\n\n'
                            + 'Please validate your email address within 48 hours at {{urlRoot}}/{{code}}.\n\n'
                            + 'HAVING TROUBLE?\n\n'
                            + 'If the link above does not work, please visit {{urlRoot}} and enter {{code}} (your validation code).\n\n'
                            + 'Remember, your code is only valid for 48 hours. If you need further assistance, please contact {{supportEmailAddress}}. Again, welcome to the service!',
                enumerable: false,
                writable:   true
            },
            
            /**
             * @property {Object}
             * The key/value store used to pass arguments to the template generator.
             * @private
             * @hide
             */
            data: {
                enumerable: false,
                get:        function(){
                                return {
                                    code:                   this.code                   || null,
                                    firstname:              this.firstname              || null,
                                    service:                this.service                || null,
                                    urlRoot:                this.urlRoot                || null,
                                    supportEmailAddress:    this.supportEmailAddress    || null
                                };
                            }
            }
            
        });
        
    },
    
    /**
     * @method
     * Render the template using he configured values.
     *      var tpl = new NGN.template.email.Validation({
     *                  code:       '12345',
     *                  firstname:  'John',
     *                  service:    'Awesome Service',
     *                  urlRoot:    'http//mydomain.com/validate'
     *              });
     *      
     *      tpl.render('html', function(generatedContent){
     *          console.log(generatedContent);
     *      });
     * @param {String} [contentType=html]
     * The type of content to generate. Either `html` or `text`.
     * @param {Function} callback
     * A callback function that receives the generated content.
     * This is provided as a single argument. 
     */
    render: function( contentType, callback ) {
        if (typeof contentType === 'function') {
            callback    = contentType;
            contentType = 'html'
        }
        this.renderTemplate(this.data, contentType == 'html' ? this._htmlTpl : this._textTpl, callback);
    }
    
});

// Create a module out of this.
module.exports =TPL;
