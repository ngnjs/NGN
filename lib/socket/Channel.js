/**
 * This class was inspired by nodejitsu's nssocket, and some code from this
 * module was used - though many changes have been made to support the NGN 
 * class structure. Several functional additions have been added, and the 
 * use of EventEmitter2 was stripped out of the class to reduce dependencies. 
 */
var util = require('ngn-util'),
    nodeutil = require('util'),
    net = require('net'),
    bufferjoiner = util.require('bufferjoiner',true),
    eventLength = -1,
    messageLength = -1,
    messagetype = 0,
    bufferJoiner = bufferjoiner(),
    Base = require('../NGN.core');

/**
 * @class NGN.socket.Channel
 * An upgraded TCP/TLS socket. This is **not a web socket!** It is designed
 * to be used with local and remote NGN.socket.Server and NGN.socket.Client objects. 
 * The following features are available in this socket:
 * 
 * - TCP 4/6 & TLS (secure) socket options
 * - Buffered event data.
 * - JSON Support.
 * 
 * @extends NGN.core
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * @param {Object} [config=null]
	 * Optionally provide a configuration.
	 * @param {Object} [socket]
	 * Optionally pass a socket to be upgraded.
	 * @required
   * include `tcp4`, `tcp6`, and `tls` (secure). 
	 */
	constructor: function(config,socket){
    
    if (config instanceof net.Socket){
      socket = config;
      config = {};
    }
    
    config = config || {};
    
		Class.super.constructor.call(this, config);

    Object.defineProperties(this,{
      
      /**
       * @cfg {String} [connectionType=tcp4]
       * The type of TCP connection to create. This can be `tcp4`, `tcp6`, or `tls`. 
       */
      connectionType: {
        enumerable: true,
        writable: true,
        value: config.connectionType || 'tcp4'
      },
      
      /**
       * @cfg {String} [eventDelimiter='::']
       * The delimiter used in event namespacing. Ex: `scope::event`. 
       */
      eventDelimiter: {
        enumerable: true,
        writable: true,
        value: config.eventDelimiter || '::'
      },
      
      socket: {
        enumerable: false,
        writable: true,
        value: socket
      }
      
    });
    
    this.socket.setNoDelay();
    this.configureEvents();
	},
	
	fetchHeader: function(chunk) {
    if (bufferJoiner.length + chunk.length >= 9) {
      var header = bufferJoiner.add(chunk).join();
      eventLength = header.readUInt32BE(0);
      messageLength = header.readUInt32BE(4);
      messagetype = header.readInt8(8);
      this.fetchBody(chunk.slice(9));
    } else {
      bufferJoiner.add(chunk);
    }
  },
  
  fetchBody: function(chunk) {
    var raw, event, data;
    var chunkLength = chunk.length;
    var bytesLeft = (eventLength + messageLength) - bufferJoiner.length;

    if (chunkLength >= bytesLeft) {
      raw = bufferJoiner.add(chunk.slice(0, bytesLeft)).join();
      event = JSON.parse(raw.slice(0, eventLength));
      data = messagetype ? raw.slice(eventLength) : JSON.parse(raw.slice(eventLength).toString());

      eventLength = -1;
      messageLength = -1;
      
      var evt = event.join(this.eventDelimiter).trim();  

      try {
        if (this._emitter._events[evt] == undefined){
          this.on(evt,function(){});
        }
      } catch (e){console.log(e)}
      this.emit(evt, data);

      if (chunkLength - bytesLeft) {
        this.fetchHeader(chunk.slice(bytesLeft));
      }

      return;
    }

    bufferJoiner.add(chunk);
  },
	
  /**
   * @method configureEvents
   * An internal method to configure event listeners.
   * @private 
   */
  configureEvents: function() {
    // parsing holders
    var me = this;

    this.socket.on('data', function(chunk) {
      ~messageLength
        ? me.fetchBody(chunk)
        : me.fetchHeader(chunk);
    });
  
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
    
    /*if (!this.socket.connected){
      this.fireWarning('Cannot send "'+event+'" event. The socket is not connected.');
      return;
    }*/
    
    var dataType = typeof data;
    if (dataType === 'undefined' || dataType === 'function') {
      callback = data;
      data = null;
    }

    this.socket.write(this.createMessage(event, data), callback);
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
   * @method ondata
   * Turn on event listener for specified data event.
   * @param {String} event
   * Event name
   * @param {Function} listener
   * The callback method to run upon completion.
   */
  ondata: function(event, listener) {
    if (typeof event === 'string') {
      event = event.split(this.eventDelimiter);
    }
    return this.socket.on(['data'].concat(event), listener);
  },
  
  /**
   * @method offdata
   * Turn off event listener for specified data event.
   * @param {String} event
   * Event name
   * @param {Function} listener
   * The callback method to run upon completion.
   */
  offdata: function(event, listener) {
    return this.socket.off(['data'].concat(event), listener);
  },
  
  /**
   * @method oncedata
   * Emit data once and only once.
   * @param {String} event
   * Event name
   * @param {Function} listener
   * The callback method to run when data is received.
   * @private 
   */
  oncedata: function(event, listener) {
    if (typeof event === 'string') {
      event = event.split(this.eventDelimiter);
    }
    return this.socket.once(['data'].concat(event), listener);
  }
  
});

module.exports = Class;
