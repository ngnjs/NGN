var events = require('events');
/**
 * @class NGN.core
 * @singleton
 * @private
 * @extends Class
 * This singleton exposes core business objects that node.js can use in an application. All NGN objects 
 * inherit this class. It should never be used directly in application logic, but it should be used to 
 * extend the NGN namespace/API.
 * 
 * The factory provides common functionality that can be used throughout multiple objects in the
 * extended API. It provides business logic that is more specific to NGN than the {@link BaseClass}.
 * 
 * The following example is an extremely abbreviated version of the NGN.app.Person class.
 *     @example
 *     NGN.core = require('../NGN.core');
 * 
 *     var Person = NGN.core.extend({
 *         constructor: function( config ){
 *             Person.super.constructor.call( this, config );
 * 			   this.first = config.first  || 'Unknown';
 *             this.last  = config.last   || 'Unknown';
 *             this.middle= config.middle || null
 *         },
 *         describe: function() {
 *             console.log('This is '+this.first+' '+(this.middle!==null?this.middle:'')+this.last);
 *         },
 *         register: function() {
 * 	           // Register the user or save all attributes to a database.
 *         }
 *     });
 *
 *     // Create a module out of this.
 *     module.exports = Person;
 * 
 * The factory provides a foundation on which the other objects can be built. Using the `Person` in the example above,
 * a developer could create and register a new user with the following approach:
 * 
 *     @example
 *     var Person = new NGN.app.Person({ first:'John', last:'Doe' }); 
 * 
 *     Person.register();
 * 
 * NGN.**user**.Person is a dynamically constructed namespace, created primarily to more easily understand the business
 * logic of the API. {@link NGN} is responsible for constructing this namespace.
 * @requires NGN
 * @aside guide class_system
 */
var Class = require('./BaseClass').extend({
	
	constructor: 	function( config ) {
		
						config = config || {};
						
						Class.super.constructor.call(this, config);
						 
					},

	/**
	 * @property
	 * An event emitter for the class. Used internally.
	 * @protected
	 */					
	_emitter:		Object.create(events.EventEmitter.prototype),
	
	/**
	 * @method
	 * Emits an event respective of the object context (i.e. not bubbled to a global level event)
     * @param {String} eventName
     * @param {Object} [metadata]
	 */
	emit: 			function( eventName, metadata ) {
						this._emitter.emit(eventName, metadata || null);
					},
	       
    /**
     * @method
     * Fires the specified event. Unlike #emit, this event is bubbled to the NGN#BUS.
     * @param {String} eventName
     * @param {Object} [metadata]
     */
    fireEvent: 		function( eventName, metadata ) {
				        __NGN.BUS.emit( eventName, metadata || null );
				    },
    
    /**
     * @method
     * Fires the specified error.
     * @param {Object} [metadata]
     */
    fireError: 		function( err ) {
				        this.fireEvent( 'error', err || null );
				    },
	
	/**
	 * @method
	 * Listens for an event name and runs the callback when it is recognized.
	 * @param {String} eventName
	 * @param {Function} callback
	 */
	on: 			function( eventName, callback ) {
						this._emitter.on(eventName, callback || function(){});
						__NGN.BUS.addListener(eventName, callback || function(){});
					},
	
	/**
	 * @method
	 * Adds multiple event listeners
 	 * @param {Array} evt
	 */
	addEventListeners: function(evt){
						for(var i=0;i<evt.length;i++)
							this.on(evt[i].trim().toLowerCase(),this['on'+evt[i].trim()]);
					},
					
	/**
	 * @method
	 * Creates a global variable.
	 * @param {String} name
	 * The namespace to be created.
	 * @param {Object} obj
	 * The object which is being referenced.
	 * @param {Booean} overwriteExisting
	 * Recreate the namespace using the new object.
	 */
	createRef:		function(name,obj,overwriteExisting){
						overwriteExisting = overwriteExisting || false;
						if (global[name] == undefined || (global[name] !== undefined && overwriteExisting))
							global[name] = obj;
					}
});

// Export the module for use in require() statements
module.exports = Class;