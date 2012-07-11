/**
 * @class MY.Person
 * Represents a user/person in MY platform.
 * @extends NGN.user.Person 
 */
var Person = NGN.user.Person.extend({
    constructor: function() {
        
        Person.super.constructor.call(this);
        console.log('I am Person 2.0!');
    }
});

module.exports = exports = Person;
