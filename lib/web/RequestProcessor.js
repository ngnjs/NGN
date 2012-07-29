var Base = require('../BaseClass');

/**
 * @class NGN.web.RequestProcessor
 * A middleware class for processing web requests with custom logic.
 * @extends Class
 * @private
 * @author Corey Butler
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [type=prerequest]
			 * The type of processor. Acceptable values are listed in the order executed:
			 * 
			 * * preauthentication
			 * * postauthentication
			 * * preauthorization
			 * * postauthorization
			 * * prerequest
			 * * postrequest
			 * 
			 * These are only processed if the NGN.core.HttpServers uses them. 
			 */
			type: {
				value:		config.type || 'prerequest',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [ignoreContinue=false]
			 * When set to `true`, the middleware #fn must explicity call the `continue()` method.
			 */
			ignoreContinue: {
				value:		config.disableContinue || false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @proeprty {Boolean}
			 * Indicates the processor instance is currently in use by a NGN.core.HttpServer.
			 * @private
			 */
			_used: {
				value:		false,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [enabled=true]
			 * If this is set to `false`, the processor is ignored.
			 */
			enabled: {
				value:		config.enabled || true,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Function}
			 * The function used for processing the request. This method receives three arguments: `request`, `response`, and `continue` (respectively).
			 * `continue` is a method that should always be executed at the end of the processor, otherwise the request may hang. This is automatically 
			 * done if #ignoreContinue is `false`. 
			 * 
			 * **Example**
			 * 		function(req,res,cont){
			 * 			if (request.)
			 * }
			 */
			fn: {
				value:		config.fn || __NGN.emptyFn,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @property {Function}
			 * The wrapper function that is called by the NGN.core.HttpServer.
			 * @private
			 */
			_fn: {
				value:		null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @property {Function}
			 * The processor function.
			 */
			processor: {
				enumerable:	true,
				get:		function(){ return this._fn; }
			}
			
		});
		
		var me = this;
		
		this._fn = function(req,res,next){
			if (!me.enabled){
				next();
			} else {
				me.fn(req,res,next);
				if (!me.ignoreContinue)
					next();
			}
		};
		
	},
	
	/**
	 * @method
	 * Disable the middleware
	 */
	disable: function(){
		this.enabled = false;
	},
	
	/**
	 * @method
	 * Enable the middleware
	 */
	enable: function(){
		this.enabled = true;
	},
	
	/**
	 * @method
	 * Toggle the middleware on/off
	 */
	disable: function(){
		this.enabled = !this.enabled;
	}
});

module.exports = Class;