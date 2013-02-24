/**
 * This class was inspired by nodejitsu's nssocket, and some code from this
 * module was used - though many changes have been made to support the NGN 
 * class structure. Several functional additions have been added, and the 
 * use of EventEmitter2 was stripped out of the class to reduce dependencies. 
 */
var Base = require('../NGN.core'),
    util = require('ngn-util'),
    nodeutil = require('util'),
    net = require('net'),
    tls = require('tls'),
    hasConnected = false,
    bufferjoiner = util.require('bufferjoiner',true);
/**
 * @class NGN.socket.Client
 * A generic TCP/TLS socket client. This is **not a web socket client**. It is designed
 * to be used with local and remote NGN.socket.Server objects. The following features are
 * available in this client:
 * 
 * - TCP 4/6 & TLS (secure) socket connections
 * - Smart reconnects upon disconnect.
 * 
 * **Basic Usage**
 * 
 *      var client = new NGN.socket.Client({
 *        port: 12345
 *      });
 *    
 *      client.on('connect',function(){
 *        console.log('Started.');
 *      });
 * 
 * @extends NGN.core
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new server.
	 * @params {Object|Function} config
	 * @params {Object} [rawsocket]
	 * The raw socket connction.
	 * The configuration can be an object, or just the #callback.
	 */
	constructor: function(config,rawsocket){
		
		config = config || {};

    if (config.hasOwnProperty('_socket') && rawsocket == undefined){
      config = {
        socket: config._socket
      }
    }
    		
		if (rawsocket !== undefined){
		  config.socket = rawsocket;
		}
		
		if (!(this instanceof Class)) {
		  var sock = config.socket;
		  delete config.socket;
      return new Class(config, sock);
    }
  
		Class.super.constructor.call(this, config);

    Object.defineProperties(this,{
      
      /**
       * @property {Boolean} [connected=false]
       * Indicates the client is connected.
       * @readonly 
       */
      connected: {
        enumerable: true,
        writable: true,
        value: false
      },
      
      /**
       * @property {Boolean} [connecting=false]
       * Indicates the client is attempting to connect to a server.
       * @readonly 
       */
      connecting: {
        enumerable: true,
        writable: true,
        value: false
      },
      
      /**
       * @cfg {String} [connectionType=tcp4]
       * The type of TCP connection to create. This can be `tcp4`, `tcp6`, or `tls`. 
       */
      connectionType: {
        enumerable: true,
        writable: true,
        value: config.type || 'tcp4'
      },
      
      /**
       * @property {Boolean} [waiting=false]
       * Indicates the client is waiting the specified #reconnectInterval before
       * attempting a #reconnect.
       * @readonly
       */
      
      /**
       * @cfg {Number} [port=55555]
       * The port number on which the socket server connection should be made.
       */
      port: {
        enumerable: true,
        writable: true,
        value: config.port || 55555
      },
      
      /**
       * @cfg {String} [host=localhost]
       * The host socket server. Can be an IP or domain name.
       */
      host: {
        enumerable: true,
        writable: true,
        value: config.host || 'localhost'
      },
      
      /**
       * @cfg {Boolean} [autoReconnect=true]
       * Reconnect when the connection to the server is lost or cannot be found. 
       */
      autoReconnect: {
        enumerable: true,
        writable: true,
        value: __NGN.coalesce(config.autoReconnect,true)
      },
      
      /**
       * @property {Number} [reconnectAttempts=0]
       * The number of times a reconnecting attempt has been made.
       * This is automatically reset to `0` when a connection is established.
       * @readonly
       */
      reconnectAttempts: {
        enumerable: true,
        writable: true,
        value: 0
      },
      
      /**
       * @property {Number} [totalReconnectAttempts=0]
       * The number of times a reconnection attempt has been made.
       * This is **not** reset to `0` when a connection is established.
       * It is a running tally of the total reconnection attempts since
       * the node script was launched. 
       * @readonly
       */
      totalReconnectAttempts: {
        enumerable: true,
        writable: true,
        value: 0
      },
      
      
      /**
       * @cfg {Number} [maxReconnectAttempts=0]
       * The maximum number of attempts to retry connecting to a server that does
       * not initially respond. Only used when #autoReconnect is `true`. This can be set
       * to `0` for indefinite reconnection attempts.
       */
      maxReconnectAttempts: {
        enumerable: true,
        writable: true,
        value: config.maxReconnectAttempts || 0 // 0 = indefinite
      },
      
      _originalReconnectInterval: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: config.reconnectInterval || 1
      },
      
      /**
       *@cfg {Number} [reconnectInterval=1]
       * The number of seconds to wait between reconnect attempts. In the case
       * of repeated failures, the reconnect time is adjusted according to the
       * #reconnectIntervalGrowthRate. This prevents an over-abundance of connection attempts
       * against an inaccessible server. Only used when #autoReconnect is `true`.  
       */
      reconnectInterval: {
        enumerable: true,
        writable: true,
        value: config.reconnectInterval || 1
      },
      
      /**
       * @cfg {Number} [maxReconnectWaitTime=30]
       * The maximum number of seconds to wait between reconnect attempts. This will
       * prevent #reconnectIntervalGrowthRate from increasing the interval too high.
       * Only used when #autoReconnect is `true`.
       */
      maxReconnectWaitTime: {
        enumerable: true,
        writable: true,
        value: config.maxReconnectWaitTime || 30
      },
      
      /**
       * @cfg {Number} [reconnectIntervalGrowthRate=.1]
       * The percentage of time to increase the #reconnectInterval on each failed
       * connection attempt. Only used when #autoReconnect is `true`.
       */
      reconnectIntervalGrowthRate: {
        enumerable: true,
        writable: true,
        value: config.reconnectIntervalGrowthRate || .1
      },
      
      timeoutId: {
        enumerable: false,
        writable: true,
        value: undefined
      },
      
      /**
       * @cfg {String} [eventDelimiter=' ']
       * The delimiter used in event namespacing. Ex: `scope::event`. 
       */
      eventDelimiter: {
        enumerable: true,
        writable: true,
        value: config.eventDelimiter || ' '
      },
      
      /**
       * @cfg {Number} [maxEventListeners=10]
       * The maximum number of event listeners on the socket before throwing a warning. 
       */
      maxEventListeners: {
        enumerable: true,
        writable: true,
        value: config.maxEventListeners || 10
      },
      
      /**
       * @property {net.Socket} socket
       * Contains the raw socket object.
       * @readonly
       */
      socket: {
        enumerable: true,
        writable: true,
        configurable: false,
        value: __NGN.coalesce(config.socket,false)
      },
      
      /**
       * @cfg {Boolean} [autoConnect=true]
       * Automatically connect to the server when the client is initialized. 
       */
      autoConnect: {
        enumerable: true,
        writable: true,
        value: __NGN.coalesce(config.autoConnect,true)
      },
      
      /**
       * @property {Boolean} initialized
       * Indicates the client has connected to the server at least once.
       * @readonly 
       */
      initialized: {
        enumerable: false,
        get: function(){
          return hasConnected;
        }
      }
    });
    
    //this.socket.data = this.ondata;
    
    this.reconnectIntervalGrowthRate = this.reconnectIntervalGrowthRate > 0 ? this.reconnectIntervalGrowthRate : .1;
    this.maxReconnectWaitTime = this.maxReconnectWaitTime > 0 ? this.maxReconnectWaitTime : 30;
    this.reconnectInterval = this.reconnectInterval > 0 ? this.reconnectInterval : 1;
    
    if (this.autoConnect){
      this.connect();
    }
		
	},
	
  /**
   * @method connect
   * Establish a connection to the #host on #port.
   * @param {Function} [callback]
   * An optional callback to run upon connection. 
   */
  connect: function(callback) {
    // Warn if the connection is already established or is in the process of connecting.
    if ((this.connected || this.connecting) && !this.timeoutId){
      this.fireWarning('The client is already '+(this.connected==true?'connected':'connecting')+' to the socket server.');
      return;
    }
    
    // Clear the reconnect process if it exists.
    this.timeoutId && clearTimeout(this.timeoutId);
    
    this.onConnecting();
    
    // Create a new socket if none exists, otherwise reconnect using the existing socket.
    if (!this.socket) {
      var me = this;
      this.stream = (this.connectionType === 'tls' ? tls : net).connect(this.port,this.host,callback||function(){});
      this.socket = this.stream instanceof net.Socket ? this.stream : this.stream.socket;
      this.connected = this.socket.writable && this.socket.readable || false;
  
      this.configureEvents();
    } else {
      var me = this,
          args = [this.port,this.host];
      
      try { 
        if (this.socket._events.connect.length < 2){
          args.push(function(){
            !me.connected && me.onStart();
            callback && callback();
          });
        }
      } catch(e) {}
      this.socket.connect.apply(this.socket,args);
    }
  },
  
  /**
   * @method reconnect
   * Attempt to reconnect to the server. 
   */
  reconnect: function() {
    var me = this;
    
    if (this.connected){
      this.fireWarning('Already connected.');
      clearTimeout(this.timeoutId);
      return;
    }

    this.timeoutId = setTimeout(function(){
  
      if (me.reconnectAttempts >= me.maxReconnectAttempts && me.maxReconnectAttempts > 0) {
        return me.fireError('Did not reconnect after maximum retries: ' + me.maxReconnectAttempts);
      }
      
      me.onReconnect();
      me.reconnectInterval = Math.min(me.maxReconnectWaitTime, me.reconnectInterval * (1+me.reconnectIntervalGrowthRate));
  
      me.connect();
    }, this.reconnectInterval*1000);
  },
  
  /**
   * @method configureEvents
   * An internal method to configure event listeners.
   * @private 
   */
  configureEvents: function() {
    // parsing holders
    var eventLength = -1,
        messageLength = -1,
        messagetype = 0,
        bufferJoiner = bufferjoiner(),
        me = this;

    if (this.connectionType === 'tls') {
      this.stream.on('secureConnect', function(){
        me.onStart();
      });
    } else {
      this.socket.on('connect', function(){
        me.onStart();
      });
    }
  
    this.stream.on('data', function onData(chunk) {
      ~messageLength
        ? fetchBody(chunk)
        : fetchHeader(chunk);
    });
    
    this.on('newListener',function(){
      me.emit('newCustomEvent',arguments[0],arguments);
    });
    
    function fetchHeader(chunk) {
      if (bufferJoiner.length + chunk.length >= 9) {
        var header = bufferJoiner.add(chunk).join();
        eventLength = header.readUInt32BE(0);
        messageLength = header.readUInt32BE(4);
        messagetype = header.readInt8(8);
        fetchBody(chunk.slice(9));
      } else {
        bufferJoiner.add(chunk);
      }
    }
  
    var fetchBody = function(chunk) {
      var raw, event, data;
      var chunkLength = chunk.length;
      var bytesLeft = (eventLength + messageLength) - bufferJoiner.length;
  
      if (chunkLength >= bytesLeft) {
        raw = bufferJoiner.add(chunk.slice(0, bytesLeft)).join();
        event = JSON.parse(raw.slice(0, eventLength));
        data = messagetype ? raw.slice(eventLength) : JSON.parse(raw.slice(eventLength).toString());
  
        eventLength = -1;
        messageLength = -1;
        
        var evt = event.join(me.eventDelimiter).trim();  

        try {
          if (me._emitter._events[evt] == undefined){
            me.on(evt,function(){});
          }
        } catch (e){console.log(e)}
        me.emit(evt, data);
          
  
        if (chunkLength - bytesLeft) {
          fetchHeader(chunk.slice(bytesLeft));
        }
  
        return;
      }
  
      bufferJoiner.add(chunk);
    }
  
    this.socket.on('close', function(hadError) {
      this.initialized && me.onClose(hadError,arguments[1]);
      !this.initialized && me.onServerFault();
      //me.destroy();
    });
  
    this.socket.on('error', function (err) {
      if (!me.autoReconnect){
        me.fireError(err || new Error('An Unknown Error occured'));
      } else if (err.code !== 'ECONNREFUSED'){
        me.fireError(err || new Error('An Unknown Error occured'));
      }
    });
  
    this.socket.on('timeout', this.onTimeout);
  },
  
  /**
   * @method send
   * Send an event/message to the socket server.
   * @param {Buffer} buff
   * The buffered content to write to the socket stream.
   * @private
   */
  write: function(buff) {
    if (!this.socket || !this.connected) {
      return this.fireError('No socket connection. Attempt to write to a closed socket has failed.');
    }
    this.stream.write(buff);
    return this;
  },
  
  /**
   * @method send
   * Send an event/message to the socket server.
   * @param {String|Array} event
   * An event or array of events to be emitted.
   * @param {Object|String} data
   * The content of the message.
   */
  send: function(event, data, callback) {
    if (!this.socket || !this.connected) {
      return this.fireError('No socket connection. Attempt to send to a closed socket has failed.');
    }
    
    var dataType = typeof data;
    if (dataType === 'undefined' || dataType === 'function') {
      callback = data;
      data = null;
    }
console.log('Sending',event,data);  
    this.stream.write(this.createMessage(event, data), callback);
    return this;
  },
  
  /**
   * @method createMessage
   * Creates a message and buffers the message so it can be transmitted completely
   * across the TCP/TLS socket.
   * @param {String|Array} event
   * An event or array of events to be emitted.
   * @param {Object|String} data
   * The content of the message.
   * @private  
   */
  createMessage: function(event, data) {
    var header = new Buffer(9);
  
    if (typeof event === 'string') {
      event = event.split(this.eventDelimiter);
    }
  
    event = Buffer(JSON.stringify(event));
  
    if (Buffer.isBuffer(data)) {
      header.writeInt8(1, 8);
    } else {
      data = Buffer(JSON.stringify(data));
      header.writeInt8(0, 8);
    }
  
    header.writeUInt32BE(event.length, 0);
    header.writeUInt32BE(data.length, 4);
  
    return Buffer.concat([header, event, data], 9 + event.length + data.length);
  },
  
  /**
   * @method destroy
   * Destroy the socket connection. 
   */
  destroy: function() {
    try {
      this.socket.end();
      for (var evt in this._emitter._events){
        if (['connect','reconnect','connecting'].indexOf(evt) < 0)
          delete this._emitter._events[evt];
      }
      //this.removeAllListeners();
      this.socket.destroy();
    } catch (err) {}
    
    this.onDestroy();
  },
  
  /**
   * @method end
   * End the socket connection. 
   */
  end: function() {
    var hadErr;
    this.connected = false;
  
    try {
      this.socket.end();
    } catch (err) {
      hadErr = true;
      this.fireError(err);
    }
  
    this.onClose(hadErr);
  },
  
  /**
   * @event connect
   * Fired when the connecting is established. 
   */
  onStart: function(){
    hasConnected = true;
    this.connected = true;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.reconnectInterval = this._originalReconnectInterval;
    this.waiting = false;
    this.emit('connect');
  },
  
  /**
   * @event reconnect
   * Fired when a reconnection is attempted. 
   */
  onReconnect: function(){
    this.waiting = true;
    this.connected = false;
    this.reconnectAttempts++;
    this.totalReconnectAttempts++;
    this.emit('reconnect',{currentAttempts:this.reconnectAttempts,totalAttempts:this.totalReconnectAttempts});
  },
  
  /**
   * @event timeout
   * Fired when a connection times out. 
   */
  onTimeout: function(){
    this.waiting = false;
    this.connected = false;
    this.emit('timeout');
  },
  
  /**
   * @event destroy
   * Fired when the client object is destroyed. 
   */
  onDestroy: function(){
    this.waiting = false;
    this.connected = false;
    this.connecting = false;
    this.socket = undefined;
    this.emit('destroy');
  },
  
  /**
   * @event connecting
   * Fired when an attempt is made to connect to the socket #host. 
   */
  onConnecting: function(){
    this.connecting = true;
    this.emit('connecting');
  },
  
  /**
   * @event disconnect
   * Fired when the connection to the socket #host is severed (or cannot be established). 
   */
  onClose: function(hadError){
    
    this.connected = false
    this.waiting = false;
    this.connecting = false;
    
    // Emit the proper event attributes
    if (hadError) {
      // Attempt to reconnect (if enabled)
      this.autoReconnect && this.reconnect();
    }
    
    this.emit('disconnect');
  },
  
  /**
   * @event serverFault
   * Fired when the server is unreachable and has never been reachable.
   */
  onServerFault: function(){
    
    this.connected = false
    this.waiting = false;
    this.connecting = false;

    this.emit('serverFault');
    this.autoReconnect && this.reconnect();
  }
		
});

module.exports = Class;
