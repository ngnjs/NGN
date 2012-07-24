/**
 * @class NGN.app.Application
 * @singleton
 * Creating an application enables the globally accessible `application` variable,
 * which is designed to store custom application logic. This class registers the
 * application, loads defaults, and provides several convenience methods
 * The application scope is a globally accessible variable designed to store custom
 * application logic.
 * 
 * **Example**
 * 
 * 		var app = new NGN.app.Application({
 * 					name: 'myApp'
 * 				});
 * This basic example will create an NGN app and enable the global `application` scope. This allows
 * other files in the project to reference it easily:
 * 
 * 		console.log(application.name); // --> myApp
 * 
 * There is also a shortcut method available (NGN#app). Using this method, the following example would work:
 * 
 * 		NGN.app({name:'myApp'});
 * 		
 * 		console.log(application.name); // --> myApp
 * @aside guide application_scope 
 */
var Base = require('../NGN.core');
var Class = Base.extend({
	
	constructor: function(config){
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [name=NGN_Application]
			 * The name of the application
			 */
			name: {
				value:		config.name || 'NGN_Application',
				enumerable: true,
				writable:	true
			},
			
			/**
			 * @cfg {Object/String} [administrator=null]
			 * This can be almost anything. If an object is provided with
			 * an `email` element, it will be used to send administrative
			 * notices (if a mail server is available).
			 */
			administrator: {
				value:		config.administrator || null,
				enumerable:	true,
				writable:	true
			},
			
			__elements: {
				value:		[],
				enumerable:	false,
				writable:	true
			}
			
		});
		
		// Load elements
		for (var el in this){
			if (this.hasOwnProperty(el))
				__elements.push(el);
		}
		
		// Enable the application scope
		global.application = this;
		
	},
	
    /**
     * @method 
     * This method accepts a key/value object or an absolute path to a JSON file.
     * **Object**
     *      var obj = {
     *          title:      'Awesome App',
                author:     'Acme, Inc.',
                keywords:   'Awesome, App'
     *      }
     *      
     *      application.load(obj);
     * 
     * **Filepath**
     *      application.load(__dirname + '/application.json');
     * @param {Object/String} config 
     * JSON Object or Filepath.
     */
    load:   function( config ) {
        
                // If the configuration is a filepath, read the file (expect JSON content)
                if (typeof config === 'string'){
                    config = require(config);
                } else if (typeof config !== 'object'){
                	throw Error('Could not load application values. Application configuration must be a JSON filepath or a JSON object.')
                }
                
                // Apply the object to the application scope.
                for (var key in config) {
                     if (config.hasOwnProperty(key)) {
                         Object.defineProperty(global.application,key,{
                                value:      config[key],
                                enumerable: true,
                                writable:   true 
                         });
                     }
                }
            },
    
    /**
     * @method
     * Resets the application scope to it's original default (blank) .
     */        
    clear:  function() {
    			for (var attr in this){
                    if (this.hasOwnProperty(attr) && __elements.indexOf(attr) < 0)
                        delete this[attr];
                }
            },
    
    /**
     * @method
     * Get a single property. Supports nested properties, such as `get('my.nested.attribute')`.
     * @param {String} property
     * The name of the application element to return.
     * @returns {Mixed}
     */        
    get:    function( property ) {
                var path = property.split('.'),
                    scope= this;
                
                for (var i=0; i<path.length; i++)
                    scope = scope[path[i]];
                
                return scope;
            },
     
     /**
      * @method
      * Set a property in the application scope. 
      * @param {String} property
      * @param {Any} value
      * This may be a string, date, or any valid JavaScript object. 
      */       
     set:   function( property, value ){
                if (this[property] !== undefined)
                    this[property] = value;
                else
                    Object.defineProperty(global.application,property,{
                        value:      value,
                        enumerable: true,
                        writable:   true
                    });
          	},
     
     /**
      * @method
      * Return the application as a JSON object. This strips the functions and only returns simple data types. 
      */
     toJson: function(obj) {
     			obj = obj || this;
		     	var rtn = {}, me=this;
		     	for (var attr in obj){
		     		if (obj.hasOwnProperty(attr)) {
			     		switch(typeof obj[attr]) {
			     			case 'function':
			     				break;
			     			case 'object':
			     				rtn[attr] = me.toJson(obj[attr]);
			     				break;
			     			default:
			     				rtn[attr] = obj[attr];
			     				break;
			     		}
			     	}
		     	}
		     	return rtn;
		    },
     
     /**
      * @method
      * Get a server instance by it's registered name. 
	  * @param {String} name
      */     	
     getServer: 	function(name){
				     	return __NGN.getServer(name);
				     },
     
     /**
      * @method
      * Get servers by a specific type. This returns an object with each attribute of the
      * object being the name of a server and each value being a reference to the server object. 
	  * @param {String} type
	  * @returns {Object}
      */
     getServersByType: 	function(type){
					     	return __NGN.getServersByType(type);
					     },
     
     /**
     * @event applicationstart
     * Fired when the NGN application starts.
     */
    onApplicationStart: function(){
    	this.fireEvent('applicationstart');
    },
    
    /**
     * @event applicationend
     * Fired when the application ends.
     */
    onApplicationEnd: function(){
    	this.fireEvent('applictionend');
    },
});

module.exports = Class;