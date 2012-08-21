var Base        = require('../core/Server');
/**
 * @class NGN.core.ORM
 * Represents a generic ORM service, but does not actually provide object relational mapping.
 * This class exists purely for the purposes of registering ORM and making it accessible throughout
 * an application. 
 * @extends NGN.core.Server
 * @private
 * @author Corey Butler
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		config = config || {};
		
		config.type 	= 'DATA';
		config.purpose	= 'ORM';
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {NGN.datasource.Connection/String} connection (required)
			 * The datasource connection. If NGN#application is used, 
			 * the string identifier (id) of a datasource connection
			 * can be passed instead of the full object.
			 */
			connection: {
				value:		null,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {String} dialect
			 * The type of ORM. For example, MongoDB or MySQL
			 */
			dialect: {
				value:		null,
				enumerable:	true,
				writable:	true
			}
			
		});
		
		this.dialect = this.connection.type;
		
	},
	
	/**
	 * @event save
	 * Fired when an object is saved.
	 * @param {Object} meta
	 */
	onSave: function(meta) {
		this.emit('save',meta);
	},
	
	/**
	 * @event delete
	 * Fired when an object is deleted.
	 * @param {Object} meta
	 */
	onDelete: function(meta) {
		this.emit('delete',meta);
	},
	
	/**
	 * @event modify
	 * Fired when an object is modified.
	 * @param {Object} meta
	 */
	onModify: function(meta) {
		this.emit('modify',meta);
	}
	
});

module.exports = Class;