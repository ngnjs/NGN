var passport = require('passport'),
	Base	 = require('../../NGN.core');

/**
 * @class NGN.web.auth.Strategy
 * Provides an authorization strategy for a NGN.web.Server.
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		Class.super.constructor.call(this,config);
		
	}
	
});

module.exports = Class;