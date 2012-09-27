var Base        = require('../../../datasource/Client');

/**
 * @class NGNX.datasource.client.Redis
 * Simplifies & expands several of the most common Redis commands.
 * @extends NGN.datasource.Client
 * @author Corey Butler
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		Class.super.constructor.call(this,config);

	},
	
	/**
	 * @method
	 * This is the same as the Redis `GET` command, but it automatically 
	 * deserializes a string into JSON when necessary. Otherwise, the 
	 * original record value will be returned in the callback.
	 * 
	 * Errors are automatically passed to the global error handler via NGN.core#fireError.
	 * @param {String} key
	 * @param {Function} callback
	 * The callback receives a single argument containing the value of the record.
	 * If no record is available, `null` is returned.
	 */
	get: function(key, callback) {
	
		var me = this;
	
		this._client.get(key,function(err, reply){
			if (err)
				me.fireError(err);//callback( null );
			else {
			    var result = null;
			    try {
			        result = JSON.parse(reply);
			    } catch (e) {
			        result = reply;
			    }
				callback(result);
			}
		});
	
	},
	
	/**
	 * @method
	 * A wrapper around the `SET` and `SETX` 
	 * Errors are automatically passed to the global error handler via NGN.core#fireError.
	 * @param {String} key (required)
	 * The key identifier for the new record.
	 * @param {String/Object} value
	 * The string or object to be stored. Objects are automatically serialized to JSON. Functions
	 * are stripped during this process.
	 * @param {Number} [ttl=0]
	 * Time to Live in seconds. Defaults to never time out. 
	 * @param {Object} [callback]
	 * No arguments are provided to the callback.
	 */
	put: function( key, value, ttl, callback ) {

		var exp = ttl || 0,
			val = typeof value === 'object' ? JSON.stringify(value) : value;
	
		if ( exp > 0 )
			this._client.setex( key, exp, val, callback || __NGN.emptyFn );
		else
			this._client.set( key, val, callback || __NGN.emptyFn );

	},
	
	/**
	 * @method
	 * Remove a cache value.
	 * @param {String} key
	 * The key to remove from the DB.
	 * @param {Function} [callback]
	 */
	remove: function( key, callback ) {
		this._client.del( key, function(err, data){
			if (err) {
			    this.fireError(err);
			    return;
			};
			if (callback)
			  callback(data);
		});
	}
	
});

module.exports = Class;