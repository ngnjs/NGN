var Base = require('../../BaseClass');

/**
 * @class NGN.model.data.Association
 * Represents a cross reference from one model to another (data association). 
 * For example, a person may have multiple orders. If a person and order are 
 * defined in their own MODEL definitions, then a cross reference is used to
 * link them together.
 * 
 * For those coming from a relational database background, the concepts are
 * similar to a relationship.
 * @extends Class
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [cardinatility='1:N']
			 * The cardinatily of the relationship from parent to child.
			 * 
			 * The relationship is defined as a _<parent>_:_<child>_ pair, 
			 * based on the parent --> child relationship.
			 * 
			 * Valid values are:
			 * 
			 * * **1:1**: One-to-One. Mandatory child. Example: `person -> weight`.
			 * * **1:0,1**: One-to-One with optional child. Example: `person -> deathDate`.
			 * * **1:N**: One-to-Many, optional child. Example: `person -> ownedVehicle`.
			 * * **1:1,N**: One-to-Many, minimum one child. Example: `person -> lung`.
			 * * **1:min,max**: One-to-Arbitrary. `min` and `max` can be any non-negative integer.
			 * For example, if a model must have at least 2 child models but no more than 4, the
			 * cardinality would be 1:2,4
			 */
			cardinality: {
				value:		config.cardinality || '1:N',
				enumerable: true,
				writable:	true
			},
			
			/**
			 * @cfg {NGN.model.Model}
			 * The parent model(s) associated to child(ren).
			 */
			parents: {
				value:		config.parent,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {NGN.model.Model/NGN.model.Model[]}
			 * The child model(s) associated to the parent(s).
			 */
			children: {
				value:		config.children,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [onChildDelete='none']
			 * Referential integrity. When the #child model is deleted,
			 * the following action is taken in accordance to #cardinality rules:
			 * 
			 * * **cascade**: Delete all parents referencing the child.
			 * * **restrict**: Do not allow removal of the parent.
			 * * **setnull**: Set the parent foreign key/id to `null`.
			 */
			onChildDelete: {
				value:		config.onChildDelete || 'none',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [onParentDelete='none']
			 * Referential integrity. When the parent model is deleted:
			 * 
			 * * **cascade**: Delete the nested child model.
			 * * **restrict**: Do not allow the parent to be deleted.
			 * * **none** - Ignore the child data model.
			 */
			onParentDelete: {
				value:		config.onParentDelete || 'none',
				enumerable:	true,
				writable:	true
			}
			
		});
	},
	
	/**
	 * @event deleteParent
	 * Fired when the parent model is deleted.
	 */
	onDeleteParent: function() {
		this.emit('deleteParent');
	},
	
	/**
	 * @event deleteChild
	 * Fired when the child model is deleted.
	 */
	onDeleteChild: function() {
		this.emit('deleteChild');
	}
	
});

module.exports = Class;
