var Base 		= require('./Model');

/**
 * @class NGN.model.Person
 * Represents a human being/actor in the ecosystem. 
 * This could be a system user, customers, administrators, or any other type of person.
 * 
 * **Simple Person**
 * 	var person = new NGN.model.Person({
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
 * 	var person = new NGN.model.Person({
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
 * @extends NGN.model.Model
 * @docauthor Corey Butler
 */
var Class = Base.extend({
	
	constructor: function( config ){
	    
	    var me = this;
		
		config = this.prepConfig(config);
		
		config.type = 'Person';
		
		config.fields = {
			
			father: new NGN.model.data.Association({
				model: NGN.model.Person,
				cardinality: '0:1'
			}),
			
			/**
             * @cfg {String[]/NGN.model.Email[]} email
             * The email account(s) associated with the person.
             */
            /**
             * @property {Array} [email=[]]
             * The primary email account of the person.
             */
            email: new NGN.model.data.Association({
				model: NGN.model.Email,
				cardinality: '0:N'
			}),
            
            /**
             * @cfg {String} image
             * Path, data representation, or URL.
             */
             /**
             * @property {String} [image=null]
             * Represents a profile picture. This can be a path or URL.
             */
            image: {
            	'default':		config.image || null
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
                'default':		config.displayname || null
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
				'default':	config.firstName || 'Unknown'
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
				'default':	config.lastName || 'Unknown'
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
				'default':	config.middleName || null
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
				'default':	config.suffix || null
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
				'default':	config.gender || null,
				pattern:	/m|f/
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
				'default':	config.dob || null
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
				'default':	config.login || null
			}
		}
		
		/**
         * @cfg {String} id
         * The unique ID of the person.
         */
        /**
         * @property {String} [id=null]
         * The unique ID of the person.
         */
		
		config.virtuals = {
			/**
			 * @property {Number} age
			 * Generated using #dob
			 * @readonly
			 */
			age: function(){
				if (!me.dob)
					return null;
				var today = new Date(),
					age = today.getFullYear() - me.dob.getFullYear(),
			    	m = today.getMonth() - me.dob.getMonth();
			    if (m < 0 || (m === 0 && today.getDate() < me.dob.getDate()))
			        age--;
			    return age;
			}
		}
		
		Class.super.constructor.call( this, config );
		
		return this.EXTENDEDMODEL;
		
	}
	
});

// Create a module out of this.
module.exports = Class;
