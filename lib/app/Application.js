var events = require('events');
/**
 * @class NGN.app.Application
 * @singleton
 * Creating an application enables the globally accessible `application` variable,
 * which is designed to store custom application logic. This class registers the
 * application, loads defaults, and provides several convenience methods
 * The application scope is a globally accessible variable designed to store custom
 * application logic.
 * 
 * **Example**
 * 
 * 		var app = new NGN.app.Application({
 * 					name: 'myApp'
 * 				});
 * This basic example will create an NGN app and enable the global `application` scope. This allows
 * other files in the project to reference it easily:
 * 
 * 		console.log(application.name); // --> myApp
 * 
 * There is also a shortcut method available (NGN#app). Using this method, the following example would work:
 * 
 * 		NGN.app({name:'myApp'});
 * 		
 * 		console.log(application.name); // --> myApp
 * @aside guide application_scope 
 */
var Base = require('../NGN.core');
var Class = Base.extend({
	
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [name=NGN_Application]
			 * The name of the application
			 */
			name: {
				value:		config.name || 'NGN_Application',
				enumerable: true,
				writable:	true
			},
			
			/**
			 * @cfg {Object/String} [administrator=null]
			 * This can be almost anything. If an object is provided with
			 * an `email` element, it will be used to send administrative
			 * notices (if a mail server is available).
			 */
			administrator: {
				value:		config.administrator || null,
				enumerable:	true,
				writable:	true
			},
			
			__elements: {
				value:		[],
				enumerable:	false,
				writable:	true
			},
			
			/**
             * @property {Object} [DSN=Object]
             * Store **data service names** associated with the application.
             * Each DSN key represents a database connection.
             * 
             * 		var userDB = NGN.getDatasource('users');
             * 
             * *OR*
             * 
             * 		var userDB = NGN.DSN['users'];
             * @protected
             */
            DSN: {
                value:      {},
                enumerable: true,
                writable:   true
            },
            
            /**
             * @property {Object} [SERVER=Object]
             * Stores servers used in the application.
             * @protected
             */
            SERVER: {
                value:      {},
                enumerable: true,
                writable:   true
            },
            
            /**
             * @property {EventEmitter}
             * The application event bus. This traffics all events
             * of the application.
             * @protected
             * @readonly 
             */
            BUS: {
            	value:		new events.EventEmitter(),
            	enumerable:	true,
            	writable:	false
            }
			
		});
		
		// Load elements
		for (var el in this){
			if (this.hasOwnProperty(el))
				this.__elements.push(el);
		}
	
		__NGN.app = this;
	
	},
	
	/**
     * @method
     * Fires the specified event. Unlike #emit, this event is bubbled to the NGN#BUS.
     * @param {String} eventName
     * @param {Object} [metadata]
     */
    fireEvent: 		function( eventName, metadata ) {
				        this.BUS.emit( eventName, metadata || null );
				    },
    
    /**
     * @method
     * Fires the specified error.
     * @param {Object} [metadata]
     */
    fireError: 		function( err ) {
				        this.fireEvent( 'error', err || null );
				    },
	
     /**
      * @method
      * Return the application as a JSON object. This strips the functions and only returns simple data types. 
      */
     toJson: function(obj) {
     			obj = obj || this;
		     	var rtn = {}, me=this;
		     	for (var attr in obj){
		     		if (obj.hasOwnProperty(attr)) {
			     		switch(typeof obj[attr]) {
			     			case 'function':
			     				break;
			     			case 'object':
			     				rtn[attr] = me.toJson(obj[attr]);
			     				break;
			     			default:
			     				rtn[attr] = obj[attr];
			     				break;
			     		}
			     	}
		     	}
		     	return rtn;
		    },
     
     /**
      * @method
      * Get a server instance by it's registered name. 
	  * @param {String} name
      */     	
     getServer: 	function(name){
				     	return __NGN.getServer(name);
				     },
     
     /**
      * @method
      * Get servers by a specific type. This returns an object with each attribute of the
      * object being the name of a server and each value being a reference to the server object. 
	  * @param {String} type
	  * @returns {Object}
      */
     getServersByType: 	function(type){
					     	return __NGN.getServersByType(type);
					     },
    
    /**
     * @method
     * Create and register a #DSN.
     * @param {String} name
     * The name by which the #DSN is referenced.
     * @param {NGN.datasource.Connection} connection
     * A connection to a specific database or data store.
     */
    createDatasource: function( name, connection ){
        this.onBeforeCreateDSN(name, connection);
        this.DSN[name] = connection;
        this.onCreateDSN(name, connection);
        
    },
    
    /**
     * @method
     * Returns the specified datasource connection.
     * @param {String} name
     * The reference name of the #DSN to return.
     * @returns NGN.datasource.Connection 
     */
    getDatasource: function( name ){
        return this.DSN[name];
    },
    
    /**
     * @method
     * Shortcut. Equivalent to #getDatasource.
     * @param {String} name
     * The reference name of the #DSN to return.
     * @returns NGN.datasource.Connection 
     */
    getDSN: function( name ){
        return this.getDatasource(name);
    },
    
    /**
     * @method
     * Removes a datasource connection. 
     * @param {String} name
     * The reference name of the #DSN to remove.
     */
    removeDatasource: function( name ){
        this.onBeforeremoveDatasurce(name, this.DSN[name]);
        delete this.DSN[name];
        this.onremoveDatasource(name);
    },
    
    /**
     * @method
     * Shortcut. Equivalent to #removeDatasource.
     * @param {String} name
     * The reference name of the #DSN to remove.
     */
    removeDSN: function( name ){
    	this.removeDatasource(name);
    },
    
    /**
     * @method
     * Create and register a #SSN.
     * @param {String} name
     * The name by which the #SSN is referenced.
     * @param {NGN.service.Connection} connection
     * A connection to a specific service or module.
     */
    createService: function( name, connection ){
        this.SSN[name] = connection;
    },
    
    /**
     * @method
     * Returns the specified service source connection.
     * @param {String} name
     * The reference name of the #SSN to return.
     * @returns NGN.service.Connection 
     */
    getService: function( name ){
        return this.SSN[name];
    },
    
    /**
     * @method
     * Returns the entire #SSN object. 
     */
    getServices: function() {
        return this.SSN;
    },
    
    /**
     * @method
     * Removes a service or module connection. 
     * @param {String} name
     * The reference name of the #SSN to return.
     */
    removeService: function( name ){
        delete this.SSN[name];
    },
    
    /**
      * @method
      * Register a server 
	  * @param {NGN.core.Server}
	  * The server instance
      */     	
     registerServer: function(server){
     	//if (this.SERVER['__'+server.type] == undefined)
     	//	this.SERVER['__'+server.type] = {};
     	
     	var ct = 0;
     	while (this.SERVER[server.id] !== undefined){
     		ct++;
     		server.id = server.id + ct.toString();
     	}
     	
     	//this.SERVER[server.id] = server;
    
     	Object.defineProperty(this.SERVER,server.id,{
     		enumerable:	true,
     		get:		function(){ return server; }
     	});
     	//application.SERVER[server.id] = server;
    
	 	this.onRegisterServer(server);
     	//return server.id;
     },
     
     /**
      * @method
      * Unregister a server. This will remove the instance from the application.
      */
     unregisterServer: function(name) {
     	this.onUnregisterServer(this.SERVER[name]);
     	delete this.SERVER[name];
     },
     
     /**
      * @method
      * Get a specific server instance by name.
      */
     getServer: function(id){
     	if (this.SERVER[id] !== undefined)
     		return this.SERVER[id];
     	for(var server in this.SERVER){
     		for (var name in this.SERVER[server]){
	     		if (name == id)
    	 			return this.SERVER[server][name];
    		}
     	}
     	return false;
     },
     
     /**
      * @method
      * Get servers by a specific type. This returns an object with each attribute of the
      * object being the name of a server and each value being a reference to the server object. 
	  * @param {String} type
	  * @returns {Object}
      */
     getServersByType: function(type){
     	if (type == '*')
     		return this.SERVER;
     	return this.SERVER[type] || {};
     },
    
    /**
     * @event applicationstart
     * Fired when the NGN application starts.
     */
    onApplicationStart: function(){
    	this.fireEvent('applicationstart');
    },
    
    /**
     * @event applicationend
     * Fired when the application ends.
     */
    onApplicationEnd: function(){
    	this.fireEvent('applictionend');
    },
    
    /**
     * This event is fired just prior to the creation of a #DSN. 
     * @event beforecreatedatasource
     * @param {String} name
     * The reference name of the new datasource.
     * @param {NGN.datasource.Connection} connection
     * The connection about to be created. 
     */
    onBeforeCreateDSN: function( name, connection ) {
        this.fireEvent('beforecreatedatasource', name, connection || null);
    },
    
    /**
     * This event is fired just after the creation of a #DSN.
     * @event createdatasource
     * @param {String} name
     * The reference name of the new datasource.
     * @param {NGN.datasource.Connection} connection 
     * The connection object just created. 
     */
    onCreateDSN: function( connection ) {
        this.fireEvent('createdatasource',connection);
    },
    
    /**
     * This event is fired just prior to removeing a #DSN. 
     * @event beforeremovedatasource
     * @param {String} name
     * The reference name of the datasource.
     * @param {NGN.datasource.Connection} connection
     * The connection object about to be removeed. 
     */
    onBeforeRemoveDatasource: function( name ) {
        this.fireEvent('beforeremovedatasource', name, connection);
    },
    
    /**
     * This event is fired just after the destruction of a #DSN.
     * @event removedatasource
     * @param {String} name
     * The reference name of the new datasource.
     */
    onRemoveDatasource: function( name ) {
        this.fireEvent('removedatasource',name);
    },
    
    /**
     * @event registerserver
     * Fired when a server is registered
     * @returns {NGN.core.Server/null}
     */
    onRegisterServer: function(server){
    	this.emit('serverunregistered',server||null);
    },
    
    /**
     * @event unregisterserver
     * Fired when a server is unregistered/removed
     * @returns {NGN.core.Server/null}
     */
    onUnRegisterServer: function(server){
    	this.fireEvent('unregisterserver',server||null);
    },
    
    /**
     * @event ready
     * Fired when the application is ready.
     */
    onReady: function(){
    	this.fireEvent('emit');
    }
});

module.exports = Class;