var hooks= require('hooks'),
	Base = require('../NGN.core');

/**
 * @class MODEL.Model
 * A base model class for creating logical application classes, such as entities, actors, or business logic.
 * @private
 * @author Corey Butler
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new model. This can be done by passing a configuration object. If using persistence, the object
	 * can be automatically loaded by ID reference. For example:
	 * 		var person = new MODEL.Person('id123');
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
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String/Number/Date} [id=null]
			 * The unique ID of the model object.
			 */
			id: {
				value:		config.id || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [type=Model]
			 * The type of model.
			 * @readonly
			 * @protected
			 */
			type: {
				value:		config.type || 'Model',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {NGN.datasource.CRUD}
			 * Facilitates CRUD functions for #save, #load, and #remove methods.
			 */
			CRUD: {
				value:		config.CRUD || null,
				enumerable:	true,
				writable:	true
			},
			
			_modified: {
                value:      false,
                writable:   true,
                enumerable: false
            },
            
            _modifiedAttributes: {
                value:      [],
                writable:   true,
                enumerable: true
            },
            
            /**
             * @property {Boolean}
             * Indicates one or more data properties has changed.  
             */
            modified: {
                enumerable: true,
                get:        function(){
                                return this._modified;
                            }
            },
							
			/**
			 * @property {Array}
			 * An array of enumerable properties that are explicitly **excluded** in the #toData results.
			 * @private
			 */
            nonDataProperties: {
            	value:		['modified','dataProperties','nonDataProperties','strictData','explicitData','disableDataValidation','type','CRUD'],
            	enumerable:	true,
            	writable:	false
            },
            
            /**
             * @property {Array}
			 * An array of enumerable properties that are explicitly **included** in the #toData results.
             * This is useful when a non-enumerable property or special property name should be
             * included, or if default behavior needs to be overwritten.
             */
            dataProperties: {
            	value:		[],
            	enumerable:	true,
            	writable:	true
            },
            
            /**
             * @cfg {Boolean} [strictData=false]
             * When set to `true`, the #getData method will only return values for the attributes defined in #dataProperties and/or the object itself.
             */
            strictData: {
            	value:		__NGN.coalesce(config.strictData,false),
            	enumerable:	false,
            	writable:	true
            },
            
            /**
             * @cfg {Boolean} [strictData=false]
             * When set to `true`, the #getData method will only return values for the attributes defined in #dataProperties.
             */
            explicitData: {
            	value:		__NGN.coalesce(config.explicitData,false),
            	enumerable:	false,
            	writable:	true
            },
            
            /**
             * @property {Object}
             * The validation rules used to verify data integrity when persisting to a datasource.
             * @private
             */
            _validationMap: {
				value:		{},
				enumerable:	false,
				writable:	false		
			},
			
			/**
			 * @cfg {Boolean} [disableDataValidation=false]
			 * Only used when #save is called. Setting this to `true` will bypass data validation.
			 */
			disableDataValidation: {
				value:		__NGN.coalesce(config.disableDataValidation,false),
				enumerable:	true,
				writable:	true
			},
			
			_invalidDataAttributes: {
				value:		[],
				enumerable:	false,
				writable:	true
			},
			
			_coreAttributes: {
				value:		[],
				enumerable:	false,
				writable:	true
			},
			
			/*
			 * References to other models. 
			 */
			_refs: {
				value:		{},
				enumerable:	false,
				writable:	true
			}
			
		});
		
		// Check for core attributes
		for (var attr in this){
			var dsc = Object.getOwnPropertyDescriptor(this,attr);

			// Check for core attribute
			if (typeof this[attr] !== 'function' && !dsc.get && !dsc.set && dsc.enumerable && attr.substr(0,1) !== '_' && this.nonDataProperties.indexOf(attr) == -1)
				this._coreAttributes.push(attr);
		}

		var me = this;

		// Add hooks hook, pre, and post
		for (var k in hooks)
			this[k] = hooks[k];

		// Add pre/post events to each method
		this.pre('save',function(next){
			me.onBeforeSave();
			next();
		});
		this.post('save',function(next){
			me.onSave();
			next();
		});
		this.pre('load',function(next){
			me.onBeforeLoad();
			next();
		});
		this.post('load',function(next){
			me.onLoad();
			next();
		});
		this.pre('remove',function(next){
			me.onBeforeRemove();
			next();
		});
		this.post('remove',function(next){
			me.onRemove();
			next();
		});
		
		if (!this.CRUD){
			if (NGNA){
				if (NGNA.CRUD[this.type])
					this.CRUD = NGNA.CRUD[this.type];
				else if (NGNA.CRUD['default'])
					this.CRUD = NGNA.CRUD['default'];
			}
		}
		
		if (this.CRUD){
			this.CRUD.on('save',function(){
				
			})
		}
	
		// Load the object if an ID is specified.		
		if (this.id)
			this.load();
	},
	
	/**
	 * @method pre
	 * This method will execute **before** the specified method.
	 * For example:
	 * 		var person = new MODEL.Person();
	 * 		
	 * 		person.pre('save',function(next){
	 * 			...
	 * 			next();
	 * 		});
	 * This method is chainable, so it is possible to add additional
	 * hooks, like:
	 * 		var person = new MODEL.Person();
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
	 * 		var person = new MODEL.Person();
	 * 		
	 * 		person.post('save',function(next){
	 * 			...
	 * 			next();
	 * 		});
	 * This method is chainable, so it is possible to add additional
	 * hooks, like:
	 * 		var person = new MODEL.Person();
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
				this._validationMap[property] = validator;
				break;
			case 'object':
				if (Array.isArray(validator)){
					this._validationMap[property] = function(value){
						return validator.indexOf(value) >= 0;
					};
				} else if (validator.test){ // RegExp
					this._validationMap[property] = function(value){
						return validator.test(value);
					};
				} else
					this.fireWarning('No validator could be created for '+property.toUpperCase()+'. The validator appears to be invalid.');
				break;
			case 'string':
			case 'number':
			case 'date':
				this._validationMap[property] = function(value){
					return value == validator;
				};
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
		if (this._validationMap.hasOwnProperty(attribute)){
			delete this._validationMap[attribute];
		}		
	},
	
	/**
	 * @method
	 * Validate one or all attributes of the data.
	 * @param {String} [attribute=null]
	 * Validate a specific attribute. By default, all attributes are tested.
	 * @private
	 */
	validate: function(attribute){
		if (this.disableDataValidation)
			return true;
		
		var _pass = true;
		
		// Single Attribute Validation
		if (attribute){
			if (this._validationMap.hasOwnProperty(attribute)){
				_pass = this.validationMap[attribute](this[attribute]);
				if (!_pass)
					this._invalidDataAttributes.push(attribute);
				return _pass;
			}
		}
		
		// Validate All Attributes
		for (var rule in this._validationMap){
			if (this[rule]) {
				if (this._validationMap.hasOwnProperty(rule)){
					var pass = this._validationMap[rule](this[rule]);
					if (!pass && this._invalidDataAttributes.indexOf(rule) < 0)
						this._invalidDataAttributes.push(rule);
					
					if (_pass && !pass)
						_pass = false;
				}
			}
		}
		return _pass;
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
	 * Creates a JSON data object with no functions. Only uses enumerable attributes of the object by default.
	 * Specific data values can be included/excluded using #dataProperties & #nonDataProperties.
	 * 
	 * Any object property that begins with a special character will be ignored by default. Functions & Setters are always
	 * ignored. Getters are evaluated recursively until a simple object type is found or there are no further nested attributes.
	 * @param {Object} [obj]
	 * Defaults to this object.
	 * @returns {Object}
	 * @protected
	 */
	toData: function(obj){
	
		var _obj = obj || this;
		var me = this, struct = {}, rtn = {};
		
		this._ref = {};
		
		for (var key in _obj) {
			
			_obj.nonDataProperties = _obj.nonDataProperties || '';
			if ((_obj.hasOwnProperty(key) && (_obj.nonDataProperties.indexOf(key) < 0 && /^[a-z0-9 ]$/.test(key.substr(0,1)))) || (_obj[key] !== undefined && _obj.dataProperties.indexOf(key) >= 0)) {
				if ((this.explicitData && this.dataProperties.indexOf(key) >= 0) || !this.explicitData) {					
					if ((this.strictData && this._coreAttributes.indexOf(key) >= 0) || !this.strictData){
						var dsc = Object.getOwnPropertyDescriptor(_obj,key);
						
						if (dsc.get){
							try {
								rtn[key] = typeof _obj[key] == 'object' ? _obj[key].toData() : _obj[key];
							} catch(e) {}
						} else if (!dsc.set) {
							switch (typeof dsc.value) {
								case 'function':
									break;
								case 'object':
									var isModel = _obj[key] instanceof MODEL.Model;
									
									if (Array.isArray(_obj[key]) && !isModel){
										var ref = true;
										for (var i=0;i<_obj[key];i++){
											if (!(_obj[key][i] instanceof MODEL.Model)){
												ref = false;
												me._ref[key+i] = _obj[key][i];
											}
										}
										isModel = ref;
									}

									if (isModel){
										me._ref[key] = _obj[key];
									} else if (_obj[key]){
										struct = _obj[key].hasOwnProperty('toData') == true ? _obj[key].toData() : _obj[key];	
										if (Object.keys(struct).length > 0)
											rtn = me.merge(rtn,struct);
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
		}
		
		return rtn;
	},
	
	/**
	 * @method
	 * Create or update a property of the object. This triggers the #change event.
	 * @param {String} prop
	 * The property name.
	 * @param {Any} value
	 * Value of the property.
	 */
	set: function(prop,value){
		var oldVal = this[prop] || null;
		
		if (oldVal !== value) {
			var obj = {
				name:	prop,
				type: 	this.hasOwnProperty(prop) == true ? 'update' : 'create',
				value:	value	
			};
			
			if (this.hasOwnProperty(prop))
				obj.old = this[prop] || null;
			
			this.onBeforeChange(obj);
			
			if (!this._modifiedAttributes.indexOf(prop))
				this._modifiedAttributes.push(prop);
		
			this[prop] = value;
			
			this.onChange(obj);
		}
	},
	
	/**
	 * @method
	 * Remove a property of the object. This triggers the #change event.
	 * @param {String} prop
	 * The property name.
	 */
	remove: function(prop){
		
		if (this.hasOwnProperty(prop)) {
			var obj = {
				name:	prop,
				type: 	'remove',
				old: 	this[prop]
			};
			this.onBeforeChange(obj);
			delete this[prop];
			this.onChange(obj);
		}
	},
	
	/**
	 * @method
	 * Populate the model with data for an existing object.
	 * @private
	 */
	load: function(id){
		if (this.CRUD){
			this.onBeforeLoad();
			
			var me = this;
			this.CRUD.read(this,function(result){
				var data = me.CRUD.processReverseDataMap(result,me.type);
				for (var attr in data){
					if (me.nonDataProperties.indexOf(attr) < 0)
						me.set(attr,data[attr]);
				}
				me.onLoad();
			});
		} else
			this.fireWarning(this.type.toString().toUpperCase()+' cannot be loaded because no persistence/CRUD object is associated with the model.');	
	},
	
	/**
	 * @method
	 * Persist the data. This only works when an #CRUD is specified.
	 * @param {Function} callback
	 */
	save: function(callback) {
		if (!this.validate()){
			this.fireError('Invalid data for '+this._invalidDataAttributes.join()+' attribute'+(this._invalidDataAttributes.length>1?'s':''));
			return;
		}
		if (this.CRUD){
			var me = this, data = this.toData();
			callback = callback || __NGN.emptyFn;

			if (this.id)
				this.CRUD.update(this,function(){
					callback(arguments);
					me.onSave();
				});
			else
				this.CRUD.create(this,function(){
					callback(arguments);
					me.onSave();
				});

		} else
			this.fireWarning(this.type.toString().toUpperCase()+' cannot be saved because no persistence/CRUD object is associated with the model.');
	},
	
	/**
	 * @method
	 * Stop persisting the object (i.e. delete it from the datastore). This only works with #CRUD enabled and an #id specified.
	 */
	remove: function(){
		if (this.CRUD){
			var me = this;
			this.onBeforeRemove();
			this.CRUD.remove(this,function(){
				me.onRemove();
			});
		} else
			this.fireWarning(this.type.toString().toUpperCase()+' cannot be removed because no persistence/CRUD object is associated with the model.');	
	},
	
	/**
	 * @method
	 * Returns the data that the persistence store uses.
	 * @param {Boolean} [modified=false]
	 * Retrieve only the modified data.
	 * @returns {Object}
	 */
	getData: function(){
		if (this.CRUD)
			return this.CRUD.processDataMap(this.toData(),this.type);
		return this.toData();
	},
	
	/**
	 * @method
	 * Returns the #_rawData communicated with a persistence store.
	 * @returns {Object}
	 */
	getModifiedData: function(){
		if (!this.modified)
			return {};
			
		var data = this.getData(), rtn = {};
		
		for (var attr in data){
			if (data.hasOwnProperty(attr) && this._modifiedAttributes.indexOf(attr))
				rtn[attr] = data[attr];
		}
		
		return rtn;
	},
	
	/**
	 * @event beforeChange
	 * Fired before a change is completed.
	 */
	onBeforeChange: function(change) {
		change = change || null;
		this.emit('beforeChange',change);
	},
	
	/**
	 * @event change
	 */
	onChange: function(change) {
		change = change || null;
		this._modified = true;
		this.emit('change',change);
	},
	
	/**
	 * @event beforeSave
	 * Fired before the model attempts to persist data.
	 */
	onBeforeSave: function(){
		this.emit('beforeSave',this);
	},
	
	/**
	 * @event save
	 * Fired when the model attempts to persist data to a datasource.
	 */
	onSave: function(){
		this._modified = false;
		this._modifiedAttributes = [];
		this.emit('save',this);
	},
	
	/**
	 * @event beforeLoad
	 * Fired before the model attempts to populates its data from a datasource.
	 */
	onBeforeLoad: function(){
		this.emit('beforeLoad',this);
	},
	
	/**
	 * @event load
	 * Fired when the model attempts to populate its data from a datasource.
	 */
	onLoad: function(){
		this.emit('load',this);
	},
	
	/**
	 * @event beforeRemove
	 * Fired before the model attempts to remove its data from a datasource.
	 */
	onBeforeRemove: function(){
		this.emit('beforeRemove',this);
	},
	
	/**
	 * @event remove
	 * Fired when the model has removed its data from a datasource.
	 */
	onRemove: function(){
		this.emit('remove',this);
	}
	
});

module.exports = Class;