/**
 * @class NGN.core.Process
 * @singleton
 * A process enables a globally accessible NGN#configuration,
 * which is designed to store custom data for use throughout applications. 
 * This class optionally connects with [NGN Mechanic](#!/guide/mechanic),
 * making it accessible through Mechanic. A process can also send events
 * to Mechanic, making it possible for Mechanic to respond to application-
 * specific events.
 * 
 * When using a process with Mechanic, a secure (TLS) socket connection is
 * established between the process and Mechanic. If Mechanic is non-responsive
 * (i.e. temporarily down, network outage, etc), the process will attempt to
 * reconnect automatically on an adjustable time interval. 
 * 
 * Once a connection to Mechanic is established, an auth handshake is exchanged.
 * Upon successful authentication and authorization, a communication channel is
 * opened between the process and Mechanic.
 * 
 * ## NGN Mechanic Benefits
 * 
 * The complete list of benefits is available in the [guide](#!/guide/mechanic).
 * The highlights include system monitoring, remote process control, pooled processing,
 * OS-specific logging, shell access, and the ability to use native OS daemons/services
 * for managing the process.
 * @private 
 */
var fs = require('fs'),
    os = require('os'),
    path = require('path'),
    util = require('ngn-util'),
    bcrypt = util.require('bcrypt',true),
    Base = require('../NGN.core');

