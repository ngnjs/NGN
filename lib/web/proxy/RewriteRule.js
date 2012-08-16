var Base = require('../../NGN.core');
/**
 * @class NGN.web.proxy.RewriteRule
 * Represents a rewrite rule for specified HTTP verbs.
 * @extends NGN.core
 * @author Corey Butler
 */
var Class = Base.extend({
	
    constructor: function(config) {

       //TODO: Create configuration/properties.
        Object.defineProperties(this,{
        	
            /**
             * @cfg {RegExp} pattern (required)
             * The regular expression used to detect a specific URL pattern.
             */
            pattern: {
                value: 		config.pattern,
                enumerable: true,
                writable: 	true,
                configurable:true
            },
            
            /**
             * @cfg {String} substitute (required)
             * The substitution pattern. This uses a simple find/replace to rewrite the URL.
             * Each argument is determined by a `$` and number in a 1-based pattern. In other
             * words `$1` represents the first value found.
             * 
             * **Example**
             * If the full URL is
             * 		http://mydomain.com/person/jdoe/update/address
             * and the pattern is
             *		RegExp("/person/(.*)/(.*)/(.*)")
             * and this value, substitute, is
             * 		"/$2.php?username=$1&what=$3"
             * the result would be
             * 		http://mydomain.com/update.php?username=jdoe&what=address
             */
            substitute: {
            	value:		config.substitute,
            	enumerable:	true,
            	writable:	true,
            	configurable:true
            },
            
            /**
             * @cfg {String} [path=null]
             * The source URL path that should be rewritten. 
             * 
             * For example, if the full URL is: 
             * 		http://www.mdomain.com/some/path/index.html?show=true
             * then the URL path is:
             * 		/some/path/index.html?show=true
             */
            path: {
            	value:		config.path || null,
            	enumerable:	true,
            	writable:	true,
            	configurable:true
            },
            
            /**
             * @cfg {Boolean} [last=false]
             * If set to `true`, no further processing will occur if this rule is matched. 
             */
            last: {
            	value:		config.last || false,
            	enumerable:	true,
            	writable:	true,
            	configurable:true
            },
            
            /**
             * @property {Boolean} [rewritten=false]
             * Indicates the #path was rewritten.
             * @readonly
             */
            rewritten: {
            	value:		false,
            	enumerable:	true,
            	writable:	true,
            	configurable:true
            },
            
            /*
             * @cfg {Boolean} [ignoreCase=true]
             * Ignore case-sensitivity when _substituting_ 
             */
            /*ignoreCase: {
            	value:		config.ignoreCase || true,
            	enumerable:	true,
            	writable:	true,
            	configurable:true
            }*/
           
           /**
            * @cfg {String/Array} [acceptMethod=*]
            * The HTTP method for which the rewrite rule should be applied.
            * 
            * By default, this rule is applied to all methods. Valid values
            * can be a comma delimited list or an array containing one or more
            * of the following:
            * 
            * * GET
            * * POST
            * * PUT
            * * DELETE
            * * HEAD
            * * TRACE
            * * All
            */
           acceptMethod: {
           		value:		config.method || ['*'],
           		enumerable:	true,
           		writable:	true,
           		configurable:true
           }

        });
        
        if (!Array.isArray(this.acceptMethod))
        	this.acceptMethod = this.acceptMethod.replace(/\S/gi,'').toUpperCase().split(',');
        
        var acceptableMethods = ['GET','POST','PUT','DELETE','HEAD','TRACE'];
        
        if (this.acceptMethod.indexOf('*') >= 0) {
        	this.acceptMethod = acceptableMethods;
        } else {
        	for (var i=0;i<acceptableMethods.length;i++){
        		if (this.acceptMethod.indexOf(acceptableMethods[i]) >= 0)
        			acceptableMethods.remove(acceptableMethods[i]);
        	}
        	this.acceptMethod = acceptableMethods;
        }

    },
    
    /**
     * @method
     * Rewrite the URL #path using the specified #rule.
	 * @param {String} [urlpath]
	 * A specific URL path to use instead of the one specified in #path.
	 * @param {String} [method]
	 * The method
	 * @returns {String}
	 * Returns the value of #path.
     */
    rewrite: function(urlpath,method) {
    	
    	this.path = urlpath || this.path;
    	
    	// Make sure a path exists
    	if (this.path == null)
    		return null;
    	
    	// Check the pattern to make sure the path matches the rule.
    	if (!this.pattern.test(this.path))
    		return this.path;
		
		// Get the replacement values
		var arg = this.pattern.exec(this.path);
		arg.shift();
		
		// Apply the replacement values to the path
		for (var i=0;i<arg.length;i++){
			this.path = this.substitute.replace(new RegExp('\\$'+(i+1),'g'),arg[i]);
		}

		this.onRewrite();
		
		return this.path;
		
    },
    
    /**
     * @method
     * Get the configuration of the rule.
     * @returns {Object}
     */
    getConfiguration: function(){
    	var rl = {};
					
		// Get the pattern & strip the RegExp forward slashes
		var ptrn = this.pattern.toString().replace(/\/{1}/,'');
		ptrn = ptrn.substr(0,ptrn.length-1);
		
		rl[ptrn] = 	this.substitute
					+ (this.last == true ? '-last': '');
		
		return rl;
    },
    
    /**
     * @event rewrite
     * Fired when the path is rewritten.
     */
    onRewrite: function() {
    	this.rewritten = true;
    	//this.emit('rewrite',this.path);
    },
    
    /**
     * @method
     * Test to see if a specific HTTP method is accepted by this rule.
	 * @param {String} method
	 * The HTTP method to test.
     */
    forMethod: function(method) {
    	return this.accepMethod.indexOf(method.trim().toUpperCase());
    }

});

module.exports = Class;