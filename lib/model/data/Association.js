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
			 * * **0:N**: Any number of children. (default)
			 * * **1:N**: Between one and infinite children.
			 * * **1:1**: One and only one child.
			 * * **0:1**: Zero or one child.
			 * * **Custom**: `<begin_range>:<end_range>`
			 * Custom relationship examples: 
			 * - `1:4` means between 1 and 4 children
			 * - `0:3` means up to 3 children.
			 */
			cardinality: {
				value:		config.cardinality || '0:N',
				enumerable: true,
				writable:	true
			},
			
			/**
			 * @cfg {NGN.model.Model}
			 * The parent model, such as `NGN.model.Model`.
			 * @required
			 */
			model: {
				value:		config.model,
				enumerable:	true,
				writable:	true
			},
			
			/*
			 * @cfg {String}
			 * The property name used to reference child object(s). This generates a getter.
			 * 
			 * For example, if this is set to `kids`, `getKids()` will return the value.
			 
			property: {
				value:		config.property,
				enumerable:	true,
				writable:	true
			},*/
			
			/**
			 * @cfg {String} [onDelete='setnull']
			 * Referential integrity. When the parent model is deleted,
			 * the following action is taken in accordance to #cardinality rules:
			 * 
			 * * **cascade**: Delete all child #model instances.
			 * * **restrict**: Do not allow removal of the child.
			 * * **setnull**: Set the parent foreign key/id/ref to `null`.
			 */
			onDelete: {
				value:		config.onDelete || 'setnull',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @property
			 * The placeholder containing nested models.
			 * @hidden 
			 */
			/*value: {
				value:		null,
				enumerable:	true,
				writable:	true
			},*/
			
			/**
			 * @property 
			 * The minimum number of associated models required to validate the parent model.
			 * @private
			 * @readonly 
			 */
			min: {
				value:		0,
				writable:	false,
				enumerable:	true
			}
			
			
			/**
			 * @property max
			 * The maximum number of associated models required to validate the parent model.
			 * This is `undefined` when no maximum is specified.
			 * @private
			 * @readonly 
			 */
			
		});
		
		this.min = parseInt(this.cardinality.toString().split(':')[0]) >= 0 ? parseInt(this.cardinality.split(':')[0]) : 0;
		
		if (['N','M'].indexOf(this.cardinality.toString().split(':')[1].toString().trim().toUpperCase()) < 0)
			this.max = parseInt(this.cardinality.toString().split(':')[1]);

	},
	
	/**
	 * @method
	 * Serialize the objects contained in the association.
	 */
	serialize: function(value) {
		var val = !Array.isArray(value) ? [value] : value;
		
		for(var i=0;i<val.length;i++)
			val[i] = val[i].serialize(true);
		
		return  val.length == 1
				? val[0]
				: (
					val.length == 0
					? []
					: val
				);
	}
	
});

module.exports = Class;
