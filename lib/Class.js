/**
 * @class Class
 * A base class providing a simple inheritance model for JavaScript classes. All
 * API classes are an extension of this model.<br/><br/>
 * **Example:**
 * 	   // Superclass
 *     var Vehicle = Class.extend({
 *         constructor: function (type) {
 *             this.type = type;
 *         },
 *         accelerate: function() {
 *             return this.type+' is accelerating';
 *         }
 *     });
 *
 *     // Subclass
 *     var Car = Vehicle.extend({
 *         constructor: function (doorCount) {
 *              Car.super.constructor.call(this, 'car');
 *
 *              Object.defineProperty(this,'doors',{
 *                  value:      doorCount || 4, // Default = 4
 *                  writable:   true,
 *                  enumerable: true
 *              });
 *         },
 *         accelerate: function () {
 *             console.log('The '+this.doors+'-door '+ Car.super.accelerate.call(this));
 *         }
 *     });
 *
 *     var mustang = new Car(2);
 *     mustang.accelerate();
 *
 *     //Outputs: The 2-door car is accelerating.
 *
 * @docauthor Corey Butler
 * @aside guide class_system
 */
var Class = {

	/**
	 * @method extend
	 * The properties of the object being extended.
	 *	   // Subclass
     *     var Car = Vehicle.extend({
     *         constructor: function (doors) {
     *              Car.super.constructor.call(this, 'car');
     *
     *              Object.defineProperty(this,'doors',{
     *                  value:      doors || 4,
     *                  writable:   true,
     *                  enumerable: true
     *              });
     *         },
     *         accelerate: function () {
     *             console.log('The '+this.doors+'-door '+ Car.super.accelerate.call(this));
     *         }
     *     });
	 * @param {Object} obj
	 * The object containing `constructor` and methods of the new object.
 	 * @returns {Object}
	 */
    extend: function ( obj ) {
        var parent      = this.prototype || Class,
            prototype   = Object.create(parent);

        Class.merge(obj, prototype);

        var _constructor = prototype.constructor;
        if (!(_constructor instanceof Function)) {
            throw Error("No constructor() method.");
        }

        /**
         * @property {Object} prototype
         * The prototype of all objects.
         * @protected
         */
        _constructor.prototype = prototype;

        /**
         * @property super
         * Refers to the parent class.
         * @protected
         */
        _constructor.super = parent;

        // Inherit class method
        _constructor.extend = this.extend;

        return _constructor;
    },

    /**
     * @method merge
     * Merges the source to target
     * @private
  	 * @param {Object} [source]
  	 * Original object.
  	 * @param {Object} target
  	 * New object (this).
  	 * @param {Boolean} [force=false]
  	 * @returns {Object}
     */
    merge: function(source, target, force) {
    	target = target || this;
    	force = force || false;
        Object.getOwnPropertyNames(source).forEach(function(attr) {

        	// If the attribute already exists,
        	// it will not be recreated, unless force is true.
        	if (target.hasOwnProperty(attr)){
        		if (force)
        			delete target[attr];
        	}

	        if (!target.hasOwnProperty(attr))
		        Object.defineProperty(target, attr, Object.getOwnPropertyDescriptor(source, attr));

        });

		return target;
    }
};

// Make the class available as a module.
module.exports = Class;