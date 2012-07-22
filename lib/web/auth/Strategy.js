var passport = require('passport'),
	Base	 = require('../../NGN.Base');

/**
 * @class NGN.http.auth.Strategy
 * Provides an authorization strategy for a NGN.http.Server.
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		Class.super.constructor.call(this,config);
		
	}
	
});

module.exports = Class;