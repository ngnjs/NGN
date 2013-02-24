var Base = require('../core/Server'),
    net = require('net'),
    tls = require('tls'),
    options = {};

/**
 * @class NGN.socket.Server
 * A generic TCP/TLS socket server. This is **not a web socket server**.
 * 
 * The socket server provides the following additional features:
 * 
 * - TCP4, TCP6, & TLS (Secure) sockets
 * - Events to customize server logic.
 * 
 * **Basic Usage**
 * 
 *      var server = new NGN.socket.Server(function(socket){
 *        socket.on('connection',function(){
 *          console.log('CONNECTION ESTABLISHED');
 *        });
 *       
 *        socket.data(['some','event'],function(data){
 *          console.log(data);
 *        });
 *        
 *        socket.on('close',function(data){
 *          console.log('CONNECTION DROPPED');
 *        });
 *      });
 * 
 * **Custom Usage**
 * 
 *      var server = new NGN.socket.Server({
 *        type: 'tls',
 *        callback: function(socket){
 *         socket.on('connection',function(){
 *            console.log('CONNECTION ESTABLISHED');
 *         });
 *       
 *          socket.data(['some','event'],function(data){
 *            console.log(data);
 *          });
 *        
 *          socket.on('close',function(data){
 *            console.log('CONNECTION DROPPED');
 *         });
 *        }
 *      });
 * 
 * @extends NGN.core.Server
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new server.
	 * @params {Object} config
	 * The configuration can be an object, or just the #callback.
	 */
	constructor: function(config){
		
		var me = this;
		
		config = config || {};
		
		config.type = 'Socket';
		config.purpose = config.purpose || 'Process Communication';
				
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
			
			_server: {
			  enumerable: false,
			  writable: true,
			  configurable: false,
			  value: null
			}
		});
		
    this._server = this.connectionType == 'tls' 
      ? tls.createServer(this)
      : net.createServer(this);  
		
		this._server.on('connection',function(client){
		  client = client instanceof __NGN.socket.Channel == true ? client : new __NGN.socket.Channel(client);
		  me.onConnection(client);
		});
		
		if (this.autoStart){
		  this.start();
		}
	},
	
  /**
   * @method start
   * Start the socket server. 
   */
  start: function(callback){
    if (this._server == null){
      this.fireError('The socket server is not initialized.');
      return;
    }
    
    if (this.starting || this.running){
      this.fireWarning('Socket server is already '+(this.starting==true?'starting':'running')+'.');
      return;
    }
    
    this.onStart();
    
    var me = this;
    this._server.listen(this.port,function(){
      me.onReady();
      callback && callback();
    });
  },
  
  /**
   * @method stop
   * Stops the socket server (close). 
   */
  stop: function(){
    var me = this;
    this._server.close(function(){
      me.onStop();
    })
  },
  
  /**
   * @event connection
   * Fired when a new client connection is detected.
   * @param {NGN.socket.Channel} 
   */
	onConnection: function(channel){
    this.emit('connection',channel);
	},
	
	/**
	 * @event data
	 * Fired when the server receives an event from a client.
	 * @param {Object} [data]
	 */
	onData: function(data){
	  console.log(data);
	  console.log('Did I hear a whisper?'.cyan);
	}
});

module.exports = Class;
