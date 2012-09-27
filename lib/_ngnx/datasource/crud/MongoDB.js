var Base 		= require('../../../datasource/CRUD'),
	ObjectID 	= require('mongodb').ObjectID;
/**
 * @class NGNX.datasource.crud.MongoDB
 * Implements basic CRUD functionality using a NGN.datasource.MongoDB connection.
 * @extends NGN.datasource.CRUD
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new MongoDB CRUD utility.
	 * @param {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
		
		if (typeof config == 'string'){
			config = {
				datasource: config
			};
		}
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			client: {
				value:		null,
				enumerable:	false,
				writable:	true
			},
			
			datasource: {
				value:		config.datasource || null,
				enumerable:	true,
				writable:	true
			}
			
		});

		if (typeof this.datasource == 'string')
			this.datasource = NGNA.getDatasource(this.datasource);
			
		this.client = this.datasource.getClient();
		
		this.addDataMapping('default','id','_id');
		
	},
	
	/**
	 * @method
	 * Create a new object in the datastore. This only works if the model
	 * has no `id` attribute, otherwise the #update method is executed instead.
	 * @param {MODEL.Model} model
	 * The model to persist.
	 * @param {Function} callback
	 * The callback function.
	 */
	create: function(model,callback){
		
		if (model.id){
			this.update(model,callback);
			return;
		}
		
		var me = this;
		
		this.onBeforeCreate();
		
		callback = callback || __NGN.emptyFn;
		
		this.client.collection(model.type,{safe:true},function(err,collection){
			if (err) {
				// Create the collection if it does not yet exist
				me.client.createCollection(model.type,function(_err,_collection){
					if (_err)
						me.fireError(_err);
					_collection.insert(model.getData(),function(err){
						if (err)
							me.fireError(err);
						callback();
						me.onCreate();
					});
				});
			} else {
				collection.insert(model.getData(),function(err){
					if (err)
						me.fireError(err);
					callback();
					me.onCreate();
				});
			}
		});
		
	},
	
	/**
	 * @method
	 * Read an existing object. This only works if the model has a populated `id` attribute.
	 * @param {MODEL.Model} model
	 * The model to read. Must contain a populated `id` attribute.
	 * @param {Function} callback
	 * The callback function.
	 */
	read: function(model,callback){
		
		if (!model.id){
			callback({});
		}
		
		var me = this;
		
		this.onBeforeRead();
		
		callback = callback || __NGN.emptyFn;

		// Get the collection and run an update
		this.client.collection(model.type,function(err,collection){
			
			collection.find({ _id: new ObjectID(model.id) }, { limit: 1 }).nextObject(function(err,doc){
				if (err)
					me.fireError(err);
				else {
					// Cleanup the MongoDB ID for use with models.
					if (doc) {
						var _tmp = doc._id.toString();
						delete doc._id;
						Object.defineProperty(doc,'id',{
							value:	_tmp,
							enumerable:	true,
							writable:	true
						});
					}
					callback(doc);
					me.onRead(doc);
				}
			});
		});
	},
	
	/**
	 * @method
	 * Update an existing object. This only works if the model has a populated `id` attribute,
	 * otherwise the #create method is executed instead.
	 * @param {MODEL.Model} model
	 * The model to persist.
	 * @param {Function} callback
	 * The callback function.
	 */
	update: function(model,callback){
		
		if (!model.id){
			this.create(model,callback);
			return;
		}
		
		if (!model.modified){
			this.fireWarning('The '+model.type+' model was not modified, but the update function was executed. Since there are no changes, this has been skipped.');
			return;
		}
		
		var me = this;
		
		this.onBeforeUpdate();
		
		callback = callback || __NGN.emptyFn;

		// Get the collection and run an update
		this.client.collection(model.type,function(err,collection){
			
			var data = model.getModifiedData();
			delete data._id;
	
			collection.update({ _id: new ObjectID(model.id) }, { $set: data }, { safe:true, multi:false, upsert:false },function(err){
				if (err)
					me.fireError(err);
				else {
					callback();
					me.onUpdate();
				}
			});
		});
	},
	
	/**
	 * @method delete
	 * Remove the object from the datasource. This only works if the model has a populated `id` attribute.
	 * @param {MODEL.Model} model
	 * The model to persist.
	 * @param {Function} callback
	 * The callback function.
	 */
	'delete': function(model,callback){

		if (!model.id){
			this.fireWarning('The model could not be deleted because it has no ID.');
			return;
		}
		
		var me = this;
		
		this.onBeforeDelete();
		
		callback = callback || __NGN.emptyFn;
	
		// Get the collection and run an update
		this.client.collection(model.type,function(err,collection){
			
			collection.remove({ _id: new ObjectID(model.id) }, { $atomic: true }, function(err){
				if (err)
					me.fireError(err);
				else {
					callback();
					me.onDelete();
				}
			});
		});
	}
});

module.exports = Class;
