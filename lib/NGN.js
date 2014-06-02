/* global UTIL */
/* jshint -W058 */
/* jshint nonew: false */

/**
 * @class NGN
 * @singleton
 * For information about using the NGN namespace, please see the [NGN Namespace Guide](#!/guide/ngn_namespace).
 */
//var x = require('send');
var NGN = require('./Class').extend({

  constructor: function (config) {

    NGN.super.constructor.call(this);

    Object.defineProperties(this, {

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
        enumerable: true,
        get: function () {
          return require(require('path').join(__dirname, '..', 'package.json')).version;
        }
      },

      /**
       * @property {Array}
       * An array of all the global values currently in use.
       */
      globals: {
        enumerable: false,
        get: function () {
          var a = [];
          for (var el in global) {
            if (global.hasOwnProperty(el)){
              a.push(el);
            }
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
        get: function () {
          return this._rootDirCache || (this._rootDirCache = require('path').dirname(process.mainModule.filename));
        }
      },

      /**
       * @property {Array}
       * Stores the extension names. Primarily used for #getExtensions
       * @private
       * @protected
       */
      _xtn: {
        value: [],
        enumerable: false,
        writable: true
      },

      /*
       * @accessor
       * Get the custom extensions recognized by NGN.
       * @returns {Array}
       */
      extensions: {
        enumerable: true,
        get: function(){
          return this._xtn;
        }
      },

      /**
       * @property {NGN.Pattern} pattern
       * A reference to common RegExp patterns.
       * @readonly
       */
      _mask: {
        value: null,
        enumerable: false,
        writable: true
      },

      pattern: {
        enumerable: true,
        get: function () {
          if (this._mask){
            return this._mask;
          }
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
        enumerable: false,
        writable: true,
        value: config.namespace || {}
      },

      /**
       * @method ns
       * A shortcut alias to #createNamespace
       * @alias createNamespace
       * @private
       */
      ns: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: function(){
          return this.createNamespace.apply(this,arguments);
        }
      }
    });

    // Add each framework element to the NGN namespace
    for (var ns in this._namespace) {
      if (this._namespace.hasOwnProperty(ns)){
        Object.defineProperty(this, ns, {
          value: this._namespace[ns],
          enumerable: true,
          writable: true,
          configurable: false
        });
      }
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
  clone: function (obj, nocircular) {
    var clone = require('clone');
    return clone(obj, this.coalesce(nocircular, false));
  },

  /**
   * @method noop
   * An void function.
   * @protected
   */
  noop: function () {},

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
  'import': function (path, namespace) {
    var ns = namespace.split('.'),
      p = require('path'),
      root = {},
      home = {};

    path = this.absolutePath(path);

    // Make sure the path exists
    if (!require('fs').existsSync(path)) {
      console.log((path + ' could not be imported because it does not exist or could not be found.').yellow.bold);
      return;
    }

    // If no global scope is available, create it.
    if (!global.hasOwnProperty(ns[0])) {
      Object.defineProperty(global, ns[0], {
        enumerable: true,
        writable: true,
        configurable: true,
        value: {}
      });
    }

    home = ns[0];
    root = global[ns.shift()];

    // Create or reference subspaces
    ns.forEach(function (el) {
      if (!root.hasOwnProperty(el)) {
        Object.defineProperty(root, el, {
          enumerable: true,
          writable: true,
          configurable: true,
          value: {}
        });
      }
      root = root[el];
    });

    // If the path is a single class, include it and exit.
    if (p.extname(path) === '.js') {
      root[p.basename(path).replace('.js', '')] = require(path);
      return;
    }

    var invalid = [];

    // Include the custom object(s).
    var directory = UTIL.wrench.readdirSyncRecursive(path);

    // Add each file and dir/subdir
    var base = root;
    directory.forEach(function (file) {
      root = base;
      if (p.extname(file) === '.js') {
        var tree = file.replace(path, '').split(p.sep),
          nm = tree.pop().replace('.js', '');

        // Loop through dir/subdir and add appropriate namespace
        tree.forEach(function (el) {
          if (!root.hasOwnProperty(el)) {
            Object.defineProperty(root, el, {
              enumerable: true,
              writable: true,
              configurable: true,
              value: {}
            });
          }
          root = root[el];
        });

        try {
          root[nm] = require(p.resolve(p.join(path, file)));
        } catch (e) {
          UTIL.unrequire(p.resolve(p.join(path, file)));
          if (e.message.indexOf('Cannot call method \'extend\' of undefined') < 0) {
            throw e;
          }
          var treepath = [nm];
          if (tree.length === 0) {
            treepath.unshift(ns);
          }
          invalid.push({
            tree: tree.concat(treepath),
            file: p.resolve(p.join(path, file)),
            ct: 0
          });
        }
      }
    });

    // Attempt to load failed libs/classes
    while (invalid.length > 0) {
      var item = invalid.shift();
      item.ct += 1;
      if (item.ct > invalid.length + 10) {
        throw 'Could not load ' + item.name + '. Too many retries.';
      }
      try {
        var rt = global[home];
        for (var i = 0; i < item.tree.length; i++) {
          rt[item.tree[i]] = rt[item.tree[i]] || (i === (item.tree.length - 1) ? require(item.file) : {});
          rt = rt[item.tree[i]];
        }
      } catch (e) {
        if (e.message.indexOf('Cannot call method \'extend\' of undefined') < 0) {
          throw e;
        }
        invalid.push(item);
      }
    }

  },

  /**
   * @method createNamespace
   * Create a nested object based on a string pattern like "my.namespace.container".
   * @param {String} path
   * The path to create.
   * @alias ns
   */
  createNamespace: function(path) {
    if (path === undefined){
      throw new Error('The "path" argument is not defined.');
    }
    var namespace = path.split('.'), first = namespace.shift(), root;
    global[first] = global[first] || {};
    root = global[first];
    namespace.forEach(function(name){
      root[name] = root[name] || {};
      root = root[name];
    });
    return global[first];
  },

  /**
   * @method absolutePath
   * Returns the absolute path of the specified file/firectory.
   * If the directory does not exist, the path is returned as is.
   * @param {String} path
   * The relative path.
   */
  absolutePath: function (path) {
    var originalPath = path, p = require('path');
    if (path !== p.resolve(path)) {
      path = p.resolve(path);
      if (!require('fs').existsSync(path)) {
        // Local path of the current process
        var root = p.dirname(process.mainModule.filename),
          tmpPath = p.join(root, originalPath);
        if (require('fs').existsSync(tmpPath)) {
          return tmpPath;
        }
        return p.join(path);
      }
      return p.resolve(path);
    }
    return path;
  },

  /*
   * @method define
   * Define a new Class.
   *     NGN.define('ORG.team.Member',{
   *       extend: 'NGN.system.Person',
   *       boss: 'CEO',
   *       division: 'Executive',
   *       paygrade: 2,
   *
   *       getOfficialTitle: function(role){
   *         return role+', Office of the CEO'
   *       }
   *     });
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
      XClass  = null;

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
   * @method createException
   * This method creates custom error definitions with custom properties.
   * For more information, see the [Custom Exceptions Guide](#!/guide/customerrors).
   * @param {Object} config
   * The configuration of the new error.
   * @param {String} [config.name=NgnError]
   * The pretty name of the exception. Alphanumeric characters only (underscore is acceptable).
   * @param {String} [config.type=TypeError]
   * The type of error. This is commonly `TypeError` or `ReferenceError`, but
   * it can be any custom value.
   * @param {String} [config.severity=minor]
   * A descriptive "level" indicating how critical the error is.
   * @param {String} [config.message=Unknown Error]
   * The default message to output when none is specified.
   * @param {Object} [config.custom]
   * Provide a key/value object of custom attributes for the error.
   */
  createException: function(config){
    config = config || {};
    config = typeof config === 'string' ? {message:config} : config;
    config.custom = config.custom || {};

    // Create the error as a function
    var self = this;
    this.errfn = function(message) {

      if (!(this instanceof Error)){
        return new self.errfn(message);
      }

      var me = this;
      this.name = config.name || 'NgnError';
      this.type = config.type || 'TypeError';
      this.severity = config.severity || 'minor';
      this.message = message || config.message || 'Unknown Error';

      // Cleanup name
      this.name = this.name.replace(/[^a-zA-Z0-9_]/gi,'');

      // Add any custom properties
      for (var attr in config.custom) {
        if (config.custom.hasOwnProperty(attr)){
          this[attr] = config.custom[attr];
        }
      }
      this.hasOwnProperty('custom') && delete this.custom;

      // Define private properties of the erro
      Object.defineProperties(this,{
        toString: {
          enumerable: false,
          writable: false,
          configurable: false,
          value: function(){
            return this.name+': '+this.message;
          }
        }
      });

      // Super constructor for Error
      Error.call(this);

      // Capture the stack trace on a new error so the detail can be saved as a structured trace.
      Error.prepareStackTrace = function(_, stack){ return stack; };
      var err = new Error;
      Error.captureStackTrace(err, arguments.callee);

      /*
       * @property {Array} trace
       * The structured data of the stacktrace. Each array element is a JSON object corresponding to
       * the full stack trace:
       *
       *     {
       *       filename: String,
       *       line: Number,
       *       column: Number,
       *       functionname: String,
       *       native: Boolean,
       *       eval: Boolean,
       *       type: String
       *     }
       *
       * @readonly
       */
      Object.defineProperty(this,'trace',{
        enumerable: false,
        writable: false,
        configurable: false,
        value: err.stack.filter(function(frame){
          return frame.getFileName() !== __filename && frame.getFileName();
        }).map(function(frame){
          return {
            filename: frame.getFileName(),
            line: frame.getLineNumber(),
            column: frame.getColumnNumber(),
            functionname: frame.getFunctionName(),
            native: frame.isNative(),
            eval: frame.isEval(),
            type: frame.getTypeName()
          };
        })
      });

      Error.prepareStackTrace = function (err, stack) {
        return me.name+': '+me.message+'\n'+stack.filter(function(frame){
          return frame.getFileName() !== __filename && frame.getFileName();
        }).map(function(el){
          return '    at '+el;
        }).join('\n');
      };

      // Enable stack trace
      Error.captureStackTrace(this);
    };
    this.errfn.prototype = Error.prototype;
    return this.errfn;
  },

  /**
   * @method getConstructor
   * A convenience method for dynamically getting an object constructor by type.
   * This is commonly used in ORM situations where an object type defines metadata.
   * For example
   *
   *     var schemaType = NGN.getConstructor('string');
   *
   * is the same as
   *
   *     var schemaType = String;
   *
   * @param {String} type (required)
   * The type of object.
   * @protected
   */
  getConstructor: function (type) {
    type = type || '';
    switch (type.trim().toLowerCase()) {
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
    this.emit('error',type + ' is not an understood constructor type.');
  },

  /**
   * @method traverse
   * Recursively traverse a namespace and apply new configuration elements to subclasses.
   * @param {Object} namespace
   * The namespace.
   * @param {Object} newConfig
   * The configuration to apply to the object.
   * @private
   */
  traverse: function (namespace, newConfig) {
    var me = this;
    for (var key in namespace) {
      if (namespace.hasOwnProperty(key)) {
        if (typeof namespace[key] === "object") {
          //console.log(key.magenta + ' is an object'.cyan);
          me.traverse(namespace[key]);
        } else if (typeof namespace[key] === 'function') {
          // This is where the classes exist
          namespace[key].apply(newConfig);
          //console.log(key.yellow.bold + ' is a class'.green);
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
  uuid: function (random, options, buffer, offset) {
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
  run: function (config, callback) {
    callback = arguments[arguments.length - 1];
    config = callback === arguments[0] ? {} : arguments[0];

    if (arguments.length > 1) {
      callback = callback || function () {};
    }

    new NGN.core.Process(config, callback);

  },

  /**
   * @method typeOf
   * Get the type of a specific object.
   * @returns {String}
   * @protected
   */
  typeOf: function (obj) {
    if (obj === undefined){
      return 'undefined';
    }
    if (obj === null){
      return 'null';
    }
    if (['true','false'].indexOf(obj.toString()) >= 0){
      return 'boolean';
    }
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
  coalesce: function () {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined) {
        if (this.typeOf(arguments[i]) !== 'null') {
          return arguments[i];
        }
      }
    }
    // No values? Return null;
    return null;
  }
});

module.exports = NGN;
