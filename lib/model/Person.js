var stripe      = require('stripe'),
    crypto      = require('crypto'),
    Base 		= require('./Model');

/**
 * @class MODEL.Person
 * Represents a human being/actor in the ecosystem. 
 * This could be a system user, customers, administrators, or any other type of person.
 * 
 * **Simple Person**
 * 	var person = new MODEL.Person({
 * 		firstName: 	'John',
 * 		lastName:	'Doe',
 * 		gender:		'm'
 * 	});
 * 		
 * 	console.log('Hi '+person.firstName+'!'); // --> Hi John!
 * 
 * This trivial example doesn't do much, but it represents how a person can be modeled and used throughout
 * application code. Of course, this becomes more powerful when using the built-in methods or combining with
 * other MODEL objects. 
 *  
 * **Create A Person**
 * 
 * Most applications need to persist objects like Person to a data store. This is accomplished using a CRUD
 * object, similar to the following:
 * 	var person = new MODEL.Person({
 *			CRUD: 		new NGNX.datasource.crud.MongoDB({
 *							datasource: 'models',
 *							map: 		{
 *											Person: {
 *												'firstName': 	'fn',
 *												'middleName': 	'mn',
 *												'lastName': 	'ln',
 *												'gender': 		'sex',
 *												'image': 		'img'
 *											}
 *										}
 *						}),
 * 		gender:		'm',
 *			firstName:	'John',
 *			lastName:	'Doe'
 *		});
 * 		
 * 	person.save();
 * This example assumes a MongoDB datasource with an id of `models` is registered with {@link NGNA NGNA}.
 * By applying a MongoDB #CRUD object, the person will be persisted to MongoDB using `save()`. This example
 * uses a CRUD#map to match the person's attributes to the appropriate fields in the MongoDB collection.
 * 
 * There are several powerful ways to shrink the amount of code required to manage model objects. For example, 
 * default CRUD objects with default or custom maps can be defined at an application level.
 * 
 * For example, it is possible to get the same effect as the code snippet above using just:
 * 	var person = new MODEL.Person({
 *			gender:'m',
 *			firstName:'John',
 *			lastName:'Doe'
 *		});
 *		
 *	person.save();
 * 
 * Please see the associated guide for more information.
 * 
 * **Load a Person by ID**
 * 		var person = new MODEL.Person('id123');
 * This simple example assumes an NGN.datasource.CRUD object is associated with all MODEL.Person objects. By passing a
 * string argument, the model will attempt to convert that to an #id and run the #load method. This is the same as:
 * 	var person = new MODEL.Person();
 * 		
 * 	person.id = 'id123';
 * 		
 * 	person.load(); 
 * @aside guide models
 * @extends MODEL.Model
 * @docauthor Corey Butler
 */
var Class = Base.extend({
	
	constructor: function( config ){
	    
	    var me = this;
		
		config = config || {};
		
		config.type = 'Person';
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [type=Person]
			 * The model type.
			 */
			
            _primaryemail: {
                value:          null,
                writable:       true,
                enumerable:     false
            },
            
            /**
             * @cfg {String} id
             * The unique ID of the person.
             */
            /**
             * @property {String} [id=null]
             * The unique ID of the person.
             */
			id: {
                value:			config.id || null,
                enumerable:     true,
                writable:		true
            },
            
            /**
             * @cfg {String[]/MODEL.Email[]} email
             * The email account(s) associated with the person.
             */
            /**
             * @property {Array} [email=[]]
             * The primary email account of the person.
             */
            email: {
                value:			config.email || [],
                enumerable:     true,
                writable:		true
            },
            
            /**
             * @cfg {String} image
             * Path, data representation, or URL.
             */
             /**
             * @property {String} [image=null]
             * Represents a profile picture. This can be a path or URL.
             */
            image: {
            	value:			config.image || null,
                enumerable:     true,
                writable:		true
            },
            
            /**
             * @cfg {String} displayName
             * The name by which the person prefers to be referred to as. 
             */
            /**
             * @property {String} [displayName=null]
             * The name by which the person prefers to be referred to as. 
             */
            displayName: {
                value:			config.displayname || null,
                enumerable:     true,
                writable:		true
            },
			
			/**
			 * @cfg {String} firstName
			 * Given name.
			 */
			/**
			 * @property {String} [firstName=Unknown]
			 * Given name.
			 */
			firstName: {
				value:		config.firstName || 'Unknown',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} lastName
			 * Surname
			 */
			/**
			 * @property {String} [lastName=Unknown]
			 * Surname
			 */
			lastName: {
				value:		config.lastName || 'Unknown',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} middleName
			 * Middle name.
			 */
			/**
			 * @property {String} [middleName=null]
			 * Middle name.
			 */
			middleName: {
				value:		config.middleName || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} suffix
			 * Name suffix (i.e. III)
			 */
			/**
			 * @property {String} suffix
			 * Name suffix (i.e. III)
			 */
			suffix: {
				value:		config.suffix || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} gender
			 * Gender of the person.
			 */
			/**
			 * @property [gender=null]
			 * Gender of the person
			 */
			gender: {
				value:		config.gender || null,
				enumerable:	true,
				writable:	true,
				validate: 	function(value){
								console.log('testing gender');
								if (value == 'm')
									return true;
								return false;
							}
			},
			
			/**
			 * @cfg {Date} dob
			 * Date of Birth
			 */
			/**
			 * @property [dob=null]
			 * Date of Birth
			 */
			dob: {
				value:		config.dob || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @property {Number} age
			 * Generated using #dob
			 * @readonly
			 */
			age: {
				enumerable:	true,
				get:		function(){
								if (!this.dob)
									return null;
								var today = new Date(),
									age = today.getFullYear() - this.dob.getFullYear(),
							    	m = today.getMonth() - this.dob.getMonth();
							    if (m < 0 || (m === 0 && today.getDate() < this.dob.getDate()))
							        age--;
							    return age;
							}
			},
			
			/**
			 * @cfg {MODEL.Login[]} login
			 * The login used to authenticate the user.
			 */
			/**
			 * @property {MODEL.Login} [login=null]
			 * The login used to authenticate the user.
			 */
			login: {
				value:		config.login || null,
				enumerable:	false,
				writable:	false
			}
			
		});
		
		Class.super.constructor.call( this, config );
		
		// Data Validators
		this.addValidator('gender',/m|f/);
		
	}
	
});

// Create a module out of this.
module.exports = Class;
