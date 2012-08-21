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
        	 * @property {String}
        	 * The running version of NGN.
        	 * @readonly
        	 */
        	version: {
            	enumerable:	true,
            	get:		function() {
			            		return require(__NGN.path.join(__dirname,'..','package.json')).version;
			            	}
            },
            
            /**
             * @property {Object} [app={}]
             * The application scope. This scope is created when a new NGN.app.Application is created.
             * Alternatively, NGN#application will automatically create the application an populate this
             * scope. This is the more common approach to creating a globally accessible application variable. 
             */
            app: {
            	value:		{},
            	enumerable:	true,
            	writable:	true
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
             * @static
             */
            pathSeparator: {
            	enumerable:	true,
            	get:		function() { return require('path').sep; }
            },
            
            /**
             * @property {Object}
             * A convenience reference to node's [dns](http://nodejs.org/api/dns.html) object.
             * 
             * This object contains several methods for DNS requests.
             * 
             * * **NGN.DNS.lookup(domain, [family], callback)**
			 * * **NGN.DNS.resolve(domain, [rrtype], callback)**
			 * * **NGN.DNS.resolve4(domain, callback)**
			 * * **NGN.DNS.resolve6(domain, callback)**
			 * * **NGN.DNS.resolveMx(domain, callback)**
			 * * **NGN.DNS.resolveTxt(domain, callback)**
			 * * **NGN.DNS.resolveSrv(domain, callback)**
			 * * **NGN.DNS.resolveNs(domain, callback)**
			 * * **NGN.DNS.resolveCname(domain, callback)**
			 * * **NGN.DNS.reverse(ip, callback)**
             * 
             * @static
             * @readonly
             */
            dns: {
            	enumerable:	true,
            	get:		function() { return require('dns'); }
            },
            
            /**
             * @property
             * A convenience reference to node's [os](http://nodejs.org/api/os.html) object.
             * 
             * This object contains several methods to reveal OS-level information:
             * 
             * * **NGN.OS.tmpDir()**
			 * * **NGN.OS.hostname()**
			 * * **NGN.OS.type()**
			 * * **NGN.OS.platform()**
			 * * **NGN.OS.arch()**
			 * * **NGN.OS.release()**
			 * * **NGN.OS.uptime()**
			 * * **NGN.OS.loadavg()**
			 * * **NGN.OS.totalmem()**
			 * * **NGN.OS.freemem()**
			 * * **NGN.OS.cpus()**
			 * * **NGN.OS.networkInterfaces()**
			 * * **NGN.OS.EOL**
			 * * **NGN.OS.fileSeparator**
			 * @readonly
			 * @static
             */
            os: {
            	eumerable:	true,
            	get: 		function() { return require('os')}
            },
            
            /**
		 	 * @property {Object}
		 	 * A convenience reference to node's [path](http://nodejs.org/api/path.html) object.
		 	 * 
		 	 * This object contains several methods for string manipulation of filepaths.
		 	 * 
		 	 * * **NGN.path.normalize('/foo/bar//baz/asdf/quux/..')** returns `'/foo/bar/baz/asdf'`
		 	 * * **NGN.path.join([path1], [path2], [...])** returns `'path1/path2'
			 * * **NGN.path.resolve([from ...], to)** resolves to an absolute path.
			 * * **NGN.path.relative(from, to)** resolves to a relative directory path. This is used when traversing from one directory to another.
			 * * **NGN.path.dirname(p)** if p = '/my/path', returns `/my/path`
			 * * **NGN.path.basename(p, [ext])** returns the filename portion of the path.
			 * * **NGN.path.extname(p)** returns the extension of the filename portion of the path.
			 * 
			 * @static
			 * @readonly
		 	 */
		 	path: {
		 		enumerable:	true,
		 		get:		function(){ return require('path'); },
		 	},
            
            /**
             * @property {String}
             * The root directory in which the node process is running (cwd). For example, running
             * `node /path/to/myapp.js` would be `/path/to`.
             * @static
             * @readonly
             */
            _cwd: {
            	value:		null,
            	enumerable:	false,
            	writable:	true
            },
            rootDir: {
            	enumerable:	true,
            	get:		function() { if (this._cwd == null) this._cwd = process.cwd(); return this._cwd; }
            },
            
            /**
             * @property {String}
             * The current working directory. This is the same as #rootDir.
             * @readonly
             */
            cwd: {
            	enumerable: true,
            	get:		function() { return this.rootDir; }
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
             * @property {NGN.core.Command}
             * A reference to the command line interface.
             */
            command: {
            	enumerable:	true,
            	get:		function() {
			            		if (this._cmd == null)
			            			this._cmd = new __NGN.core.Command();
			            		return this._cmd;
			            	}
            },
            
             _cmd: {
            	value:		null,
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
			            		this._mask = new __NGN.Patterns();
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
        
        this.os.fileSeparator = this.fileSeparator;
        
        // Add each framework element to the NGN namespace
        for (var ns in this._namespace) {
            Object.defineProperty(this,ns,{
                value:      this._namespace[ns],
                enumerable: true,
                writable:   true,
                configurable: false
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
     * @method {Function}
     * An void function.
     * @protected
     */
    emptyFn: function(){},
            
    /**
     * @method
     * A convenience method for using NGN.core.Command#exec.
     */
    exec: function() {
    	this.command.exec(arguments);
    },
    
    /**
     * @accessor
     * Get the custom extensions available to the application.
     * @returns {Array} 
     */
    getExtensions: function() {
    	return this._xtn;
    },
    
    /**
	 * @method
	 * A shortcut method for creating new classes.
	 * 		NGN.define('ORG.team.Member',{
	 * 			extend: 'NGN.app.Person',
	 * 			boss: 'CEO',
	 * 			division: 'Executive',
	 * 			paygrade: 2,
	 * 			
	 * 			getOfficialTitle: function(role){
	 * 				return role+', Office of the CEO'
	 * 			}
	 * 		});
	 * The example above would extend `NGN.app.Person` to create `ORG.team.Person`.
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
     */
    uuid: function(random, options, buffer, offset){
    	random = random || false;
    	return random == true ? require('node-uuid').v4(options||null,buffer||null,offset||null) : require('node-uuid').v1(options||null,buffer||null,offset||null);
    },
    
    /**
     * @method
     * Create or load an application.
     * @param {String/URL/Object/Filepath}
     * This argument defines the configuration available to the application. There are several options:
     * 
     * * #String: If a simple string is provided, NGN will look for a local NGN Application Server and use the configuration it provides.
     * * URL: Supports loading a configuration from a remote NGN Application Server.
     * * #Object: This is the manual way of configuring the application. (TODO: Reference Guide)
     * * Filepath: NGN will `require` this file, assuming it to be either a module or JSON object. 
     * 
     * All methods must provide a valid configuration.
     * TODO: Write the configuration guide.
     * This currently isn't working, but has been included for forward compatibility.
     * @param {Function}
     * This method is executed after the configuration is loaded. This is similar to launching your application in an "onReady" fashion.
     */
    application: function(config,callback){
    	//TODO: Load config asynchronously, then execute callback. This is just a wrapper right now.
    	callback = arguments[arguments.length-1];
    	config = callback == arguments[0] ? {} : arguments[0];

    	new __NGN.app.Application(config);
    	
    	if (typeof callback == 'function')
			callback();
    },
    
    /**
     * @method
     * Get the type of a specific object.
     * @returns {String}
     */
    typeOf: function(obj) {
    	return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },
    
    /**
     * @method
     * Finds the first non-null/defined value in a list of arguments.
     * This can be used with {Boolean} values, since `true`/`false` is a 
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