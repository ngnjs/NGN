/**
 * @class NGN
 * @singleton 
 * For information about using the NGN namespace, please see the [NGN Namespace Guide](#!/guide/ngn_namespace).
 * @aside guide ngn_namespace
 * @aside guide global_features
 * @aside guide application_scope
 */
var Base = require('./BaseClass');
var Class = Base.extend({

    constructor: function( config ) {
        
        Class.super.constructor.call(this);
        
        var emitter = require('events').EventEmitter;
        
        Object.defineProperties(this,{
          
          /**
           * @property {Object} configuration
           * @process
           * The configuration object. This is also acessible
           * via shortcut names including `NGN.config` or `NGN.cfg`.
           */
        	
        	/**
        	 * @property {Boolean} OBJECT_PROXY_SUPPORT
        	 * Supports JavaScript object proxies
        	 * @private
        	 */
        	// This is defined in the bootstrap.js file with the NGN definitions.
        	
        	/**
        	 * @property {String}
        	 * The running version of NGN.
        	 * @readonly
        	 */
        	version: {
          	enumerable:	true,
          	get:		function() {
		            		return require(require('path').join(__dirname,'..','package.json')).version;
		            	}
          },
          
          /**
           * @property {Array}
           * An array of all the global values currently in use.
           */
          globals: {
          	enumerable:	true,
          	get:		function(){
		            		var a = [];
		            		for (var el in global){
		            			if (global.hasOwnProperty(el))
		            			a.push(el);
		            		}
		            		return a;
		            	}
          },
          
          /**
           * @property {String}
           * The platform-specific path separator. `\\` or `/`.
           * @readonly
           */
          pathSeparator: {
          	enumerable:	true,
          	get:		function() { return require('path').sep; }
          },
          
          /**
           * @property {Array}
           * Stores the extension names. Primarily used for #getExtensions
           * @private
           * @protected 
           */
          _xtn: {
          	value:		[],
          	enumerable:	false,
          	writable:	true
          },
          
         /**
           * @property {NGN.Patterns} pattern
           * A reference to common RegExp patterns.
           * @readonly
           */
          _mask: {
          	value:		null,
          	enumerable:	false,
          	writable:	true
          },
          
          pattern: {
          	enumerable:	true,
          	get:		function(){
		            		if(this._mask)
		            			return this._mask
		            		this._mask = new __NGN.Pattern();
		            		return this._mask;
		            	}
          },
          
          /**
           * @cfg {Object} [namespace={}]
           * Used for instantiation.
           * @private
           */
          _namespace: {
          	enumerable:	false,
          	writable:	true,
          	value:		config.namespace || {}
          }
        });
        
        // Add each framework element to the NGN namespace
        for (var ns in this._namespace) {
            Object.defineProperty(this,ns,{
                value:      this._namespace[ns],
                enumerable: true,
                writable:   true,
                configurable: ns == '_ngnx'
            });
        }
        
    },
    
    /**
     * @method
     * Deep clones an object and returns it as a copy (not a reference).
     * @param {Object} obj
     * The object to clone.
     * @param {Boolean} [noCircular=false]
     * Set this to true if you are certain there are no circular references
     * in the object (performance gain).
     * @return {Object}
     * @protected
     */
    clone: function(obj, nocircular) {
    	
    	nocirculr = __NGN.coalesce(nocircular,false);
    	
    	var clone = require('clone');
    	
    	return clone(obj,nocircular)
    	/*
		var o = new Object, me = this;
								 var keys = Object.getOwnPropertyNames(obj);
								 for(var i=0; i<keys.length; i++)
					Object.defineProperty( o, keys[i], Object.getOwnPropertyDescriptor(obj,keys[i]) );
						  return o;*/
		
    },
    
     /**
     * @method emptyFn
     * An void function.
     * @protected
     */
    emptyFn: function(){},
            
    /**
     * @accessor
     * Get the custom extensions recognized by NGN.
     * @returns {Array} 
     */
    getExtensions: function() {
    	return this._xtn;
    },
    
    /**
	 * @method
	 * Define a new Class.
	 * 		NGN.define('ORG.team.Member',{
	 * 			extend: 'NGN.system.Person',
	 * 			boss: 'CEO',
	 * 			division: 'Executive',
	 * 			paygrade: 2,
	 * 			
	 * 			getOfficialTitle: function(role){
	 * 				return role+', Office of the CEO'
	 * 			}
	 * 		});
	 * The example above would extend `NGN.system.Person` to create `ORG.team.Person`.
	 * If the `ORG.team` namespace does not exist, it will be created
	 * dynamically before creating the new class.
 	 * @param {String} target
 	 * The name of the new class.
 	 * @param {Object} config
 	 * The configuration/extended structure to apply to the object.
	 */
	define: function(cls, config) {
		var ns 		= cls.split('.'), 
			_base 	= __dirname;

		if ((ns[0].trim().toUpperCase() == 'NGN' || ns[0].trim().toUpperCase() == '__NGN') && ns.length == 1)
			throw Error('Cannot override the NGN namespace.');

		var target = config.extend || 'NGN.core';
		
		target = target.trim();

		if (target == 'NGN.core' || target == '__NGN.core')
			_base = require('./NGN.core');
		else if (target.toUpperCase() == 'NGN' || target.toUpperCase() == '__NGN')
			_base = require('./NGN');
		else if (target.toUpperCase() == 'CLASS' || target.toUpperCase() == 'BASECLASS')
			_base = require('./BaseClass');
		else if (['REGEXP','STRING','OBJECT','NUMBER','FUNCTION','DATE','BOOLEAN','ARRAY'].indexOf(target.toUpperCase()) >= 0)
			throw Error(target+' cannot be extended. Core JavaScript objects are not part of the NGN class system.');
		else {
			var _cls 	= target.split('.');

			for(var i=1;i<_cls.length;i++){
				if (i==1 && _cls[0].toUpperCase() === 'NGNX')
					_base = __NGN.path.join(_base,'ngnx');
				_base = __NGN.path.join(_base,_cls[i]);
			}
			
			// Require the class
			_base = require(_base);
		}

		// Remove extension information now that it is no longer necessary.
		if (config.extend !== undefined)
			delete config.extend;

		// Create the class as a local variable and return it.
		var Class = _base.extend(config);
		return Class;
	},
	
	
	/**
	 * @method
	 * A convenience method for dynamically getting an object constructor by type.
	 * This is commonly used in ORM situations where an object type defines metadata.
	 * For example
	 * 		var schemaType = NGN.getConstructor(typeof 'somstring');
	 * is the same as
	 * 		var schemaType = String;
	 * @param {String} type (required)
	 * The type of object.
	 * @protected
	 */
	getConstructor: function(type){
		type = type || '';
		switch(type.trim().toLowerCase()) {
			case 'string':
				return String;
			case 'regexp':
				return RegExp;
			case 'array':
				return Array;
			case 'number':
				return Number;
			case 'date':
				return Date;
			case 'boolean':
				return Boolean;
		}
		this.fireError(type+' is not an understood constructor type.');
	},
	
    
    
    /**
     * @method
     * Recursively traverse a namespace and apply new configuration elements to classes.
     * @param {Object}
     * The namesapce object.
     * @param {Object}
     * The configuration to apply to the object.
     * @private   
     */
    traverse: function( obj, newConfig ) {
        var me = this;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if ( typeof obj[key] == "object"){
                    console.log(key.magenta+' is an object'.cyan);
                    me.traverse(obj[key]);
                } else if (typeof obj[key] == 'function'){
                    // This is where the classes exist
                    //obj[key].apply(newConfig);
                    console.log(key.yellow.bold+' is a class'.green);
                    console.log(obj[key]);
                }
            }
        }
    },
    
    /**
     * @method
     * Generate a UUID.
     * 
     * **Simple Example**
     * 
     * 		console.log(NGN.uuid()); // --> Outputs a time-based UUID.
     * 		console.log(NGN.uuid(true)); // --> Outputs a random UUID.
     * 
     * @param {Boolean} [random=false]
     * Setting this to `true` generates a random UUID. Otherwise, a time-based UUID is created.
     * @param {Object} [options]
     * Properties may include:
     * 
	 * * `random` - ({Number}[16]) Array of 16 numbers (0-255) to use in place of randomly generated values
	 * * `rng` - ({Function}) Random # generator to use.  Set to one of the built-in generators - `uuid.mathRNG` (all platforms), `uuid.nodeRNG` (node.js only), `uuid.whatwgRNG` (WebKit only) - or a custom function that returns an array[16] of byte values.
	 * * `buffer` - ({Array/Buffer}) Array or buffer where UUID bytes are to be written.
	 * * `offset` - ({Number}) Starting index in `buffer` at which to begin writing.
	 * @param {Array/Buffer}
	 * Array or buffer where UUID bytes are to be written.
	 * @param {Number} Starting index in `buffer` at which to begin writing.
     * @returns {String}
     * @protected
     */
    uuid: function(random, options, buffer, offset){
    	random = random || false;
    	return random == true ? require('node-uuid').v4(options||null,buffer||null,offset||null) : require('node-uuid').v1(options||null,buffer||null,offset||null);
    },
    
    /**
     * @method
     * Run an application.
     * @param {String/URL/Object/Filepath}
     * This argument defines the configuration available to the application. There are several options:
     * 
     * * _String_: If a name is provided, NGN will retrieve the configuration from [NGN Mechanic](#!/guide/mechanic).
     * * _Object_: Manual configuration. (TODO: Reference Guide)
     * * _Filepath_: NGN will `require` this JSON file. 
     * 
     * All methods must provide a valid configuration.
     * TODO: Write the configuration guide.
     * This currently isn't working, but has been included for forward compatibility.
     * @param {Function} callback
     * This method is executed after the configuration is loaded. This is similar to launching your application in an "onReady" fashion.
     * The instance of NGN.core.Process is passed as the only argument to the callback function  
     */
    run: function(config,callback){
    	callback = arguments[arguments.length-1];
    	config = callback == arguments[0] ? {} : arguments[0];
    	
    	if (arguments.length>1){
    	  callback=callback||function(){};
    	}
    	
    	new __NGN.core.Process(config,callback);
    	
    },
    
    /**
     * @method
     * Get the type of a specific object.
     * @returns {String}
     * @protected
     */
    typeOf: function(obj) {
    	return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },
    
    /**
     * @method
     * Finds the first non-null/defined value in a list of arguments.
     * This can be used with {@link Boolean Boolean} values, since `true`/`false` is a 
     * non-null/defined value.
     * @param {Mixed} args
     * Any number of arguments can be passed to this method.
     * @protected
     */
    coalesce: function() {
    	for (var i=0;i<arguments.length;i++){
			if (arguments[i] !== undefined) {
	    		if (this.typeOf(arguments[i]) !== 'null'){
	    			return arguments[i];
	    		}
	    	}
    	}
    	// No values? Return null;
    	return null;
    }
});

module.exports = Class;

/**
 * @class NGNX
 * A library of common extensions.
 * 
 * NGNX extends {@link #NGN} with classes to support common application logic. They're intentionally
 * separated because each class represents is considered opinionated. By abstracting this
 * library from NGN, developers are given a choice about how they define the objects and API's
 * in their application. 
 * 
 * NGNX strives to cover common ground, but will still likely require additional expansion
 * to meet specific application needs. This library is supported in that the classes will function,
 * but it does not warrant that the library will be suitable for every use case. In other words,
 * developers can rely on the existence of these objects, but should remember that the classes in
 * this library are a _best effort_ from NGN developers and contributors to reduce as much boilerplate 
 * code as possible. The goal of NGN & this extension library is to reduce developer's work, not do it
 * for them.
 * @singleton
 */