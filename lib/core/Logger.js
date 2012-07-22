var Base = require('../NGN.core'),
	eyes = require('eyes');

require('colors');

/**
 * @class NGN.core.Logger
 * A generic logging interface. This class, on its own, only logs records
 * to the console. It is designed to provide a common naming standard for methods,
 * which can be consumed by other kinds of objects and overridden by custom loggers.
 * 
 * For example, one application may require JSON logging with [node-bunyan](https://github.com/trentm/node-bunyan) while another requires
 * [winston](https://github.com/flatiron/winston/) and it's transport for Loggly. In such a scenario, this class would be extended
 * by overriding functions like #info, #warn, and #error to use `node-bunyan` or `winston` methods.
 * 
 * As a result of this standardization, other NGN classes can make calls to these common methods, regardless of which underlying logging
 * utility is implemented.   
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a logger.
	 * @params {Object} [config]
	 * @returns {NGN.core.Logger}
	 */
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {Boolean} [exitOnError=false]
			 * Stop the node process/application on error.
			 */
			exitOnError: {
				value:		config.exitOnError || false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [disabled=false]
			 * Set to `true` to disable logging.
			 */
			disabled: {
				value:		config.disabled || false,
				enumerable:	true,
				writable:	true
			}
			
		});
		
	},
	
	/**
	 * @method
	 * Log a record.
	 * @param {Object/String} record
	 * The object or record to be logged.
	 */
	log: function(record) {
		this.info(record);
	},
	
	/**
	 * @method
	 * Logs basic information.
	 * @param {Object/String} record
	 * The object or record to be logged.
	 */
	info: function(record){
		if (!this.disabled) {
			if (typeof record === 'object')
				eyes.inspect(record);
			else
				console.log('INFO: '.yellow.bold+record.yellow);
			this.onInfo(record);
		}
	},
	
	/**
	 * @method
	 * Logs an error.
	 * @param {Object/String} record
	 * The object or record to be logged.
	 */
	error: function(record){
		if (!this.disabled) {
			if (typeof record === 'object')
				eyes.inspect(record);
			else
				console.log('ERROR: '.red.bold+record.red);
			
			this.onError();
		}
	},
	
	/**
	 * @method
	 * Logs a warning.
	 * @param {Object/String} record
	 * The object or record to be logged.
	 */
	warn: function(record){
		if (!this.disabled) {
			if (typeof record === 'object')
				eyes.inspect(record);
			else
				console.log('WARNING: '.magenta.bold+record.magenta);
			this.onWarn(record);
		}
	},
	
	/**
	 * @method
	 * A direct method for disabling logging.
	 */
	disable: function(){
		this.onDisable();
	},
	
	/**
	 * @method
	 * A direct method for enabling logging 
	 */
	enable: function(option){
		this.onEnable();
	},
	
	/**
	 * @method
	 * Toggle whether logging is enabled or not.
	 */
	toggle: function(){
		if (this.disabled)
			this.enable();
		else
			this.disable();
	},
	
	/**
	 * @event log::disabled
	 * Fired when the logging mechanism is disabled.
	 * @returns {NGN.core.Logger}
	 */
	onDisable: function(){
		if (!this.disabled) {
			this.disabled = true;
			this.fireEvent('log::disabled',this);
		}
	},
	
	/**
	 * @event log::enabled
	 * Fired when the logging mechanism is enabled.
	 * @returns {NGN.core.Logger}
	 */
	onEnable: function(){
		if(this.disabled){
			this.disabled = false;
			this.fireEvent('log::enabled',this);
		}
	},
	
	onLog: function(record) {
		this.onInfo(record||null);
	},
	
	/**
	 * @event log::info
	 * Fired when a record is logged.
	 * @param {Object} record
	 */
	onInfo: function(record){
		this.fireEvent('log::info',record||null);
	},
	
	/**
	 * @event log::warn
	 * Fired when a warning is logged.
	 * @param {Object} record
	 */
	onWarn: function(record){
		this.fireEvent('log::warn',record||null);
	},
	
	/**
	 * @event log::error
	 * Fired when an error is logged.
 	 * @param {Object} e
	 */
	onError: function(e) {
		this.fireError(e);
		if (this.exitOnError)
			process.exit();
	}
	
});

module.exports = Class;