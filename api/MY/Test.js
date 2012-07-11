/**
 * @class MY.Test
 * Just a test
 * @extends NGN 
 */
var Person = NGN.extend({
    constructor: function() {
        
        Person.super.constructor.call(this);
        console.log('I am Test!');
    }
});

module.exports = exports = Person;
