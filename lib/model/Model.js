var hooks= require('hooks'),
	Base = require('../NGN.core');
	
/**
 * @class NGN.model.Model
 * A base model class for creating logical application classes, such as entities, actors, or business logic.
 * 
 * @private
 * @extends NGN
 * @author Corey Butler
 * @requires hooks
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new NGN.model. This can be done by passing a configuration object. If using persistence, the object
	 * can be automatically fetched by ID reference. For example:
	 * 		var person = new NGN.model.Person('id123');
	 * This will attempt to use the default persistence datasource to read data for the id `id123`.
	 */
	constructor: function(config){
		
		config = config || {};
		
		if (typeof config !== 'object') {
			config = {
				id: config
			};
		}
	
		Class.super.constructor.call(this,config);
		
		var me = this;
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [type=Model]
			 * The type of NGN.model.
			 * @readonly
			 * @protected
			 */
			type: {
				value:		config.type || 'Model',
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {String} [idAttribute='id']
			 * Setting this allows an attribute of the object to be used as the ID.
			 * For example, if an email is the ID of a user, this would be set to
			 * `email`.
			 */
			idAttribute: {
				value:		config.idAttribute || 'id',
				enumerable:	false,
				writable:	false
			},
			
			/**
			 * @property {Object}
			 * A private object containing the data fields of the model, including
			 * validators & default values. 
			 * @private
			 */
			fields: {
				value:		config.fields || {
								id: {
									required: 	true,
									type:		String,
									'default':	config.id || null
								}
							},
				enumerable:	false,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @property {Object}
			 * A private object containing virtual data attributes and generated data.
			 * @private 
			 */
			virtuals: {
				value:		config.virtuals || {},
				enumerable:	false,
				writable:	true,
				configurable:true
			},
			
			/**
             * @property {Object}
             * The validation rules used to verify data integrity when persisting to a datasource.
             * @private
             */
            validators: {
				value:		{},
				enumerable:	false,
				writable:	false		
			},
			
			/**
			 * @property {Boolean}
			 * Indicates the model is new or does not exist according to the persistence store.
			 * @private
			 * @readonly
			 */
			isNew: {
				value:		true,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {Boolean}
			 * Indicates the model has been destroyed/deleted and should no longer exist.
			 * @private
			 * @readonly
			 */
			isDestroyed: {
				value:		false,
				enumerable:	false,
				writable:	true
			},

			/**
             * @property {Boolean}
             * Indicates one or more data properties has changed.
             * @readonly
             */
            modified: {
                value:		false,
                enumerable: true,
                writable:	true
            },
            
			/**
			 * @property {String} [oid=null]
			 * The raw object ID, which is either the #id or #idAttribute depending
			 * on how the object is configured.
			 * @private
			 * @hidden
			 */
			oid: {
				value:		config[this.idAttribute] || null,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {String/Number/Date} [id=null]
			 * The unique ID of the model object.
			 */
			/**
			 * @property {String/Number/Date} [id=null]
			 * The unique ID of the model object. If #idAttribute is defined,
			 * this will get/set the #idAttribute value.
			 */
			id: {
				enumerable:	true,
				get:		function(){
								return this.oid;
							},
				set:		function(value){
								this[this.idAttribute] = value;
								this.oid = value;
							}
			},
			
			/**
			 * @cfg {Boolean} [allowInvalidSave=false]
			 * Set this to true to allow a save even though not all of the data properties 
			 * pass validation tests.
			 */
			allowInvalidSave: {
				value:		__NGN.coalesce(config.allowInvalidSave,false),
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [disableDataValidation=false]
			 * Only used when #save is called. Setting this to `true` will bypass data validation.
			 */
			disableDataValidation: {
				value:		__NGN.coalesce(config.disableDataValidation,false),
				enumerable:	false,
				writable:	true
			},
			
			invalidDataAttributes: {
				value:		[],
				enumerable:	false,
				writable:	true
			},
			
			initialDataAttributes: {
				value:		[],
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {Object}
			 * The original config values passed to the constructor.
			 * @readonly
			 */
			originalConfig: {
				value:		__NGN.clone(config),
				enumerable:	false,
				writable:	false
			},
			
			/**
			 * @property {Boolean}
			 * Stores whether the object is considered fetched.
			 * @private
			 */
			fetched: {
				value:		false,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * Indicates the model is an extension of another.
			 * @hidden 
			 */
			isXtn: {
				value: 		config.hasOwnProperty('extend'),
				enumerable:	false,
				writable:	false
			},
			
			/**
			 * @property {Object}
			 * Automatically generates a model with data management events.
			 * This uses proxies (harmony proxies) to emit events on object
			 * property changes such as get/set/create/delete/etc.
			 * @private
			 * @readonly
			 */
			EXTENDEDMODEL: {
				enumerable:	false,
				get:		function(){
								return this.extension();
							}
			},
			
			/**
			 * Indicates the model has been configured 
			 */
			configured: {
				value: 		false,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {Object[]}
			 * An ordered array of changes made to the object data properties.
			 * This should not be changed manually. Instead, use #getChangeLog
			 * and #rollback to manage this list.
			 * @private
			 */
			changelog: {
				value:		[],
				enumerable:	false,
				writable:	true
			},
			
			changequeue: {
				value:		[],
				enumerable:	false,
				writable: 	true,
				configurable:true
			},
			
			/**
			 * @property {Object}
			 * Contains references to associations.
			 * @private
			 */
			xref: {
				value:		{},
				enumerable:	false,
				writable:	true
			},
			
			// Holds a reference to the direct proxy
			_proxy: {
				value:		null,
				enumerable:	false,
				writable:	true
			},
			
			_nativeValidators: {
				value:		{
								min: function(min,value){
									if (value instanceof Array)
										return value.length >= min;
									if (value instanceof Number)
										return value >= min;
									if (value instanceof String)
										return value.trim().length >= min;
									if (value instanceof Date)
										return value.parse() >= min.parse();
									return false;
								},
								max: function(max,value){
									if (value instanceof Array)
										return value.length <= max;
									if (value instanceof Number)
										return value <= max;
									if (value instanceof String)
										return value.trim().length <= max;
									if (value instanceof Date)
										return value.parse() <= max.parse();
									return false;
								},
								'enum': function(valid,value){
									return valid.indexOf(value) >= 0;
								},
								required: function(field){
									return this.hasOwnProperty(field);
								}
							},
				enumerable:	false,
				writable:	false		
			},
			
			/**
			 * @cfg {Object} dataMap
			 * An object mapping model attribute names to data storage field names.
			 * 
			 * _Example_
			 * 		{
			 * 			father: 'dad',
  			 *			email: 'eml',
  			 *			image: 'img',
  			 *			displayName: 'dn',
  			 *			firstName: 'gn',
  			 *			lastName: 'sn',
  			 *			middleName: 'mn',
  			 *			gender: 'sex',
			 *			dob: 'bd',
			 * 		}
			 * 
			 */
			dataMap: {
				value:		config.dataMap || null,
				enumerable:	true,
				writable:	true
			}
			
		});
		
		// Make sure an ID reference is available.
		if (!this.fields.hasOwnProperty('id')){
			config.fields.id = {
									required: 	true,
									type:		String,
									'default':	config.id || null
								}
		}
		
		var me = this;
		
		// Add fields
		for (var field in this.fields){
			if (['id'].indexOf(field) < 0) {
				if (this[field] !== undefined){
					this.fireWarning(field+' data field defined multiple times. Only the last defintion will be used.');
					delete this[field];
				}
	
				// If the field is an association, create a cross reference.
				if (this.fields[field] instanceof __NGN.model.data.Association) {

					var _field	= field;

					this.xref[field] = this.fields[field] || null;

				} else {
					// Create the data field as an object attribute
					Object.defineProperty(this,field,{
						value:		this.fields[field]['default'],
						enumerable:	true,
						writable:	true,
						configurable:true
					});
				
					// Add field validators
					if (!this.disableDataValidation){
						if (this.fields[field].hasOwnProperty('pattern'))
							this.addValidator(field,this.fields[field].pattern);
						if (this.fields[field].hasOwnProperty('min'))
							this.addValidator(field,function(val){
								return me._nativeValidators.min(me.fields[field],val);
							});
						if (this.fields[field].hasOwnProperty('max'))
							this.addValidator(field,function(val){
								return me._nativeValidators.max(me.fields[field],val);
							});
						if (this.fields[field].hasOwnProperty('enum'))
							this.addValidator(field,function(val){
								return me._nativeValidators['enum'](me.fields[field],val);
							});
						if (this.fields[field].hasOwnProperty('required')){
							if (this.fields[field].required)
								this.addValidator(field,function(val){
									return me._nativeValidators.required(val);
								});
						}
						if (this.fields[field].hasOwnProperty('validate')){
							if (typeof this.fields[field] === 'function')
								this.addValidator(field,function(val){
									return me.fields[field](val);
								});
							else
								this.fireWarning('Invalid custom validation function. The value passed to the validate attribute must be a function.');
						}
					}
				}
			}
		}

		// Add hooks hook, pre, and post
		for (var k in hooks)
			this[k] = hooks[k];

		// Add pre/post events to each method
		this.pre('save',function(next){
			if (!me.disableDataValidation && !me.allowInvalidSave) {
				if (!me.validate()){
					me.fireError('Invalid data for '+me.invalidDataAttributes.join()+' attribute'+(me.invalidDataAttributes.length>1?'s':''));
					return;
				}
			}

			me.onBeforeSave(next);
			
		});
		
		// Before destroying an object.
		this.pre('destroy',function(next){
			me.onBeforeDestroy();
			next();
		});
		
		// After destroying an object.
		this.post('destroy',function(next){
			me.onDestroy();
			next();
		});
		
		var preGetDataMap = function(next){
			this.dataMap = this.dataMap || {};
			
			var keys= Object.keys(this.fields);
				
			// If the data map doesn't exist, create a default one.
			if (Object.keys(this.dataMap).length > 0){
				// Fill in any missing attributes
				for (var i=0;i<keys.length;i++){
					if (!this.dataMap.hasOwnProperty(keys[i])) {
						Object.defineProperty(this.dataMap,keys[i],{
							value: 		keys[i],
							enumerable: true,
							writable:	false
						});
					}
				}
				return this.dataMap;
			}

			// Pause the precondition
			this.removePre('getDataMap');
			
			// Temporarily save the map results from the model method.
			var map = this.getDataMap();
			
			// Unpause the precondition
			this.pre('getDataMap',preGetDataMap);
			
			// Return the results
			return map;

		};
		
		// Before the getDataMap method is executed.
		this.pre('getDataMap',preGetDataMap);
		
		if (this[this.idAttribute])
			this.fetch();

		// Support for global notifications
		if (NGNA){
			if (NGNA.hasOwnProperty('Events')){
				this.on('new',function(model){
					NGNA.dispatch('new',me.type);
				});
			}
		}
		
		// DO NOT CHANGE THIS
		// This is a smart object that returns a proxy if enabled,
		// or a standard object if not enabled.
		return this.EXTENDEDMODEL;
	},
	
	/**
	 * @method pre
	 * This method will execute **before** the specified method.
	 * For example:
	 * 		var person = new NGN.model.Person();
	 * 		
	 * 		person.pre('save',function(next){
	 * 			...
	 * 			next();
	 * 		});
	 * This method is chainable, so it is possible to add additional
	 * hooks, like:
	 * 		var person = new NGN.model.Person();
	 * 		
	 * 		person.pre('save',function(next){
	 * 			...
	 * 			next();
	 * 		}).pre('save',function(next){
	 * 			...
	 * 			next();
	 * 		});
	 * @chainable
	 */
	
	/**
	 * @method post
	 * This method will execute **after** the specified method.
	 * For example:
	 * 		var person = new NGN.model.Person();
	 * 		
	 * 		person.post('save',function(next){
	 * 			...
	 * 			next();
	 * 		});
	 * This method is chainable, so it is possible to add additional
	 * hooks, like:
	 * 		var person = new NGN.model.Person();
	 * 		
	 * 		person.post('save',function(next){
	 * 			...
	 * 			next();
	 * 		}).post('save',function(next){
	 * 			...
	 * 			next();
	 * 		});
	 * @chainable
	 */
	
	/**
	 * @method hook
	 * The hook method can be used to provide an arbitrary handler for a specific method.
	 * For example, custom error handling can be managed with `hook`.
	 * 
	 */
	
	/**
	 * @method
	 * A helper method to prepare configuration. This allows a non-object
	 * to be passed as a single configuration argument, which is automatically
	 * converted to the #id field. For example:
	 * 		var myModel = new NGN.model.Model('someID_123');
	 * The model automatically converts this to an object like:
	 * 		{
	 * 			id: 'someID_123'
	 * 		}
	 * As a result, the expected configuration object is always passed as the only
	 * argument to a constructor.
	 * @protected
	 */
	prepConfig: function(config) {
		if (typeof config !== 'object') {
			config = {
				id: config
			};
		}
		
		return config || {};
	},
	
	/**
	 * @method
	 * Add or update a validation rule for a specific model property.
	 * @param {String} property
	 * The property to test.
	 * @param {Function/String[]/Number[]/Date[]/RegExp/Array} validator
	 * The validation used to test the property value. This should return
	 * `true` when the data is valid and `false` when it is not. 
	 * 
	 * * When this is a _function_, the value is passed to it as an argument.
	 * * When this is a _String_, the value is compared for an exact match (case sensitive)
	 * * When this is a _Number_, the value is compared for equality.
	 * * When this is a _Date_, the value is compared for exact equality.
	 * * When this is a _RegExp_, the value is tested and the results of the RegExp#test are used to validate.
	 * * When this is an _Array_, the value is checked to exist in the array, regardless of data type. This is treated as an `enum`.
	 * * When this is _an array of dates_, the value is compared to each date for equality.
	 */
	addValidator: function(property,validator){
		if (!this.hasOwnProperty(property)){
			this.fireWarning('No validator could be create for '+property.toUpperCase()+'. It is not an attribute of '+this.type.toUpperCase()+'.');
			return;
		}
		switch (typeof validator){
			case 'function':
				this.validators[property] = this.validators[property] || [];
				this.validators[property].push(validator);
				break;
			case 'object':
				if (Array.isArray(validator)){
					this.validators[property] = this.validators[property] || [];
					this.validators[property].push(function(value){
						return validator.indexOf(value) >= 0;
					});
				} else if (validator.test){ // RegExp
					this.validators[property] = this.validators[property] || [];
					this.validators[property].push(function(value){
						return validator.test(value);
					});
				} else
					this.fireWarning('No validator could be created for '+property.toUpperCase()+'. The validator appears to be invalid.');
				break;
			case 'string':
			case 'number':
			case 'date':
				this.validators[property] = this.validators[property] || [];
				this.validators[property].push(function(value){
					return value == validator;
				});
				break;
			default:
				this.fireWarning('No validator could be create for '+property.toUpperCase()+'. The validator appears to be invalid.');
		}
		
	},
	
	/**
	 * @method
	 * Remove a data validator from the object.
	 * @param {String} attribute
	 * The name of the attribute to remove from the validators.
	 */
	removeValidator: function(attribute){
		if (this.validators.hasOwnProperty(attribute)){
			delete this.validators[attribute];
		}		
	},
	
	/**
	 * @method
	 * Validate one or all attributes of the data.
	 * @param {String} [attribute=null]
	 * Validate a specific attribute. By default, all attributes are tested.
	 * @private
	 * @returns {Boolean}
	 * Returns true or false based on the validity of data.
	 */
	validate: function(attribute){
		if (this.disableDataValidation)
			return undefined;
		
		var _pass = true;
		
		// Single Attribute Validation
		if (attribute){
			if (this.validators.hasOwnProperty(attribute)){
				_pass = this.validationMap[attribute](this[attribute]);
				if (!_pass)
					this.invalidDataAttributes.push(attribute);
				return _pass;
			}
		}
		
		// Validate All Attributes
		for (var rule in this.validators){
			if (this[rule]) {
				if (this.validators.hasOwnProperty(rule)){
					var pass = true;
					for (var i=0; i<this.validators[rule].length; i++){
						pass = this.validators[rule][i](this[rule]);
						if (!pass)
							break;
					}
					if (!pass && this.invalidDataAttributes.indexOf(rule) < 0)
						this.invalidDataAttributes.push(rule);
					
					if (_pass && !pass)
						_pass = false;
				}
			}
		}
		
		// Get cross reference associations.
		var assc = Object.keys(this.xref);
		
		// If there are no associated/nested models, skip association processing.
		if (!_pass || assc.length == 0)
			return _pass;
			
		// Check associated data models
		for(var i=0;i<assc.length;i++){
			var ref = this.xref[assc[i]],
				mod = Array.isArray(this[assc[i]]) ? this[assc[i]] : [this[assc[i]]];
			
			// Cardinality Check
			if (!(ref.min == 0 && ref.max == undefined)){
				if (mod.length < ref.min){
					this.invalidDataAttributes.push(assc[i]);
					return false;
				}
				if (ref.max !== undefined){
					if (mod.length > ref.max){
						this.invalidDataAttributes.push(assc[i]);
						return false;
					}
				}
			}
			
			// Model Check
			for (var n=0;n<mod.length;n++){
				if (mod[n] !== undefined) {
					if (!mod[n] instanceof ref.model || !mod[n].validate()){
						this.invalidDataAttributes.push(assc[i]);
						return false;
					}
				} else if (ref.min > 0){
					this.invalidDataAttributes.push(assc[i]);
					return false;
				}
			}
			
		}
		
		return true;
	},
	
	/**
	 * @method
	 * Enable data validation if #disableDataValidation is `true`.
	 */
	enableDataValidation: function(){
		this.disableDataValidation = false;
	},
	
	/**
	 * @method
	 * Disable data validation. Sets #disableDataValidation to `true`.
	 */
	disableDataValidation: function(){
		this.disableDataValidation = true;
	},
	
	/**
	 * @method
	 * Provides an array of data fields associated with the model.
	 * @returns {String[]}
	 */
	getDataFields: function(){
		var list = [];
		for (var field in this.fields)
			list.push(field);
		return list;
	},
	
	/**
	 * @method
	 * Provides specific detail/configuration about a field.
	 * @param {String} fieldname
	 * @returns {Object}
	 */
	getDataField: function(fieldname){
		return this.fields[fieldname];
	},
	
	/**
	 * @method
	 * Indicates a data field exists.
	 * @param {String} fieldname
	 * @returns {Boolean}
	 */
	hasDataField: function(fieldname){
		return this.fields.hasOwnProperty(fieldname);
	},
	
	/**
	 * @method
	 * Creates a JSON data object with no functions. Only uses enumerable attributes of the object by default.
	 * Specific data values can be included/excluded using #enumerableProperties & #nonEnumerableProperties.
	 * 
	 * Any object property that begins with a special character will be ignored by default. Functions & Setters are always
	 * ignored. Getters are evaluated recursively until a simple object type is found or there are no further nested attributes.
	 * 
	 * If a value is an instance of NGN.model.Model (i.e. a nested model or array of models), reference string is returned in the data.
	 * The model itself can be returned using #getXRef.
	 * @param {Object} [obj]
	 * Defaults to this object.
	 * @param {Boolean} [serializeAssociations=false]
	 * When set to `true`, any cross referenced data (NGN.model.Association) will be retrieved
	 * and serialized into JSON objects. Use this when a complete JSON dump is
	 * required.
	 * @returns {Object}
	 * @protected
	 */
	serialize: function(obj,serializeAssociations){
	
		if (obj == true || obj == false){
			serializeAssociations = obj;
			obj = this;
		}
		
		serializeAssociations = __NGN.coalesce(serializeAssociations,false);

		var _obj = obj || this;
		var me = this, struct = {}, rtn = {};
		
		this._ref = {};
		
		for (var key in _obj) {
		
			_obj.nonEnumerableProperties = _obj.nonEnumerableProperties || '';
			if (this.fields.hasOwnProperty(key)) {
				key = key == 'id' ? this.idAttribute : key;
				if ((_obj.hasOwnProperty(key) && (_obj.nonEnumerableProperties.indexOf(key) < 0 && /^[a-z0-9 ]$/.test(key.substr(0,1)))) || (_obj[key] !== undefined && _obj.enumerableProperties.indexOf(key) >= 0)) {
					var dsc = Object.getOwnPropertyDescriptor(_obj,key);
					if (dsc.get && !this.fields[key] instanceof __NGN.model.data.Association){
						try {
							rtn[key] = typeof _obj[key] == 'object' ? _obj[key].serialize(serializeAssociations) : _obj[key];
						} catch(e) {}
					} else if (!dsc.set) {
						
						// Handle everything else
						switch (typeof dsc.value) {
							case 'function':
								// Support date & regex proxies
								if (dsc.value.name == 'Date'){
									rtn[key] = _obj[key].refs.toJSON();
								} else if (dsc.value.name == 'RegExp'){
									rtn[key] = dsc.value();
								}
								break;
							case 'object':
								// Support array proxies
								if (_obj[key] instanceof Array && !Array.isArray(_obj[key]))
									_obj[key] = _obj[key].slice(0);
													
								var isXRef = this.xref.hasOwnProperty(key);

								// If the value is an association, ignore it.
								if (!isXRef) {
									if (Array.isArray(_obj[key])){				
										for (var i=0;i<_obj[key].length;i++){
											if (_obj[key][i] instanceof __NGN.model.data.Association){
												if (serializeAssociations)
													_obj[key][i] = _obj[key][i].child.serialize(serializeAssociations);
											}
										}
										if (_obj[key].length > 0)
											rtn[key] = _obj[key];
										break;
									} else if (_obj[key]){
										struct = _obj[key]['serialize'] !== undefined ? _obj[key].serialize(serializeAssociations) : _obj[key];	
										if (Object.keys(struct).length > 0){
											rtn[key] = me.merge(rtn,struct);
										}
									}
								} else if (serializeAssociations) {
									if (_obj[key].value !== null)
										rtn[key] = _obj[key].serialize();
									if (Array.isArray(rtn[key])){
										if (rtn[key].length == 0)
											delete rtn[key];
									}
								} else {
									// Handle associated records
									rtn[key] = _obj[key];
								}
								break;
							default:
								rtn[key] = _obj[key];
								break;
						}
					}
				}
			}
		}
		
		return rtn;
	},
	
	/**
	 * @method
	 * Get the changes made to the model. If the model is fetched from a data store, the changes
	 * will include any newly created data attributes, updates, and attribute removals.
	 * @param {Boolean} [serializeAssociations=false]
	 * When set to `true`, any cross referenced data (NGN.model.Association) will be retrieved
	 * and serialized into JSON objects. Use this when a complete JSON dump is
	 * required.
	 * @return {Object}
	 * The object contains up to 3 attributes:
	 * 		{
	 * 			create: {}, // <-- Key/value list of all new data attributes
	 * 			update: {}, // <-- Key/value list of all updated data attributes 
	 * 			destroy:{}  // <-- Key/value list of all removed data attributes
	 * 		}
	 * For _new_ objects, only the `create` key is available.
	 * These keys only exist when changes are made. The entire changelog can be retrieved
	 * with #getChangeLog.
	 */
	getChanges: function(serializeAssociations){
		serializeAssociations = __NGN.coalesce(serializeAssociations,false);
		
		var me  = this;
		var out = {
			changes:	[],
			associated: this.xref
		};

		// If it's a new object, everything is new
		//if (this.isNew){
			
			// Loop through the fields and identify the nested models
			if (Object.keys(this.xref).length > 0) {
				for (var field in this.fields){
					if (this.xref.hasOwnProperty(field) && this[field] !== null && this[field] !== undefined){
						for(var idx=0; idx<(Array.isArray(this[field]) ? this[field].length : 1); idx++){
							var mod = Array.isArray(this[field]) ? this[field][idx] : this[field];

							if (mod.isNew || mod.isDestroyed || mod.modified){
								// Add the model to the change list.
								var delta = {
									action: mod.isNew == true
											? 'create'
											: (
												mod.isDestroyed == true
												? 'delete'
												: 'update'
											)
								};
								var _field = field;
								Object.defineProperty(delta,'model',{
									enumerable: true,
									get:		function(){
													return Array.isArray(me[_field]) ? me[_field][idx] : me[_field]
												}
								})
								out.changes.unshift(delta);
								
								// Add any nested changes from the nested model
								var subdelta = mod.getChanges(serializeAssociations).changes;
								
								// Ignore the duplicate original
								subdelta.pop(); 
								
								// Concatenate the changes into a single array.
								out.changes = subdelta.concat(out.changes).slice(0);
							}
						}
					}
				}
			}
			
			// Add the main module (this)
			out.changes.push({
				action: this.isNew == true
						? 'create'
						: (
							this.isDestroyed == true
							? 'delete'
							: 'update'
						),
				model: this
			});
			
			// Remove unnecessary update
			if (out.changes[out.changes.length-1].action == 'update' 
			&& !out.changes[out.changes.length-1].model.modified)
				out.changes.pop();
			
			return out;
		//}
		
		/*
		var upd = {}, add = {}, rmv = {};
				for (var i=0; i<this.changelog.length; i++){
					var log = this.changelog[i];
					if (log.type == 'update' && !add.hasOwnProperty(log.property)){
						upd[log.property] = this[log.property].refs !== undefined ? this[log.property].refs : (this[log.property] instanceof Array ? this[log.property].slice(0) : this[log.property]);
					}
					if (log.type == 'delete' && rmv.hasOwnProperty(log.property) && !this.hasOwnProperty(log.property)) {
						rmv[log.property] = this[log.property].refs !== undefined ? this[log.property].refs : (this[log.property] instanceof Array ? this[log.property].slice(0) : this[log.property]);
						if (upd[log.property])
							delete upd[log.property];
						if (add[log.property])
							delete add[log.property];
					} 
					if (log.type == 'create' && !add.hasOwnProperty(log.property) && this.hasOwnProperty(log.property) && this.initialDataAttributes.indexOf(log.property) < 0) {
						add[log.property] = this[log.property].refs !== undefined ? this[log.property].refs : (this[log.property] instanceof Array ? this[log.property].slice(0) : this[log.property]);
						if (upd[log.property])
							delete upd[log.property];
						if (rmv[log.property])
							delete rmv[log.property];
					}
				}
				
				var rtn = {model:this.type};
				if (Object.keys(upd).length > 0)
					rtn.update = upd;
				if (Object.keys(add).length > 0)
					rtn.create = add;
				if (Object.keys(upd).length > 0)
					rtn.remove = rmv;
				if (Object.keys(this.xref).length > 0)
					rtn.associated = this.xref;
				return rtn;*/
		
	},
	
	/**
	 * @method
	 * Populate the model with data for an existing object.
	 * @private
	 * @uses serialize
	 */
	fetch: function(id){
		if (this.CRUD){		
			this.onBeforeFetch();
			
			var me = this;
			this.CRUD.read(this,function(result){	
				if (result){
					var data = me.CRUD.processReverseDataMap(result,me.type);
					for (var attr in data){
						if (me.nonEnumerableProperties.indexOf(attr) < 0)
							me[attr] = data[attr];
					}
					if (me.idAttribute)
						me[me.idAttribute] = me.id;
					me.onFetch();
				} else
					me.onNoResult();
			});
		} else
			this.fireWarning(this.type.toString().toUpperCase()+' cannot be fetched because no persistence/CRUD object is associated with the NGN.model.');	
	},
	
	/**
	 * @method
	 * Persist the data. This only works when an #CRUD is specified.
	 * @param {Function} callback
	 * @uses serialize
	 */
	save: function(callback) {
		
		callback = callback || __NGN.emptyFn;
		
		console.log('Saved'.cyan);
		
		callback();
		
		/*
		if (this.CRUD){
			var me = this, data = this.serialize();
			callback = callback || __NGN.noop;

			if (this.id){
				var allSaves = [];
				allSaves.push(this.CRUD.update(this));
				for (var ref in this._refs){
					if (this._refs.hasOwnProperty(ref)){
						if (this._refs[ref].modified || !this._refs[ref].id)
							allSaves.push(this._refs[ref].save);
					}
				}
				require('async').parallel(allSaves,function(err,results){
					callback(arguments);
					me.onSave();
				});
			} else {
				this.CRUD.create(this,function(){
					callback(arguments);
					me.onSave();
				});
			}
		} else
			this.fireWarning(this.type.toString().toUpperCase()+' cannot be saved because no persistence/CRUD object is associated with the NGN.model.');
		*/
	},
	
	/**
	 * @method
	 * Stop persisting the object (i.e. delete it from the datastore). This only works with #CRUD enabled and an #id specified.
	 */
	destroy: function(){
		if (this.isNew){
			this.fireWarning(model.type+' cannot be removed because it is new (i.e. not saved yet).');
			return;
		}
		console.log('TODO: Destroy Method'.red);
		return;
	},
	
	/**
	 * @method
	 * Returns an array of changes made to the object.
	 * Each element of the array is a change object, which is 
	 * a simple JSON object. The syntax is:
	 * 	{
	 * 		type: 'create|update|delete',
	 * 		oldValue: Object, // Only exists for update and delete.
	 * 		value: Object // Only exists for create and update
	 * 	}
	 * @returns {Array}
	 */
	getChangeLog: function(){
		if (!__NGN.OBJECT_PROXY_SUPPORT)
			this.fireWarning('Model '+this.type+'#getChangeLog cannot run because change management is not enabled. To enable, launch the app as:\n'+('node '+'--harmony '.bold+process.mainModule.filename).yellow+'\n');
		
		return this.changelog;
	},
	
	/**
	 * @method
	 * Simple "undo". It rolls back the changelog and
	 * reverses the changes made in each log entry.
	 * This method is only available when using proxies.
	 * @param {Number} [changes=1]
	 * The number of changes to rollback. A value of `-1` will rollback all changes.
	 */
	rollback: function(changes){
		if (!__NGN.OBJECT_PROXY_SUPPORT){
			this.fireWarning('Model '+this.type+'#rollback cannot execute because change management is not enabled. To enable, launch the app as:\n'+('node '+'--harmony '.bold+process.mainModule.filename).yellow+'\n');
			return;
		}
		changes = changes || 1;
		changes = changes < 1 ? this.changelog.length : changes;

		// Loop through the changelog and reverse each change sequentially.
		for (var i=0; i<changes; i++){
			var delta = this.changelog[this.changelog.length-1];
			switch(delta.type.trim().toLowerCase()){
				case 'create':
					delete this._proxy['___rollback::'+delta.property];
					this.changelog.pop();
					this.onRollback(delta);
					break;
				case 'update':		
					this._proxy['___rollback::'+delta.property] = delta.oldValue;
					this.changelog.pop();
					this.onRollback(delta);
					break;
				case 'delete':
					this._proxy['___rollback::'+delta.property] = delta.oldValue;
					this.changelog.pop();
					this.onRollback(delta);
					break;
				case 'start':
					break;
				default:
					this.fireWarning('Rollback Failed: '+delta.type+' not a recognized change type.');
					break;
			}
		}
	},
	
	/**
	 * @model
	 * 
	 * @private
	 */
	extension: function() {

		if (this.configured)
			return this._proxy == null ? this : this._proxy;
		
		this.configured = true;

		if (!__NGN.OBJECT_PROXY_SUPPORT){
			//this.fireWarning('Model '+this.type+' does not have change management support. To enable, launch the app as:\n'+('node '+'--harmony '.bold+process.mainModule.filename).yellow+'\n');
			delete this.rollback;
			delete this.changelog;
			delete this.getDiff;
			delete this.onBeforeChange;
			delete this.onChange;
			delete this.onRollback;
		}

		// Add virtual getters
		for (var v in this.virtuals){
			if (this.virtuals.hasOwnProperty(v)){
				if (this[v] !== undefined){
					this.fireWarning('Model attribute '+v.trim().toUpperCase()+' overwritten by virtual data attribute.');
					delete this[v];
				}
				Object.defineProperty(this,v,{
					enumerable:	true,
					get:		this.virtuals[v]
				});
			}
		}
		
		// If this is an extension, return the model without applying the proxy
		// This supports creation of an inherited object with a proxy.
		if (this.isXtn || !__NGN.OBJECT_PROXY_SUPPORT)
			return this;
		
		var me = this;
		
		Proxy = Proxy || function(){ return me; };

		this._proxy = NGN.model.data.Monitor(this);

		return this._proxy;
	},
	
	/**
	 * @method
	 * Executed before a data attribute is created, modified, or removed. This is an empty method that should be overridden.
	 * Processing will abort when this method returns `false`.
	 * @param {Object} changeObject
	 * @returns {Boolean}
	 * The return value is used to determine whether processing continues or halts.
	 */
	beforeDataChange: function(changeObject){
		return true;
	},
	
	/**
	 * @method
	 * Executed before a #save. This is an empty method that should be overridden.
	 * Processing will abort when this method returns `false`.
	 * @param {Object} changeObject
	 * @returns {Boolean}
	 * The return value is used to determine whether processing continues or halts.
	 */
	beforeSave: function(changeObject){
		return true;
	},
	
	/**
	 * @method
	 * Executed before a #destroy.
	 * This is an empty method that should be overridden.
	 * Processing will abort when this method returns `false`.
	 * @param {Object} changeObject
	 * @returns {Boolean}
	 * The return value is used to determine whether processing continues or halts.
	 */
	beforeDestroy: function(changeObject){
		return true;
	},
	
	/**
	 * @method
	 * Retrieve the data mapping of attributes -> fields 
	 * @param {Boolean} [fill=false]
	 * When set to `true`, any missing model attributes not recognized in the specified #dataMap
	 * will be added automatically using the model's field name.
	 * @returns {Object}
	 * Returns a key/value object of `attribute:field`
	 */
	getDataMap: function(parm){
		this.dataMap = this.dataMap || {};

		if (Object.keys(this.dataMap).length > 0)
			return this.dataMap;

		var keys= Object.keys(this.fields);

		// If no data map exists, create a default from all of the known fields.
		for (var i=0;i<keys.length;i++){
			Object.defineProperty(this.dataMap,keys[i],{
				value: 		keys[i],
				enumerable: true,
				writable:	false
			});
		}
		
		return this.dataMap;
	},
	
	
	/**
	 * @event beforeChange
	 * Fired before a change is completed.
	 * Provides the following change object to the callback:
	 * 	{
	 * 		type: 'create|update|delete',
	 * 		oldValue: Object, // Only exists for update and delete.
	 * 		value: Object // Only exists for create and update
	 * 	}
	 */
	onBeforeChange: function(change) {
		change = change || null;
		this.emit('beforeChange',change);
		if (change !== null)
			this.emit('beforeChange'+__$.capitalize(change.property),change);
		return true;
	},
	
	/**
	 * @event change
	 * Fired after the change is complete.
	 * Provides the following change object to the callback:
	 * 	{
	 * 		type: 'create|update|delete',
	 * 		oldValue: Object, // Only exists for update and delete.
	 * 		value: Object // Only exists for create and update
	 * 	}
	 */
	onChange: function(change) {
		change = change || null;
		this.modified = true;
		this.changelog.push(change);
		this.emit('change',change);
		if (change !== null)
			this.emit('change'+__$.capitalize(change.property),change);
	},
	
	/**
	 * @event beforeSave
	 * Fired before the model attempts to persist data.
	 * @param {Function} done
	 * Passed to the event listener to be continue processing when all preprocessing is done.
	 */
	onBeforeSave: function(done){
		this.emit('beforeSave',done);
	},
	
	/**
	 * @event save
	 * Fired when the model attempts to persist data to a datasource.
	 */
	onSave: function(){
		this.modified = false;
		this._modifiedAttributes = [];
		this.isNew = false;
		this.emit('save',this);
	},
	
	/**
	 * @event beforeFetch
	 * Fired before the model attempts to populates its data from a datasource.
	 */
	onBeforeFetch: function(){
		this.emit('beforeFetch',this);
	},
	
	/**
	 * @event fetch
	 * Fired when the model attempts to populate its data from a datasource.
	 */
	onFetch: function(){
		if (!this.fetched){
			this.isNew = (this.id == null);
			this.fetched = true;
			this.emit('fetch',this);
		}
	},
	
	/**
	 * @event beforeRemove
	 * Fired before the model attempts to remove its data from a datasource.
	 */
	onBeforeDestroy: function(){
		this.emit('beforeRemove',this);
	},
	
	/**
	 * @event destroy
	 * Fired when the model has removed its data from a datasource.
	 */
	onDestroy: function(){
		this.isDestroyed = true;
		delete this.save;
		delete this.fetch;
		this.emit('destroy',this);
	},
	
	/**
	 * @event noData
	 * Fired when a #fetch returns no records.
	 */
	onNoData: function(){
		this.emit('noData')
	},
	
	/**
	 * @event rollback
	 * Fired when a rollback occurs.
	 * @param {Object} delta
	 */
	onRollback: function(delta){
		this.emit('rollback',delta);
	}
	
});

module.exports = Class;

