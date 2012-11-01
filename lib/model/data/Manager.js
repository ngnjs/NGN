var Base = require('../../BaseClass');

/**
 * @class NGN.model.data.Manager
 * A data manager controls how data is saved/fetched from a data source.
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
		
	},
	
});

module.exports = Class;
