/**
 * @class NGN.app.Configuration
 * An application configuration. Typically, applications use a single configuration. 
 * Therefore, this is normally treated as a singleton, especially
 * when using #globalShortcut, but it is not restricted to this usage alone.
 * 
 * Configurations provide all of the defaults
 */
var Base = require('../NGN.core');
var Class = Base.extend({
	
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		/**
		 * @cfg {String} [globalShortcut=null]
		 * Assign a global shortcut. This creates a global variable that can be accessed
		 * anywhere in the application, similar to `NGN`, `NGNX`, `MODEL`, '$`, or `NGNA`.
		 * 
		 * **Example**
		 * 		new NGN.app.Configuration({globalShortcut:'cfg'});
		 * 		
		 * 		cfg.set('name','myApp');
		 * 
		 * This code will create a global convenience pointer called `cfg`.
		 * In this example, writing `console.log(cfg.name);` would output 
		 * `myApp`.
		 * 
		 * _If multiple configurations are defined_, the globalShortcut name
		 * must be unique.
		 */
		if (config.globalShortcut){
			if (['__ngn','application'].indexOf(config.globalShortut) >= 0)
				throw Error('Application configuration global shortcut cannot be a reserved word: application, __NGN');
			if (global.hasOwnProperty(config.globalShortcut) !== undefined)
				throw Error('Th application configuration global shortcut \''+config.globalShortcut+'\' is already in use. Please define an alternative shortcut name.');
			var me = this;
			Object.defineProperty(global,config.globalShortcut,{
				enumerable:	true,
				get:		function(){ return me; }
			});
		}
		
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
     * @event configurationChange
     * Fired when the configuration is changed using #set.
     */
    onChange: function(meta){
    	this.fireEvent('configurationChange',meta);
    }
});

module.exports = Class;