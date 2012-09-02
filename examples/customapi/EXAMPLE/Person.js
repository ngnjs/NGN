require('../../../');

/**
 * @class EXAMPLE.Person
 * This is an example of a custom API. Developers can build their own API's
 * using the NGN and NGNX libraries as a base. 
 * 
 * An example of using this code in a node process would be:
 * 
 * 		require('ngn');
 * 
 * 		var person = new EXAMPLE.Person();
 * 
 * _Outputs:_
 * 		I am person 2.0
 * 
 * Make sure you view the source (hover over EXAMPLE.Person at the top of the page) to see how this extension is created. You may be
 * surprised by how little code there is. Most of it is documentation.
 * @extends NGNX.Person
 */
var Class = NGN.define('EXAMPLE.Person',{
	
	extend: 'MODEL.Person',
	
	/**
	 * @constructor
	 * This constructor is bare, except for a single console output when the object is created.
	 * @param {Object} config
	 */
	constructor: function(config){
		
		Class.super.constructor.call(this,config);
		
		console.log('I am person 2.0'); // This, along with sayHello is the only "custom logic" in the class. The rest is boilerplate. 
		
	},
	
	/**
	 * @method
	 * Say hello.
	 */
	sayHello: function() {
		console.log(this.firstname+' says hi.');
	}
	
});

module.exports = Class;