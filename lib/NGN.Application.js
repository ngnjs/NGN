/**
 * @class Application
 * @singleton
 * The application scope is a globally accessible variable designed to store custom
 * application logic.
 * @aside guide application_scope 
 */
global.application = {
    
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
                    config = JSON.parse(require('fs').readFileSync(config,'utf8'));
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
                    if (attr !== 'load' && attr !== 'clear')
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
           }
};
