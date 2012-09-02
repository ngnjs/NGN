var Base        = require('../NGN.core');
/**
 * @class NGN.datasource.CRUD
 * Represents a generic CRUD map, but does not actually provide persistence.
 * This class exists purely for the purposes of standardizing CRUD operations
 * with event management. 
 * @extends NGN.core
 * @private
 * @author Corey Butler
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		var me = this;
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @property {Boolean}
			 * @private
			 */
			_isCRUD: {
				value:		true,
				enumerble:	false,
				writable:	false,
				configurable:false
			},
			
			/**
			 * @cfg {Object} [map={}]
			 * Attribute -> Fieldname map. This is used to associate model attribute names to
			 * the appropriate database record field/key. Maps are split out into collections,
			 * which may represent an object, relational database table, group, or other logical
			 * storage container.
			 * 
			 * **Example**
			 * 		var persistence = new NGNX.datasource.crud.MongoDB({
			 *			datasource: 'models',
			 *			map:		{
			 *							Person: {
			 *								'firstName':'fn',
			 *								'lastName':'ln'
			 *							}
			 *						}
			 *		});
			 * In this example, the Person table/collection has fields called `fn` and `ln`, which 
			 * represent the `Person` model's `firstName` and `'lastName` attributes.
			 * 
			 * When data is saved or loaded using CRUD, data maps automatically handle the conversion
			 * from attribute->fieldname and vice versa. 
			 */
			map: {
				value:		config.map || {},
				enumerable:	false,
				writable:	true
			},
			
			_reverseMap: {
				value:		null,
				enumerable:	false,
				writable:	true
			}
			
		});
	},
	
	/**
	 * @method
	 * Map an attribute to a datafield. Requires #CRUD.
	 * @param {String} [collection=default]
	 * The collection, table, or other type of isolated storage container.
	 * @param {String} attribute
	 * The attribute of this item.
	 * @param {String} fieldname
	 * The name of the data field the attribute maps to.
	 */
	addDataMapping: function(collection,attribute,fieldname){
		try {
			if (this.map[collection][attribute] == fieldname)
				return;
		} catch(e){}
		if (arguments.length < 3){
			fieldname = attribute;
			attribute = collection;
			collection = 'default';
		}
		this.map[collection] = this.map[collection] || {};
		if (!this.map[collection].hasOwnProperty(attribute)){
			this.map[collection][attribute] = fieldname;
		} else
			this.fireWarning('Could not map '+attribute+' of '+collection+' to '+fieldname+'. '+attribute+' cannot be found or does not exist in '+collection+'.');
	},
	
	/**
	 * @method
	 * Map an attribute to a datafield. Requires #CRUD.
	 * @param {String} collection
	 * The collection, table, or other type of isolated storage container.
	 * @param {String} [attribute]
	 * Specify an attribute. Otherwise the entire collection will be removed.
	 * The attribute of this item.
	 */
	removeDataMapping: function(collection,attribute){
		if (this.map.hasOwnProperty(collection)){
			if (arguments.length < 2)
				delete this.map[collection];
			else if (this.map[collection].hasOwnProperty(attribute))
				delete this.map[collection[attribute]];
			else
				return;
			this._reverseMap = null;
			return;
		}
		this.fireWarning(attribute+' cannot be found or does not exist in '+collection+'.');
	},
	
	/**
	 * @method
	 * Used to map model attribute names to datasource attribute names. This is done when a model
	 * is saved or updated.
	 * @param {Object} data
	 * The data object to save/update.
	 * @param {String} [collection=default]
	 * The collection, table, or other type of isolated storage container.
	 * @returns {Object}
	 * The object with the mapped attribute names.
	 * @private
	 */
	processDataMap: function(data,collection){
		
		// Skip processing if there is no map.
		if (Object.keys(this.map) == 0)
			return data;
		
		// Set the default collection
		collection = collection || 'default';
		
		// Check to make sure at least one collection is available for processing
		if (!this.map.hasOwnProperty(collection) && collection !== 'default'){
			if (!this.map.hasOwnProperty('default'))
				return data;
			collection = 'default';
		}
	
		// Map the data
		for (var attr in data){
			if (this.map[collection].hasOwnProperty(attr)){
				data[this.map[collection][attr]] = data[attr];
				delete data[attr];
			}
		}
		
		return data;
	},
	
	/**
	 * @method
	 * Used to map datasource attribute names to model attribute names. This is done when a model
	 * is loaded/read from a datasource.
	 * @param {Object} data
	 * The data object to save/update.
	 * @param {String} [collection=default]
	 * The collection, table, or other type of isolated storage container.
	 * @returns {Object}
	 * The object with the mapped attribute names.
	 * @private
	 */
	processReverseDataMap: function(data,collection){
		
		// Skip processing if there is no map.
		if (Object.keys(this.map) == 0)
			return data;
		
		// Set the default collection
		collection = collection || 'default';
		
		// Check to make sure at least one collection is available for processing
		if (!this.map.hasOwnProperty(collection) && collection !== 'default'){
			if (!this.map.hasOwnProperty('default'))
				return data;
			collection = 'default';
		}
	
		// If no reverse map is available, make it
		if (!this._reverseMap)
			this.createReverseDataMap();
		
		// Map the data
		for (var attr in data){
			if (this._reverseMap[collection].hasOwnProperty(attr)){
				data[this._reverseMap[collection][attr]] = data[attr];
				delete data[attr];
			}
		}
		
		return data;
	},
	
	/**
	 * @method
	 * Populates a reverse data map for easily mapping data attributes to model attributes.
	 * @private
	 */
	createReverseDataMap: function(){
		
		this._reverseMap = {};
		
		for (var collection in this.map){
			this._reverseMap[collection] = this._reverseMap[collection] || {};
			for (var attr in this.map[collection]){
				this._reverseMap[collection][this.map[collection][attr]] = attr;
			}
		}
	},
	
	/**
	 * @method
	 * Map an attribute to a datafield. Requires #CRUD.
	 * @param {String} attribute
	 * The attribute of this item.
	 * @param {String} fieldname
	 * The name of the data field the attribute maps to.
	 */
	removeDataMap: function(attribute){
		if (this.hasOwnProperty(attribute)){
			this.map[attribute] = fieldname;
		} else
			this.fireWarning('Could not map '+attribute+' to '+fieldname+'. '+attribute+' cannot be found or does not exist.');
	},
	
	/**
	 * @method
	 * Create/save an object.
	 * @param {MODEL.Model} model
	 * The model to persist.
	 * @param {Function} callback
	 * The callback function.
	 * @template
	 */
	create: function(model,callback) {
		if (this.onBeforeCreate())
			this.onCreate();
	},
	
	/**
	 * @method
	 * Get/retrieve an object.
	 * @param {MODEL.Model} model
	 * The model to persist.
	 * @param {Function} callback
	 * The callback function.
	 * @template
	 */
	read: function(model,callback) {
		if (this.onBeforeRead())
			this.onRead();
	},
	
	/**
	 * @method
	 * Update an object.
	 * @param {MODEL.Model} model
	 * The model to persist.
	 * @param {Function} callback
	 * The callback function.
	 * @template
	 */
	update: function(model,callback) {
		if (this.onBeforeUpdate())
			this.onUpdate();
	},
	
	/**
	 * @method
	 * Delete an object.
	 * @param {MODEL.Model} model
	 * The model to persist.
	 * @param {Function} callback
	 * The callback function.
	 * @template
	 */
	'delete': function(model,callback) {
		if (this.onBeforeDelete())
			this.onDelete();
	},
	
	/**
	 * @method
	 * A reference to #delete. This is purely to avoid confusion with JavaScript's `delete` keyword.
	 * @param {MODEL.Model} model
	 * The model to persist.
	 * @param {Function} callback
	 * The callback function.
	 */
	remove: function(model,callback){
		this['delete'](model,callback);
	},
	
	/**
	 * @event beforeCreate
	 * Fired before object creation.
	 * @param {Boolean} [prevent=false]
	 * @returns {Boolean}
	 * Returns false if processing should cease.
	 * @template
	 */
	onBeforeCreate: function(prevent){
		this.emit('beforeCreate');
		return !prevent || true;
	},
	
	/**
	 * @event create
	 * Fired when an object is created.
	 * @param {Object} prevent
	 * @template
	 */
	onCreate: function(prevent){
		this.emit('create');
	},
	
	/**
	 * @event beforeRead
	 * Fired before object read/population.
	 * @param {Boolean} [prevent=false]
	 * @returns {Boolean}
	 * Returns false if processing should cease.
	 * @template
	 */
	onBeforeRead: function(prevent){
		this.emit('beforeRead');
		return !prevent || true;
	},
	
	/**
	 * @event read
	 * Fired when an object is read.
	 * @param {Object} prevent
	 * @template
	 */
	onRead: function(prevent){
		this.emit('read');
	},
	
	/**
	 * @event beforeUpdate
	 * Fired before object update/modify.
	 * @param {Boolean} [prevent=false]
	 * @returns {Boolean}
	 * Returns false if processing should cease.
	 * @template
	 */
	onBeforeUpdate: function(prevent){
		this.emit('beforeUpdate');
		return !prevent || true;
	},
	
	/**
	 * @event update
	 * Fired when an object is modified.
	 * @param {Object} prevent
	 * @template
	 */
	onUpdate: function(prevent){
		this.emit('update');
	},
	
	/**
	 * @event beforeDelete
	 * Fired before object read/population.
	 * @param {Boolean} [prevent=false]
	 * @returns {Boolean}
	 * Returns false if processing should cease.
	 * @template
	 */
	onBeforeDelete: function(prevent){
		this.emit('beforeDelete');
		return !prevent || true;
	},
	
	/**
	 * @event delete
	 * Fired when an object is removed.
	 * @param {Object} prevent
	 * @template
	 */
	onDelete: function(prevent){
		this.emit('delete');
	}
});

module.exports = Class;