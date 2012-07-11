var mustache    = require('mu2'),
    crypto      = require('crypto'),
    NGN         = require('../NGN.Base');

/**
 * @class NGN.template.renderer.Mustache
 * A template renderer. Represents the [NodeJS Mustache implementation](https://github.com/sendgrid/sendgrid-nodejs) of [the mustache library](http://mustache.github.com).
 * This class is not intended to be used directly in an application. It is designed to be extended for different templated.
 * @extends NGN.Base
 * @requires NGN
 * @requires mu2
 * @requires crypto
 * @docauthor Corey Butler
 */
var TplEngine = NGN.extend({
    
    /**
     * @constructor 
     */
    constructor: function( config ){
        
        TplEngine.super.constructor.call( this, config );
        
        Object.defineProperties(this,{
            
            /**
             * @property {Object}
             * The underlying [mu](https://github.com/raycmorgan/Mu) module.
             */
            engine: {
                value:          mustache,
                enumerable:     true,
                writable:       true
            }
        });
        
    },
    
    /**
     * @method
     * @param {Object} data
     * A key/value Object representing the variables/values to apply to the template.
     *      var view = {name: 'John'};
     * @param {String} tpl
     * The content template. See {@link NGN.template.email.Validation} or any other NGN.template.email template.
     * @param {Function} callback
     * A callback function that receives the rendered output
     * 
     *      var x = new NGN.template.Mustache();
     *      x.render({name:'John'}, 'Hello, <b>{{name}}</b>!', function(content){
     *          console.log(content);
     *      });
     * 
     * This method renders a template and returns the generated content in a callback.
     */
    renderTemplate: function( data, tpl, callback ) {
        var me          = this,
            cachename   = null,
            md5sum      = crypto.createHash('md5');
        
        // Attempt to dynamically create a token as the cache name
        try {
            md5sum.update(((typeof data == 'object' ? JSON.stringify(data) : data)+tpl).replace(/(\s)/gi,''));
            cachename = md5sum.digest('hex');
        } catch (e) {}
        
        if (cachename !== null && this.engine.cache[cachename] == undefined) {
            this.engine.compileText( cachename, tpl, function(err, result){
                if (err)
                    me.fireError(err);
                else {
                    var result = "";
                    me.engine.render(cachename, data).on('data',function(buffer){
                        result += buffer.toString();
                    }).on('end',function(){
                        callback(result);
                    });
                }
            });
        } else if (cachename == null)
            callback(this.engine.renderText(tpl, data));
        else
            callback(this.engine.render(cachename));
    }
    
});

// Create a module out of this.
module.exports = TplEngine;
