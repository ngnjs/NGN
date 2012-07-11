var events      = require('events'),
    NGN         = require('../NGN.Base');

/**
 * @class NGN.datasource.Connection
 * Represents a connection to a database instance.
 * @extends NGN.Base
 * @requires NGN
 * @docauthor Corey Butler
 */
var Connection = NGN.extend({
    
    /**
     * @constructor
     * Initialize a data source connection.
     */
    constructor: function( config ){
        
        // Self reference
        var me = this;
        
        // Default configuration
        config = config || {};
        
        // Inherit parent object
        Connection.super.constructor.call( this, config );
        
        // Define properties of the class
        Object.defineProperties(this,{
            
            /**
             * @property {String}
             * @readonly
             * @protected
             * Identifies what type of database connection the object is referencing.
             */
            type: {
                value:          'Unknown',
                enumerable:     false,
                writable:       false
            },
            
            /**
             * @cfg {String} [host=127.0.0.1]
             * The host server.
             */
            host: {
                value:          config.host   || '127.0.0.1',
                enumerable:     true
            },
            
            /**
             * @cfg {Number} [port]
             * The host port.
             */
            port: {
                value:          config.port     || null,
                enumerable:     true
            },
            
            /**
             * @cfg {String} password
             * An optional password passed to the database instance.
             */
            password: {
                value:          config.password || null,
                enumerable:     false
            },
            
            /**
             * @cfg {String} username
             * An optional username passed to the database instance.
             */
            username: {
                value:          config.username || null,
                enumerable:     true
            },
            
            /**
             * @property {Boolean} [securedConnection=false]
             * Indicates the connection has been authorized using #password. 
             */
            securedConnection: {
                value:          false,
                enumerable:     true,
                writable:       true
            },
            
            /**
             * @property {Boolean} [connected=false]
             * This property is set to `true` once the connection is established. 
             */
            connected: {
                value:          false,
                enumerable:     true,
                writable:       true
            }
            
        });
        
    },
    
    /**
     * @method
     * Insert a record into the database. 
     */
    insert: function(){
    	this.onInsert.apply(this, arguments);
    	console.log(arguments);
    },
    
    /**
     * @method
     * Modify a record 
     */
    update: function(){},
    
    /**
     * @method
     * Delete a record. 
     */
    remove: function(){},
    
    /**
     * @method
     * Add a record if it does not already exist. 
     */
    upsert: function(){},
    
    /**
     * @method
     * Retrieve a specific record. 
     */
    select: function(){},
    
    
    
    
    /**
     * @event insert
     * Fired when a new record is inserted.
     * @returns {Object}
     * Returns the record. 
     */
    onInsert: function(){},
    
    /**
     * @event update
     * Fired when a record is updated.
     * @returns {Object}
     * Returns the record. 
     */
    onUpdate: function(){},
    
    /**
     * @event remove
     * Fired when a record is removed. 
     * @returns {Object}
     * Returns the record. 
     */
    onRemove: function(){},
        
    /**
     * @event databaseconnection 
     * Fired when a datbase connection is established.
     * @returns {NGN.datasource.Connection}
     */
    onConnect: function() {
        this.connected = true;
        this.fireEvent('databaseconnection', this);
    }
    
});

// Create a module out of this.
module.exports = Connection;