var Class = Base.extend({
	
	constructor: function(config,callback){
	  
	  if (process.hasOwnProperty('mechanic')){
	    throw new Error('Only one NGN process can run per node process.');
	  }
		
		var me = this;
		process.ngn = this;
		
		callback = callback || function(){};
		config = config || {};
		
		if (typeof config == 'function'){
		  callback = config;
		  config = {};
		}

		// NGN Mechanic Configuration Defaults
		if (__NGN.coalesce(config.enableMechanic,true)){
  		process.mechanic = {};
  		Object.defineProperties(process.mechanic,{
  		  /**
  		   * @cfg {Number} [mechanicPort=55555]
  		   * The port on which [NGN Mechanic](#!/guide/mechanic) is running. 
  		   */
  		  mechanicPort: {
  		    enumerable: false,
  		    writable: false,
  		    value: config.mechanicPort || 55555
  		  },
  		  
  		  /**
  		   * @cfg {String} [mechanicHost=localhost] 
  		   * The host IP address, domain, or URI where [NGN Mechanic](#!/guide/mechanic) is running. 
  		   */
  		  mechanicHost: {
  		    enumerable: false,
  		    writable: false,
  		    value: config.mechanicHost || 'localhost'
  		  },
  		  
  		  /**
  		   * @cfg {Boolean} [enableMechanic=true]
  		   * [NGN Mechanic](#!/guide/mechanic) provides process management and monitoring for all 
  		   * connected processes on an NGN server.
  		   * 
  		   * If the process cannot connect to Mechanic, it will periodically poll the specified
  		   * Mechanic server (default is `localhost`) until a connection is established. If
  		   * your process does not need Mechanic, then this attribute should be set to `false`.
  		   */
  		  enableMechanic: {
  		    enumerable: true,
  		    writable: true,
  		    value: true
  		  },
  		  
  		  /**
  		   * @cfg {Boolean} [remote=false]
         * When using [NGN Mechanic](#!/guide/mechanic), this can
         * be set to force Mechanic to recognize the process as
         * a remotely hosted process.
         */
  		  remote: {
  		    enumerable: false,
  		    get: function(){
  		      if (['127.0.0.1','localhost'].indexOf(process.mechanic.server) < 0){
  		        return __NGN.coalesce(config.remote,false);
  		      }
            return true;
  		    }
  		  },
  		  
  		  /**
  		   * @cfg {Boolean} system
  		   * Indicates this is a system process running on the same
  		   * server as [NGN Mechanic](#!/guide/mechanic). Local system
  		   * processes are granted a higher level of access in Mechanic
  		   * (i.e. they can be used to supplement Mechanic services).   
  		   */
  		  // Boolean indicator that NGN Mechanic is hosted on the same server
  		  internal: {
          enumerable: false,
          get: function(){
            if (process.mechanic.remote){
              return false;
            }
            return __NGN.coalesce(config.system,false);
          }
        },
        
        /**
         * @cfg {String} [mechanicSecret=null]
         * (Optional) The shared secret defined in the [NGN Mechanic Configuration](#!/guide/mechanic).
         */
        key: {
          enumerable: false,
          writable: true,
          value: config.mechanicSecret || null
        },
  		  
  		  /**
  		   * @cfg {Number} [healthcheckFrequency=5]
  		   * The interval, in seconds, between health checks. A
  		   * health check is a message sent to [NGN Mechanic](#!/guide/mechanic) containing
  		   * data about the utilization of the server on which the process runs. 
  		   */
  		  healthcheckFrequency: {
          enumerable: false,
          writable: false,
          value: config.healthCheckFrequency || 5
        },
        
        // This is the socket client that connects to Mechanic
        client: {
          enumerable: false,
          writable: true,
          configurable: false,
          value: new __NGN.socket.Client({
            autoConnect: false,
            autoReconnect: true,
            connectionType: 'tls',
            port: config.mechanicPort || 55555,
            host: config.mechanicHost || 'localhost'
          })
        },
        
        send:{
          enumerable: true,
          writable: true,
          value: function(eventName,meta){
            if (process.mechanic.client.connected){
              var _data = typeof meta == 'object' ? meta : {};
              if (typeof meta !== 'object' && meta !== undefined){
                _data.data = meta;
              }
              process.mechanic.client.send(eventName,_data);
            } else {
              console.log((eventName.bold+' failed to fire.').yellow);
              /**
               * @event eventFailure
               * Fired when the process unsuccessfully sends an event to [NGN Mechanic](#!/guide/mechanic).
               * This event is only fired if a connection to an NGN Mechanic process exists, but cannot be
               * completed. The most common use case is when an NGN process has established a connection
               * but has not yet registered/authenticated with the NGN Mechanic service.
               * @returns {Object}
               * The resulting object contains two attributes:
               * - *name*: The event name that failed.
               * - *meta*: Any metadata fired by the event. 
               */
              me.emit('eventFailure',{
                name: eventName,
                meta: meta || null
              });
            }
          }
        }
      });
      this._socketHandler(process.mechanic.client);
    }
    
    Object.defineProperties(this,{
      
      /**
       * @property {Object} [DSN=Object]
       * Store **data service names** associated with the application.
       * Each DSN key represents a database connection.
       * 
       *    var userDB = NGN.system.getDatasource('users');
       * 
       * *OR*
       * 
       *    var userDB = NGN.system.DSN['users'];
       * @protected
       */
      DSN: {
          value:      {},
          enumerable: true,
          writable:   true
       },
      
      /**
       * @property {Object}
       * Data Manager: Map NGN.model.Model objects to a persistence/storage object (NGN.model.data.Manager). 
       * @protected
       */
      DM: {
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
       * @property {Boolean} [connected=false]
       * @readonly
       * Indicates the process is connected to a managing agent (i.e. [NGN Mechanic](!#/guide/mechainc)).
       */
      connected: {
        enumerable: true,
        get: function(){
          return __NGN.coalesce(process.mechanic.client.connected,false);
        }
      },
      
      _monitor: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      },
      
      /**
       * @property {Boolean} [initialized=false]
       * Indicates the process has been initialized with [NGN Mechanic](#!/guide/mechanic).
       * @readonly 
       */
      initialized: {
        enumerable: false,
        writable: true,
        value: false
      },
      
      /**
       * @method initialize 
       * Initialize the configuration after it has been identified.
       * @param {Function} callback
       * Receives the mechanic connection as the only callback argument.
       * @protected
       */
      initialize: {
        enumerable: false,
        writable: true,
        value: function(callback){
          if (this.initialized){
            callback(this);
            return;
          }
          Object.defineProperties(this,{
            /**
             * @cfg {String} [name=NGN_Application]
             * The name/title of the process.
             */
            name: {
              value: config.name || 'NGN_Application',
              enumerable: true,
              writable: true
            },
            
            /**
             * @cfg {String} [description]
             * A description of the process.
             */
            description: {
              enumerable: true,
              writable: true,
              value: config.description || this.name
            },
            
            /**
             * @cfg {Array/String} administrators
             * An email address or array of email addresses representing
             * administrative contacts who will receive alerts about this
             * process. 
             */
            administrators: {
              enumerable: true,
              writable: true,
              value: config.administrators || []
            },
            
            __elements: {
              value:    [],
              enumerable: false,
              writable: true
            }
            
          });
          
          this.administrators = typeof this.administrators == 'string' ? this.administrators.split(',') : this.administrators;
          
          // Load elements
          for (var el in this){
            if (this.hasOwnProperty(el))
              this.__elements.push(el);
          }
        
          var me = this;
          
          // Create a global reference
          Object.defineProperties(__NGN,{
            configuration: {
              enumerable: false,
              get: function() {
                return me;
              }
            },
            config: {
              enumerable: false,
              get: function(){
                return __NGN.configuration;
              }
            },
            cfg: {
              enumerable: false,
              get: function(){
                return __NGN.configuration;
              }
            }
          });
          
          this.initialized = true;
          callback && callback(this);
        } 
      }
      
		});

		Class.super.constructor.call(this,config);
		
		// Execute the callback if defined
		if (__NGN.coalesce(config.enableMechanic,true)){
		  process.mechanic.client.connect(function(){
		    me.initialize();
		  });
		  callback && callback(me);
		} else {
  		callback && callback(this);
	  }
	},
	
	/*
	 * The socket handler manages communication with NGN Mechanic.
	 */
	_socketHandler: function(socket){
	  // Only works if mechanic is enabled.
	  if (!process.hasOwnProperty('mechanic')){
	    return null;
	  }
	  
    // NGN Mechanic Processes
    var mechProcs = process.mechanic.client == undefined ? [] : [
          'register', 
          'authorizationRequest',
          'adminAuthorizationRequest',
          'identificationDataSent', 
          'identificationRequest',
          'credentialDataSent',
          'authorized',
          'authenticated',
          'heartbeat',
          'serverConfigurationRequest',
          'unauthorized',
          'authFailure',
          'adminAccessGranted',
          'adminAccessRejected',
          'heartbeatRequest',
          'presumeDeadConnection',
          'ready'
        ],
        
        genProcs = [
          'connect',
          'connecting',
          'disconnect',
          'reconnect',
          'newCustomEvent',
          'error',
          'reconnecting'
        ];
    
    var procs = genProcs.concat(mechProcs), me = this;
    
    // Support for NGN Mechanic processes
    mechProcs.forEach(function(proc){
      if (proc !== null){
        socket.on(proc,function(){
          if (mechProcs.indexOf(proc) < 0) {
            me.emit(proc,arguments);
          } else {
            if (me['onMechanic'+__NGN.string.capitalize(proc)] == undefined) {
              me.fireWarning('onMechanic'+__NGN.string.capitalize(proc)+' is not defined. Processing "'+proc+'" command aborted.');
            } else {
              me['onMechanic'+__NGN.string.capitalize(proc)](arguments[0]);
            }
          }
        });
      }
    });
    
    // Support for custom events
    socket.on('newCustomEvent',function(event,args){
      var obj = {name:event.trim()};
      if (args){
        obj.args = args;
      }
      if (!socket._emitter._events.hasOwnProperty(obj.name)){
        socket._emitter._events[obj.name] = function(){
          me.emit(obj.name,arguments[0]);
        }
      }
    });

    // Generic Events   
    socket.on('disconnect',function(){
      me.onDisconnect();
    });
    socket.on('connecting',function(){
      me.onConnecting();
    });
    socket.on('connect',function(socket){
      me.onConnect();
    });
    socket.on('reconnect',function(){
      me.onReconnect();
    });
    socket.on('reconnecting',function(){
      me.onReconnecting();
    });
    socket.on('serverFault',function(){
      me.onServerFault();
    });
    socket.on('error',function(e){
      me.fireError(e);
    });
	},
	
  /**
   * @method getRegistrationData
   * Gets registration data for [NGN Mechanic](#!/guide/mechanic).
   * @private
   */	
	getRegistrationData: function(){
    return {
      internal: process.mechanic.remote == true ? false : process.mechanic.internal,
      remote: process.mechanic.remote,
      name: this.name,
      description: this.description,
      admin: this.administrators || [], // List of administrator objects
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  },
  
  /**
   * @method monitor
   * Sends a heartbeat notice to [NGN Mechanic](#!/guide/mechanic) with system load details.
   * @param {Boolean} [forceRestart=false]
   * Set this to `true` when forcing a restart.
   * @private
   */
  monitor: function(restart){
    var me = this;
    restart = __NGN.coalesce(restart,false);
    
    if (!this.connected){
      this._monitor = null;
      return;
    }
    
    if (restart){
      clearTimeout(this._monitor);
      this._monitor = null;
    }
    
    var hb = function(){
      if (!me.connected){
        return;
      }
      var msg = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        i: process.mechanic.client.bytesRead,
        o: process.mechanic.client._bytesDispatched
      };
      if (me.remote){
        var server = me.getHostUtilization();
        for (var i in server){
          msg[i] = server[i];
        }
      }
      /**
       * @event heartbeat
       * Fired when the heartbeat/healthcheck is sent to [NGN Mechanic](#!/guide/mechanic). 
       */
      me.emit('heartbeat',msg);
      process.mechanic.send('heartbeat',msg);
      me._monitor = setTimeout(hb,process.mechanic.healthcheckFrequency*1000);
    };
    
    if (this._monitor == null){
      hb();
    }
    
  },
  
  /**
   * @method getHostDetails
   * Get the details of the host machine on which the process is running. 
   * @returns {Object}
   */
  getHostDetails: function(){
    return {
      platform: process.platform,
      arch: process.arch,
      os: {
        type: os.type(),
        release: os.release()
      },
      cpu: os.cpus(),
      nic: os.networkInterfaces(),
      hostname: os.hostname(),
      node: process.versions
    };
  },
  
  /**
   * @method getHostUtilization
   * Get the host utilization levels (uptime, loadavg, memory usage). 
   * @returns {Object}
   */
  getHostUtilization: function(){
    return {
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      }
    }
  },
	
	/**
	 * @method on
	 * Listens for a specific event.
	 * @param {String} eventName
	 * @param {Function} callback 
	 */
	on: function(eventName, callback){
		this._emitter.on(eventName,callback);
	},
  
  /**
   * @method fireEvent
   * Fires the specified event.
   * @param {String} eventName
   * @param {Object} [metadata]
   */
  fireEvent: function( eventName, metadata ) {
    this._emitter.emit( eventName, metadata || null );
  },
  
  /**
   * @method bubbleEvent
   * Fires the specified event and bubbles it up to the [NGN Mechanic](#!/guide/mechanic).
   * @param {String} eventName
   * @param {Object} [metadata]
   */
  bubbleEvent: function( eventName, metadata ) {
    this.fireEvent( eventName, metadata || null );
    process.mechanic.send(eventName, metadata || null);
  },
  
  /**
   * @method fireError
   * Fires the specified error.
   * @param {Object} [metadata]
   */
  fireError: function( err ) {
    this.fireEvent( 'error', err || null );
  },

   /**
    * @method
    * Get a server instance by it's registered name. 
  * @param {String} name
    */     	
   getServer: function(name){
   	 return __NGN.getServer(name);
   },
   
   /**
    * @method
    * Get servers by a specific type. This returns an object with each attribute of the
    * object being the name of a server and each value being a reference to the server object. 
  * @param {String} type
  * @returns {Object}
    */
   getServersByType: function(type){
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
 	
   	Object.defineProperty(this.SERVER,server.id,{
   		enumerable:	true,
   		get:		function(){ return server; }
   	});
  
    this.onregisterServer(server);
  },
   
  /**
   * @method
   * Unregister a server. This will remove the instance from the application.
   */
  unregisterServer: function(name) {
   	this.onunregisterServer(this.SERVER[name]);
   	delete this.SERVER[name];
  },
   
  /**
   * This event is fired just prior to the creation of a #DSN. 
   * @event beforecreateDatasource
   * @param {String} name
   * The reference name of the new datasource.
   * @param {NGN.datasource.Connection} connection
   * The connection about to be created. 
   */
  onBeforeCreateDSN: function( name, connection ) {
    this.fireEvent('beforecreateDatasource', name, connection || null);
  },
  
  /**
   * This event is fired just after the creation of a #DSN.
   * @event createDatasource
   * @param {String} name
   * The reference name of the new datasource.
   * @param {NGN.datasource.Connection} connection 
   * The connection object just created. 
   */
  onCreateDSN: function( connection ) {
    this.fireEvent('createDatasource',connection);
  },
  
  /**
   * This event is fired just prior to removeing a #DSN. 
   * @event beforeRemoveDatasource
   * @param {String} name
   * The reference name of the datasource.
   * @param {NGN.datasource.Connection} connection
   * The connection object about to be removeed. 
   */
  onbeforeRemoveDatasource: function( name ) {
    this.fireEvent('beforeRemoveDatasource', name, connection);
  },
  
  /**
   * This event is fired just after the destruction of a #DSN.
   * @event removeDatasource
   * @param {String} name
   * The reference name of the new datasource.
   */
  onRemoveDatasource: function( name ) {
    this.fireEvent('removeDatasource',name);
  },
  
 /**
   * @event registerServer
   * Fired when a server is registered
   * @returns {NGN.core.Server/null}
   */
  onregisterServer: function(server){
  	this.emit('serverUnregistered',server||null);
  },
  
  /**
   * @event unregisterServer
   * Fired when a server is unregistered/removed
   * @returns {NGN.core.Server/null}
   */
  onUnregisterServer: function(server){
  	this.fireEvent('unregisterServer',server||null);
  },
  
  /**
   * @event ready
   * Fired when the application is ready.
   */
  onReady: function(){
  	console.info(this.name+' application is running.');
  	this.fireEvent('ready');
  },
  
  /**
   * @event disconnect
   * Fired when the process drops its connection to [NGN Mechanic](#!/guide/mechanic).
   */
  onDisconnect: function(){
    this.emit('disconnect');
  },
  
  /**
   * @event connect
   * Fired when the process establishes a connection to [NGN Mechanic](#!/guide/mechanic). 
   */
  onConnect: function(){
    this.emit('connect');
  },
  
  /**
   * @event connecting
   * Fired when the process is attempting to connect to [NGN Mechanic](#!/guide/mechanic). 
   */
  onConnecting: function(){
    this.emit('connecting');
  },
  
  /**
   * @event reconnect
   * Fired when the process re-establishes a connection to [NGN Mechanic](#!/guide/mechanic). 
   */
  onReconnect: function(){
    this.emit('reconnect');
  },
  
  /**
   * @event reconnecting
   * Fired when the process is attempting to reconnect to [NGN Mechanic](#!/guide/mechanic). 
   */
  onReconnecting: function(){
    this.emit('reconnecting');
  },
  
  /**
   * @event serverFault
   * Fired when [NGN Mechanic](#!/guide/mechanic) is unreachable and has never been reachable. 
   */
  onServerFault: function(){
    this.emit('serverFault');
  },
  
  /**
   * @event ready
   * Fired when [NGN Mechanic](#!/guide/mechanic) is ready for i/o.
   * This is fired after authentication/authorization.
   */
  onMechanicReady: function(){
    this.emit('ready');
    this.monitor();
  },
  
  /**
   * @event authFailure
   * Fired when the authentication data is rejected.
   * @param {String} reason
   */
  onMechanicAuthFailure: function(reason){
    this.emit('authFailure',reason.message||reason||'Unknown');
  },
  
  /**
   * @event authorizationDataSent
   * Fired when authorization data is sent to [NGN Mechanic](#!/guide/mechanic). 
   */
  
  /**
   * @event authorizationRequest
   * Fired when [NGN Mechanic](#!/guide/mechanic) requests identification. 
   */
  onMechanicAuthorizationRequest: function(){
    this.emit('authorizationRequest');
    process.mechanic.send('authorizationToken',process.mechanic.key||'');
  },
  
  /**
   * @event serverConfigurationRequest
   * Fired when [NGN Mechanic](#!/guide/mechanic) requests the
   * hardware details of the server on which the process is currently
   * running. 
   */
  onMechanicServerConfigurationRequest: function(){
    this.emit('serverConfigurationRequest');
    var msg = this.getHostDetails(),
        utl = this.getHostUtilization();

    for (var u in utl){
      msg[u] = utl[u];
    }

    this.remote = true;
    process.mechanic.send('serverConfigurationData',msg);
  },
  
  /**
   * @event identificationSent
   * Fired when the process sends identification data
   * to [NGN Mechanic](#!/guide/mechanic). This is
   * usually a response to the #identifiactionRequest event.
   */
  /**
   * @event identificationRequest
   * Fired when [NGN Mechanic](#!/guide/mechanic) requests 
   * the process identification information (i.e. registration).
   */
  onMechanicIdentificationRequest: function(){
    this.emit('identificationRequest');
    var me = this;
    process.mechanic.send('identification',this.getRegistrationData(),function(){
      me.emit('identificationSent');
    });
  },
  
  /**
   * @event adminAuthorizationSent
   * Fired when the administrative access token is
   * retrieved from the local system and sent to
   * [NGN Mechanic](#!/guide/mechanic).
   * This is a response to #adminAuthorizationRequest. 
   */
  /**
   * @event adminAuthorizationRequest
   * Fired when [NGN Mechanic](#!/guide/mechanic) identifies the
   * process as a #system process and requests more stringent
   * authorization. 
   */
  onMechanicAdminAuthorizationRequest: function(file){
    this.emit('adminAuthorizationRequest');
    var me = this;
    // Read the file and exchange the token
    fs.readFile(path.join(util.tempDir,file),'utf8',function(err,token){
      if (err){me.fireError(err);}
      process.mechanic.send('adminAuthorizationData',token.toString().trim());
      me.emit('adminAuthorizationSent');
    });
  },
  
  /**
   * @event authorized
   * Fired when [NGN Mechanic](#!/guide/mechanic) has authorized
   * the connection. 
   */
  onMechanicAuthorized: function(){
    this.emit('authorized');
  },
  
  /**
   * @event unauthorized
   * Fired when [NGN Mechanic](#!/guide/mechanic) responds 
   * to a request with an "unauthorized" code.
   */
  onMechanicUnauthorized: function(){
    this.emit('unauthorized');
  },
  
  /**
   * @event authorized
   * Fired when [NGN Mechanic](#!/guide/mechanic) has authorized
   * the connection. 
   */
  onMechanicAuthorized: function(){
    this.emit('authorized');
  },
  
  /**
   * @event adminAccessGranted
   * Fired when [NGN Mechanic](#!/guide/mechanic) grants
   * the process administrative privileges as a local system process.
   */
  onMechanicAdminAccessGranted: function(){
    this.emit('adminAccessGranted');
  },
  
  /**
   * @event adminAccessRejected
   * Fired when [NGN Mechanic](#!/guide/mechanic) grants
   * the process administrative privileges as a local system process.
   */
  onMechanicAdminAccessRejected: function(){
    this.emit('adminAccessGranted');
  },
  
  /**
   * @event heartbeatRequest
   * Fired when [NGN Mechanic](#!/guide/mechanic) requests a heart monitor.
   * In the event Mechanic cannot hear the heartbeat produced by this process,
   * it may request the heartbeat be started. By default, the process will
   * immediately begin sending a heartbeat to Mechanic.
   */
  onMechanicHeartbeatRequest: function(){
    this.emit('heartbeatRequest');
    this.monitor(true);
  },
  
  /**
   * @event presumeDeadConnection
   * Fired when [NGN Mechanic](#!/guide/mechanic) believes the connection to
   * this process is dead. This only happens when Mechanic requests a heartbeat
   * and does not receive one repeatedly. 
   */
  onMechanicPresumeDeadConnection: function(){
    this.emit('presumeDeadConnection');
  }
});

module.exports = Class;