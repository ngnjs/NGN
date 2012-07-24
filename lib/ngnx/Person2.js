var Base = require('../app/Person');

/**
 * @class NGNX.Person
 * This is a placeholder for an extended version of Person.
 */
var Class = Base.extend({
	
	constructor: function(config){
		Class.super.constructor.call(this,config);
		
		console.log('I am an extended person.');
	}
	
});

module.exports = Class;