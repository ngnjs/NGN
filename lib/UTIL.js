/**
 * @class UTIL
 * A utility class.
 * @private
 * @experimental
 * @singleton
 */
var obj = {};

// Utilities
Object.defineProperties(obj,{

  // STATICS
  testing: {
    enumerable: false,
    writable: true,
    configurable: false,
    value: false
  },

  /**
   * @property {Boolean} PROXY_SUPPORT
   * Indicates the environment has ES6 Direct Proxy Support
   * @readonly
   * @private
   */
  PROXY_SUPPORT: {
    enumerable: false,
    get: function(){
      return process.execArgv.indexOf('--harmony') > -1;
    }
  },

  _cfg:{
    enumerable: false,
    writable: true,
    value: null
  },


  // METHODS
  /**
   * @property {Object} bufferjoiner
   * A custom buffer joiner.
   */
  bufferjoiner: {
    enumerable: true,
    get: function(){
			return require('./bufferjoiner');
		}
  },
	

  /**
   * @property {Object" watch
   * The watch module.
   * @return {Object}
   */
  watch: {
    enumerable: false,
    get: function(){
      return require('watch');
    }
  },


  /**
   * @method {Object} wrench
   * The wrench utility library.
   * @return {Object}
   */
  wrench: {
    enumerable: false,
    get: function(){
      return require('wrench');
    }
  },


  /**
   * @method writeableDir
   * Determines whether the directory is writeable or not.
   * @param {String} dir
   * The directory in question.
   * @returns {Boolean}
   */
  writeableDir: {
    enumerable: false,
    writable: true,
    value: function(dir){
      var fs = require('fs');
      if (!dir || !fs.existsSync(dir))
        return undefined;

      if (!fs.statSync(dir).isDirectory())
        return undefined;

      /*var testFile = dir+'/'+;
      try {
        fs.writeFileSync(testFile, ' ');
        fs.unlinkSync(testFile);
        return dir;
      } catch (e) {
        return undefined;
      }*/
     return dir;
    }
  },

  tempDir: {
    enumerable: true,
    writable: false,
    value: require('os').tmpDir()
  },

  /**
   * @method notImplemented
   * Log a `NOT IMPLEMENTED` message to the console, indicating what method is not yet implemented in the API.
   * @param {String} filename
   * The absolute path of the file that contains the non-implemented function.
   * @param {String} msg
   * The message to display (such as method name and/or line number).
   */
  notImplemented: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: function(filename,msg){
      if (!this.testing){
        console.log('NOT IMPLEMENTED:'.bold.cyan);
        console.log((filename+':').cyan,msg.yellow,'\n');
      }
    }
  },

  /**
   * @method sleep
   * A generic method to sleep for a specific amount of time.
   * @param {Number} period
   * The number of seconds to sleep.
   */
  sleep: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function(period){
      var st = new Date().getTime();
      while(new Date().getTime() <= st+(period*1000)){}
      return;
    }
  },

  /**
   * @method unrequire
   * Reverts `require('some_module')`. Requires the full path of the module in order to work.
   * @param {String} file (required)
   * The absolute path of the file that should be *un*required.
   * @private
   */
  unrequire: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: function(file){
      delete require.cache[file];
    }
  },

  /**
   * @method uuid
   * Generate a UUID.
   *
   * **Simple Example**
   *
   *     console.log(UTIL.uuid()); // --> Outputs a time-based UUID.
   *     console.log(UTIL.uuid(true)); // --> Outputs a random UUID.
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
   */
  uuid: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: function(random, options, buffer, offset){
      random = typeof random == 'boolean' ? random : false;
      return random == true ? require('node-uuid').v4(options||null,buffer||null,offset||null) : require('node-uuid').v1(options||null,buffer||null,offset||null);
    }
  }
});

module.exports = obj;