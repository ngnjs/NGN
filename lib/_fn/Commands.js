/**
 * @class $
 * A common function library. 
 */
module.exports = {
	
	/**
     * @method
     * Deep clones an object and returns it as a copy (not a reference). This uses NGN#clone.
     * @param {Object} obj
     * The object to clone.
     * @param {Boolean} [noCircular=false]
     * Set this to true if you are certain there are no circular references
     * in the object (performance gain).
     * @return {Object}
     */
    clone: function(obj, nocircular) {
    	return __NGN.clone(obj,nocircular);	
	},
	
	/**
     * @method
     * Finds the first non-null/defined value in a list of arguments.
     * This can be used with {@link Boolean Boolean} values, since `true`/`false` is a 
     * non-null/defined value. Uses NGN#coalesce.
     * @param {Mixed} args
     * Any number of arguments can be passed to this method.
     */
    coalesce: function() {
    	__NGN.coalesce(arguments);
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
	 * 
	 * Uses NGN#uuid.
	 * @param {Array/Buffer}
	 * Array or buffer where UUID bytes are to be written.
	 * @param {Number} Starting index in `buffer` at which to begin writing.
     * @returns {String}
     * @protected
     */
    uuid: function(random, options, buffer, offset){
    	return __NGN.uuid(random,options,buffer,offset);
    },
    
    /**
     * @method
     * Recursively traverse a namespace and apply new configuration elements to classes.
     * This is a shortcut to NGN#traverse.
     * @param {Object}
     * The namesapce object.
     * @param {Object}
     * The configuration to apply to the object.
     */
    traverse: function( obj, newConfig ) {
    	__NGN.traverse(obj,newConfig);
    },
    
    /**
     * @method
     * A convenience method for using NGN.core.Command#exec.
     */
    exec: function() {
    	__NGN.exec(arguments);
    },
    
    /**
     * @method
     * Get the type of a specific object.
     * @returns {String}
     * Uses NGN#typeOf.
     */
    typeOf: function(obj) {
    	return __NGN.typeOf(obj);
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
	 * Uses NGN#getConstructor.
	 */
	getConstructor: function(type){
		return __NGN.getConstructor(type);
	}
}
