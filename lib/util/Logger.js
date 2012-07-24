var Base = require('../core/Syslog');

/**
 * @class NGN.util.Logger
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
 * @extends NGN.core.Syslog 
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a logger.
	 * @params {Object} [config]
	 * @returns {NGN.core.Syslog}
	 */
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
	}
		
});

module.exports = Class;