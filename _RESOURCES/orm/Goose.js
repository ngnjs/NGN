var Base        = require('../../../core/ORM'),
	mongoose	= require('mongoose'),
	Schema		= mongoose.Schema;
/**
 * @class NGNX.datasource.orm.Goose
 * Goose provides MongoDB Object Relational Mapping, based on the popular [mongoose](http://mongoosejs.com) module.
 * In addition to all of the features and functionality of Mongoose, Goose provides several
 * additional features. Goose was designed to simplify the management of Mongoose schemas, 
 * boilerplate code, and common plugins.
 * @extends NGN.core.ORM
 * @author Corey Butler
 * @aside guide goose
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		var me = this;
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [schemas=null]
			 * Directory path where schema modules exist.
			 */
			modelpath: {
				value:		config.schemas || null,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {Object}
			 * The raw key/value object containing all available schemas.
			 * @private
			 */
			_schema: {
				value:		{},
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {Object}
			 * A key/value object containing all of he available schemas.
			 * 
			 */
			schemas: {
				enumerable:	true,
				get:		function(){ return this._schema; }
			},
			
			/**
			 * @cfg {Object/Array}
			 * An object or array of plugins applied to every schema.
			 * All objects should be [mongoose](http://mongoosejs.com) plugins.
			 */
			globalPlugins: {
				value:		config.globalPlugins || [],
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {Number} [maxRetries=100]
			 * The maximum number of retires before schema loading fails.
			 */
			maxRetries: {
				value:		config.maxRetries || 100,
				enuemrable:	true,
				writable:	true
			},
			
			/**
			 * @property
			 * A shortcut providing direct access to the native MongoDB driver.
			 * This can be used to perform queries directly against the MongoDB.
			 */
			driver: {
				value:		null,
				enumerable:	true,
				writable:	true
			}
			
		});
		
		if (typeof config.connection == 'string')
			config.connection = __NGN.app.getDatasource(config.connection);
		
		this.connection = mongoose.connection = config.connection;
		
		this.mongo = config.connection.getClient();
		
		if (!Array.isArray(this.globalPlugins))
			this.globalPlugins = [this.globalPlugins];
		
		this.on('initialized',function(){
			me.onReady();
		});
		
		this.initializeSchemas();
		
	},
	
	/**
	 * @method
	 * Initialize the schemas.
	 * @param {Object} path
	 * Defaults to #schemas
	 */
	initializeSchemas: function(path) {
		path = path || this.schemas;
		
		if (!this.connection.connected)
			this.fireError('Goose schemas cannot be initialized because the data source is not connected.');

		var me			= this,
			incomplete	= new Array,
			retry		= new Array,
			max			= this.maxRetries,
			tryCt		= 0
			SchemaModel	= {};

		
		if (path) {
			require('wrench').readdirSyncRecursive(this.modelpath).forEach(function( file ){
				
				//Convert filename to array
				var name = __NGN.path.basename(file);
			
				//Export the schema object
				if (__NGN.path.extname.toLowerCase() === 'js') {
					SchemaModel[name] = require( __NGN.path.join(me.modelpath,file));
					incomplete.push(name)
				}
			});
			
			//Loop through the schemas and implement them.
			while ( incomplete.length > 0  &&  tryCt <= max  ||  retry.length > 0 ) {
			
				if ( incomplete.length == 0 ) {
					incomplete 	= retry;
					retry		= [];
				}
			
				tryCt++;
				try {
					
					//Register the data model
					mongoose.model( incomplete[0], SchemaModel[incomplete[0]] );
					
					//Get the registered schema for application use
					this._schema[incomplete[0]] = mongoose.model( incomplete[0] );
				
					// Apply global plugins
					for(var i=0;i<this.globalPlugins.length;i++){
						this._schema[incomplete[0]].plugin(this.globalPlugins[i]);
					}
					
					//Remove the model once it's complete
					incomplete.shift();
					
				} catch (e) {
					retry.push( incomplete[0] );
					incomplete.shift();
				}
			
			}
			
			delete SchemaModel;
			
			if (tryCt > max)
				this.fireError('Goose schemas failed to load (too many retries).');

			this.onInitialized();
		}
	},
	
	/**
	 * @event initialized
	 * Fired when the schemas are initialized.
	 */	
	onInitialized: function(){
		this.emit('initialized');
	}
});

module.exports = Class;