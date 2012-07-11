var events      = require('events'),
    redis       = require('redis'),
    Connection  = require('./Connection');

/**
 * @class NGN.datasource.Redis
 * Represents a connection to a Redis instance.
 * @extends NGN.datasource.Connection
  * @requires redis
 * @docauthor Corey Butler
 */
var Redis = Connection.extend({
    
    /**
     * @constructor
     */
    constructor: function( config ){
        
        // Default configuration
        config = config || {};
        
        // Inherit parent object
        Redis.super.constructor.call( this, config );
                
        // Self reference
        var me = this;
        
        // Set default connection attributes
        Redis.super.type    = 'redis';
        
        /**
         * @cfg {String} [host=127.0.0.1]
         * The host server.
         */
        Redis.super.host    = config.host   || '127.0.0.1';
        
        /**
         * @cfg {Number} [port=6379]
         * The host port.
         */
        Redis.super.port    = config.port     || 6379;
        
        /**
         * @cfg {String} password
         * An optional password passed to the Redis instance.
         */
        Redis.super.password= config.password || null;
        
        // Define properties of the class
        Object.defineProperties(this,{
            
            /**
             * @property {Object}
             * An object containing host server, port, password, and connection string.
             */
            connection: {
                enumerable:     true,
                get:            function(){
                                    return {
                                        host:       this.host,
                                        port:       this.port,
                                        password:   this.password,
                                        string:     (this.username !== null && this.password !== null ? this.username + ':' + this.password + '@' : '')
                                                    + this.host+':'+this.port+'/'
                                    };
                                }
            },
            
            /**
             * @property
             * @readonly
             * @protected
             * The underlying [redis client](https://github.com/mranney/node_redis) used to interact with the redis database instance. 
             */
            client: {
                enumerable:     true,
                writable:       true,
                value:          redis.createClient( this.port, this.host )
            },
            
            /**
             * @cfg {Number} [defaultTTL=0]
             * The value, in seconds, of the default period a record will be persisted in the store.
             * A value of `0` will persist the record indefinitely. 
             */
            defaultTTL: {
                value:          0,
                enumerable:     true
            }
            
        });
        
        // Create a secure connection if a password is provided.
        if ( this.password !== null ) {
            this.client.auth(this.password,function(){
                me.onConnect();
            });
        } else
            me.onConnect();
        
    },
    
    
    /**
     * @method
     * Close the connection. 
     */
    close: function() {
        this.client.quit();
    },
    
    
    /**
     * @method
     * Put a key/value in the database. Supports TTL expiration.
     * 
     *      redis.insert('mykey', {first:'John',last:'Doe'}, 360);
     * 
     * The example above creates an object in redis with a key of `mykey`, set to expire in an hour.
     * 
     * @param {String} key 
     * The unique key name of the record. If the key is not unique, it will overwrite
     * the existing record. 
     * @param {Object} value 
     * The value to store. This may be any valid JavaSscript object. Complex objects, such as
     * `JSON`, are serialized to a #String before persisting to the store. 
     * @param {Number} [ttl] 
     * Optional time-to-live for the record. The record will automatically expire after this. Value in seconds.
     * If this is not set, the #defaultTTL value is used. If that value is not set, `0` is used (no expiration).
     */
    insert: function( key, value, ttl ) {
        
        Redis.super.insert.call(this, arguments);
        
        var exp = ttl || this.defaultTTL,
            val = typeof value === 'object' ? JSON.stringify(value) : value;
    
        if ( exp > 0 )
            this.client.setex( key, exp, val );
        else
            this.client.set( key, val );
            
    },
    
    /**
     * @method
     * In Redis, there is no update. This method is a reference to the #insert method.
     */
    update: function( key, value, ttl ) {
        this.insert(key,value,ttl);
    },
    
    /**
     * @method
     * In redis, there is no upsert. This method is a reference to the #insert method. 
     */
    upsert: function( key, value, ttl ) {
        this.insert(key,value,ttl);
    },
    
    /**
     * @method
     * Get a value by a known key.
     * 
     *     var redis = new NGN.database.Redis();
     * 
     *     redis.get('mykey',function(reply){
     *         console.log(reply);
     *     });
     * 
     * This function receives the reply argument, which is null if no value is found.
     * 
     *     redis.get('mykey', function(value){
     *         if (value == null )
     *             console.log('No value');
     *         else
     *             console.log('Value is', value);
     *     });
     * 
     * @param {String} key 
     * The key of the cache record to return.
     * @param {Function} callback 
     * The callback function executed when a result is returned.
     */
    select: function( key, callback ) {
        
        var me = this;
        
        this.client.get( key, function( err, reply ){
            if (err)
               me.super.fireError(err);
            else {
                var result = null;
                try {
                    result = JSON.parse(reply);
                } catch (e) {
                    result = reply;
                }
                callback( result );
            }
        });
        
    },


    /**
     * @method
     * Remove a record by key.
     * @param {String} key
     * The key to remove from the store.
     */
    remove: function( key ) {
        var me = this;
        
        this.client.del( key, function(err, data){
            if (err)
                me.super.fireError(err);
        });
    },

    
    /**
     * @method
     * Purge all keys from the database (only the database to which #client is actively connected to).
     * This method will remove everything, even if it has has future expiration set.
     */
    purge: function() {
        this.client.flushdb();
    },
    
    
    /**
     * @method
     * Identifies whether a key exists.
     * 
     *      redis.keyExists('mykey',function(exists){
     *          if (exists)
     *              console.log('mykey exists!');
     *          else
     *              console.log('mykey exists!');
     *      });
     * 
     * @param {String} key
     * @param {Function} callback
     * Executed on completion of the request. This
     * passes a boolean argument to the callback.
     */
    keyExists: function( key, callback ) {
        key = key || null;
        
        return this.client.exists(key,callback);
    }
    
});

// Create a module out of this.
module.exports = Redis;
