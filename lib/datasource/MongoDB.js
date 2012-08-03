var mongodb     = require('mongodb'),
	Server		= mongodb.Server,
	DB			= mongodb.Db, 
    Connection  = require('./Connection');

/**
 * @class NGN.datasource.MongoDB
 * Represents a connection to a MongoDB server.
 *  	require('colors');
 * 		
 * 	var ds = new NGN.datasource.MongoDB({
 *			dsnName: 'mongotest',
 *			autoConnect: false,
 *			host: 'ds00001.mongolab.com',
 *			port: 30007,
 *			database: 'my_db',
 *			username: 'user',
 *			password: 'password'
 *		});
 *		
 *		ds.on('connect',function(){
 *			console.log('Client is connecting...'.green);
 *		});
 *		
 *		// Once the connection is established, insert some data.
 *		ds.on('connected',function(){
 *		
 *			var client = ds.getClient();
 *			
 *			console.log('Connected!'.magenta);
 *		
 *			// Insert data
 *			client.collection('test', function(err, collection) {
 *				var doc = {
 *					key: 1,
 *					name: 'myTest'
 *				};
 *				
 *				collection.insert(doc,function(err, result){
 *					console.log('Record Saved:'.green);
 *					console.log(result);
 *					
 *					collection.remove({key:1},function(err2,result2){
 *						console.log('Record removed successfully:'.green);
 *						console.log('TEST COMPLETE'.grey);
 *					});
 *				});
 *			});
 *		});
 *
 *     // Connect to the datasource.
 *		ds.connect();
 * @extends NGN.datasource.Connection
 * @requires mongodb
 * @docauthor Corey Butler
 */
var Class = Connection.extend({
    
    /**
     * @constructor
     * Create a new connection to the datasource.
     */
    constructor: function( config ){
        
        // Default configuration
        config = config || {};
       
        // Inherit parent object
        Class.super.constructor.call( this, config );
                
        // Self reference
        var me = this;
        
        // Set default connection attributes
        this.type    = 'MongoDB';
        
        /**
         * @cfg {String} [host=127.0.0.1]
         * The host server.
         */
        this.host    = config.host   || '127.0.0.1';
        
        /**
         * @cfg {Number} [port=6379]
         * The host port.
         */
        this.port    = config.port     || 27017;
        
        /**
         * @property
         * @readonly
         * @protected
         * The underlying [mongodb client](https://github.com/mongodb/node-mongodb-native) used to interact with the database instance. 
         */
        Class.super.client = {connected:false,placeholder:true};
        
        // Additional properties of MongoDB
        Object.defineProperties(this,{
        	
        	/**
        	 * @cfg {Boolean} [autoReconnect=true]
        	 * Automatically retry sending a command to the server if there is a failure.
        	 */
        	autoReconnect: {
        		value:		__NGN.coalesce(config.autoReconnect,true),
        		enumerable:	true,
        		writable:	true
        	},
        	
        	/**
        	 * @cfg {Number} [poolSize=1]
        	 * Optionally control how many tcp connections can be created in parallel.
        	 * The native driver will use a round-robin strategy to dispatch and read from
        	 * the tcp connection.
        	 */
        	poolSize: {
        		value:		config.poolSize || 1,
        		enumerable:	true,
        		writable:	true
        	},
        	
        	_server: {
        		value:		new Server(this.host,this.port,{auto_reconnect:this.autoReconnect,poolSize:this.poolSize}),
        		enumerable:	false,
        		writable:	false
        	}
        	
        });
        
        // Create a secure connection if a password is provided.
        if (this.autoConnect)
        	this.connect();
    },
    
    /**
     * @method
     * Establish a live connection to the datasource.
     * This creates a [mongodb](http://mongodb.github.com/node-mongodb-native/api-articles/nodekoarticle1.html) #client that can
     * interact with the specified database.  
     */
    connect: function(){  	
    	var me = this;

		this.onConnect();

		if (this.client.hasOwnProperty('placeholder')){
			
			if (this.database == null) {
				this.fireEvent('No database defined.');
				return;
			}
				
			var ds = new DB(this.database,this._server);
			
			ds.open(function(err,conn){
				if (err)
					this.fireError(err);
				else {
					if (me.appname !== null && me.password !== null) {
						me.onAuthorization();
						conn.authenticate(me.appname,me.password,function(e,accepted){
							if (e)
								me.fireError(e);
							else if (!accepted)
								me.emit('error','Login to MongoDB server failed.');
							me.onAuthorized(accepted);
							me.client = conn;
							me.onConnected();
						});
					} else {
						me.client = conn;
						me.onConnected();
						me.client.on('end',function(){
				    		me.onDisconnect();
			    		});
			    	}
				}
			});
		}
        
    }
    
});

// Create a module out of this.
module.exports = Class;
