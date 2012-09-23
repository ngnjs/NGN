var Base = require('../../BaseClass');

/**
 * @class NGN.model.data.Manager
 * @extends Class
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
					
		});
	}
	
});

module.exports = Class;
