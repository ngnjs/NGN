/**
 * @class NGN
 * @singleton
 * For information about using the NGN namespace, please see the [NGN Namespace Guide](#!/guide/ngn_namespace).
 */
var Base = require('./Class');
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

          _rootDirCache: {
            enumerable: false,
            writable: true,
            configurable: false,
            value: null
          },

          /**
           * @property {String} rootDir
           * The root directory of the running process.
           */
          rootDir: {
            enumerable: true,
            get: function(){
              return this._rootDirCache || (this._rootDirCache = require('path').dirname(process.mainModule.filename));
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
           * @property {NGN.Pattern} pattern
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
		            		this._mask = new NGN.Pattern();
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
     * @method clone
     * Deep clones an object and returns it as a copy (not a reference).
     * @param {Object} obj
     * The object to clone.
     * @param {Boolean} [noCircular=false]
     * Set this to true if you are certain there are no circular references
     * in the object (performance gain).
     * @return {Object}
     */
    clone: function(obj, nocircular) {

    	nocirculr = NGN.coalesce(nocircular,false);

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

    /*
     * @accessor
     * Get the custom extensions recognized by NGN.
     * @returns {Array}
     */
    getExtensions: function() {
    	return this._xtn;
    },

    /**
     * @method import
     * Import a custom NGN library/extension.
     *
     * Import a single custom class:
     *
     *      NGN.import('/path/to/myCustomClass.js');
     *
     * Import a directory of custom classes (recursive):
     *
     *      NGN.import('/path/to/dir');
     *
     * For more information about creating and using custom extensions,
     * please review the [Extending the API](#!/guide/custom_extensions) guide.
     * @param {String} path
     * The path to the file or directory where the custom class/library exists.
     * @param {String} namespace
     * The namespace to use for the imported class/library.
     *
     * This could be an extension to an existing NGN namespace or a custom namespace, such
     * as `MY` or `MY.org`.
     *
     * If the goal is to create a custom user available via `MY.User`, a file called `User.js`
     * should be created. Developers may choose to extend an existing NGN class (like NGN.model.Person),
     * or create a completely independent module. Regardless, this module could be imported into
     * an application using the following code:
     *
     *      NGN.import('/path/to/User.js','MY');
     *
     *      or
     *
     *      NGN.import('/path/to/User.js','MY.org');
     *
     * The `import()` method uses the filename as the name of the class. In this case, the file
     * is called `User.js`, so the generated object name is `User`.
     *
     * As a result, a global namespace called `MY` is created, making the custom module/class
     * available in a manner like:
     *
     *      var myUser = new MY.User();
     *
     *      or
     *
     *      var myUser = new MY.org.User();
     *
     */
    'import': function(path,namespace){
      var ns = namespace.split('.'),
          p = require('path'),
          root = {},
          home = {};

      path = p.resolve(path);

      // Make sure the path exists
      if (!require('fs').existsSync(path)){
        console.log((path+' could not be imported because it does not exist or could not be found.').yellow.bold);
        return;
      }

      // If no global scope is avialable, create it.
      if (!global.hasOwnProperty(ns[0])){
        Object.defineProperty(global,ns[0],{
          enumerable: true,
          writable: true,
          configurable: true,
          value: {}
        });
      }

      home = ns[0];
      root = global[ns.shift()];

      // Create or reference subspaces
      ns.forEach(function(el){
        if (!root.hasOwnProperty(el)){
          Object.defineProperty(root,el,{
            enumerable: true,
            writable: true,
            configurable: true,
            value: {}
          });
        }
        root = root[el];
      });

      // If the path is a single class, include it and exit.
      if (p.extname(path) == '.js'){
        root[p.basename(path).replace('.js','')] = require(path);
        return;
      }

      var invalid = [];

      // Include the custom object(s).
      var directory = UTIL.wrench.readdirSyncRecursive(path),
          cwd = process.cwd();

      // Add each file and dir/subdir
      var base = root;
      directory.forEach(function(file){
        root = base;
        if (p.extname(file) == '.js'){
          var tree = file.replace(path,'').split(p.sep),
              nm = tree.pop().replace('.js','');

          // Loop through dir/subdir and add appropriate namespace
          tree.forEach(function(el){
            if(!root.hasOwnProperty(el)){
              Object.defineProperty(root,el,{
                enumerable: true,
                writable: true,
                configurable: true,
                value: {}
              });
            }
            root = root[el];
          });

          try {
            root[nm] = require(p.resolve(p.join(path,file)));
          } catch (e) {
            UTIL.unrequire(p.resolve(p.join(path,file)));
            if(e.message.indexOf('Cannot call method \'extend\' of undefined') < 0){
              throw e;
            }
            invalid.push({
              tree: tree.concat([nm]),
              file: p.resolve(p.join(path,file)),
              ct: 0
            });
          }
        }
      });

      // Attempt to load failed libs/classes
      while(invalid.length > 0){
        var item = invalid.shift();
        item.ct += 1;
        if (item.ct > invalid.length+10){
          throw 'Could not load '+item.name+'. Too many retries.';
        }
        try {
          var rt = global[home];
          for (var i=0; i<item.tree.length; i++){
            rt[item.tree[i]] = rt[item.tree[i]] || (i==(item.tree.length-1) ? require(item.file) : {});
            rt = rt[item.tree[i]];
          }
        } catch (e) {
          if(e.message.indexOf('Cannot call method \'extend\' of undefined') < 0){
            throw e;
          }
          invalid.push(item);
        }
      }

    },

    /*
  	 * @method define
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
  	/*
  	define: function(cls, xconfig) {
  		var ns = cls.split('.'),
  			XClass	= null;

  		if ((ns[0].trim().toUpperCase() == 'NGN' || ns[0].trim().toUpperCase() == 'NGN') && ns.length == 1)
        throw Error('Cannot override the NGN namespace.');

      if ((ns[0].trim().toUpperCase() == 'UTIL' || ns[0].trim().toUpperCase() == 'UTIL') && ns.length == 1)
        throw Error('Cannot override the UTIL namespace.');

      var source = (xconfig['extend'] || 'NGN.Class').trim();

      switch(source){
        case 'CLASS':
        case 'BASECLASS':
          XClass = BASECLASS;
          break;
        default:
          if (['REGEXP','STRING','OBJECT','NUMBER','FUNCTION','DATE','BOOLEAN','ARRAY'].indexOf(source.toUpperCase()) >= 0){
            throw Error(target+' cannot be extended. Core JavaScript objects are not part of the NGN class system.');
          } else {
            var src = source.split('.').slice(0),
              first = src.shift();

            XClass = global[first];

            // Get the appropriate class namespace
            src.forEach(function(n){
              XClass = XClass[n];
            });
          }
      }

      if (xconfig.hasOwnProperty('extend')){
        delete xconfig['extend'];
      }

      // Create the target namespace
      var main = ns.shift();

      if (global[main] == undefined){
        Object.defineProperty(global,main,{
          enumerable: true,
          writable: true,
          value: ns.length > 0 ? {} : XClass.extend(xconfig)
        });
      }

      if (ns.length > 0){
        var tmp = global[main];
        ns.forEach(function(n){
          Object.defineProperty(tmp,n,{
            enumerable: true,
            writable: true,
            value: n !== ns[ns.length-1] ? {} : XClass.extend(xconfig)
          });
          tmp = tmp[n];
        });
      }

      return tmp;
  	},
    */

  	/**
  	 * @method getConstructor
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
     * @method traverse
     * Recursively traverse a namespace and apply new configuration elements to classes.
     * @param {Object} namespace
     * The namespace.
     * @param {Object} newConfig
     * The configuration to apply to the object.
     * @private
     */
    traverse: function( namespace, newConfig ) {
        var me = this;
        for (var key in namespace) {
            if (namespace.hasOwnProperty(key)) {
                if ( typeof namespace[key] == "object"){
                    console.log(key.magenta+' is an object'.cyan);
                    me.traverse(namespace[key]);
                } else if (typeof namespace[key] == 'function'){
                    // This is where the classes exist
                    //namespace[key].apply(newConfig);
                    console.log(key.yellow.bold+' is a class'.green);
                    console.log(namespace[key]);
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
     *     console.log(NGN.uuid()); // --> Outputs a time-based UUID.
     *     console.log(NGN.uuid(true)); // --> Outputs a random UUID.
     *
     * @param {Boolean} [random=false]
     * Setting this to `true` generates a random UUID. Otherwise, a time-based UUID is created.
     * @param {Object} [options]
     * Properties may include:
     *
  	 * * `random` - {@link Number}[16] Array of 16 numbers (0-255) to use in place of randomly generated values
  	 * * `rng` - {@link Function} Random # generator to use.  Set to one of the built-in generators - `uuid.mathRNG` (all platforms), `uuid.nodeRNG` (node.js only), `uuid.whatwgRNG` (WebKit only) - or a custom function that returns an array[16] of byte values.
  	 * * `buffer` - {@link Array}/{@link Buffer}) Array or buffer where UUID bytes are to be written.
  	 * * `offset` - {@link Number} Starting index in `buffer` at which to begin writing.
  	 * @param {Array/Buffer} [buffer]
  	 * Array or buffer where UUID bytes are to be written.
  	 * @param {Number} [offset]
  	 * Starting index in `buffer` at which to begin writing.
     * @returns {String}
     * @protected
     * @deprecated 0.0.8 Use {@link UTIL#uuid} instead.
     */
    uuid: function(random, options, buffer, offset){
    	return UTIL.uuid(random, options, buffer, offset);
    },

    /**
     * @method run
     * Run an application.
     * @param {String/URL/Object/Filepath} config
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
     * @param {NGN.core.Process} callback.process The process which was created.
     */
    run: function(config,callback){
    	callback = arguments[arguments.length-1];
    	config = callback == arguments[0] ? {} : arguments[0];

    	if (arguments.length>1){
    	  callback=callback||function(){};
    	}

    	new NGN.core.Process(config,callback);

    },

    /**
     * @method typeOf
     * Get the type of a specific object.
     * @returns {String}
     * @protected
     */
    typeOf: function(obj) {
      if (!obj)
        return undefined;
    	return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },

    /**
     * @method coalesce
     * Finds the first non-null/defined value in a list of arguments.
     * This can be used with {@link Boolean Boolean} values, since `true`/`false` is a
     * non-null/defined value.
     * @param {Mixed} args
     * Any number of arguments can be passed to this method.
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