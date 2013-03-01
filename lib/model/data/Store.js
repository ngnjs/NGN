var Base = require('../../BaseClass');

/**
 * @class NGN.model.data.Store
 * A data manager controls how data is saved/fetched from a data source (ORM).
 * @extends Class
 * @private
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
			 * @cfg {String/NGN.datasource.Connection} datasource (required)
			 * The connection to the datasource where data will be stored.
			 */
			datasource: {
				value:		config.datasource,
				enumerable:	true,
				writable:	true
			},
			
			dsn: {
				enumerable:	false,
				getter:		function(){
								if (this.datasource instanceof __NGN.datasource.Connection)
									return this.datasource;
								else {
									if (APP == undefined)
										this.fireError('No datasource found for "'+this.datasource.toString()+'"');
									else
										return APP.getDatasource(this.datasource);
								}
							}
			}
			
		});
		
	},
	
	
	
});

module.exports = Class;
