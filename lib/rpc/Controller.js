var Base = require('../core/Server'); //TODO: Extend a process instead 

/**
 * @class NGN.rpc.Controller
 * The RPC API Controller creates a process that exposes functions to other
 * system interfaces. This class encapsulates application logic in a manner 
 * that can be reused by both local and remote NGN processes. For example, 
 * a REST interface and an XMPP chat interface can both use the same 
 * underlying logic by making remote procedure calls to the same Controller.
 * @docauthor Corey Butler
 * @extends NGN.core.HttpServer
 */
var Class = Base.extend({
  
  /**
   * @constructor
   * Create a HTTP/S server.
   */
  constructor: function(config){
    
    var me = this;
    
    config = config || {};
    config.type = 'TCP';
    config.purpose = 'RPC';

    Class.super.constructor.call( this, config );
    
    /*Object.defineProperties(this,{
      
      
    });*/
    
    var me   = this;
    
    this.on('start',function(){
      me.onReady();
    });
    
    if (this.autoStart)
      this.start();
  },
  
  /**
   * @method
   * Start listening for requests.
   */
  start: function(){
    this.starting = true;
    
    if (!this.running) {
    
      try {
        
        var me  = this;
        
        //this._server.listen(this.port,function(){
        //  me.onStart();
        //});
        
      } catch (e) {
        this.starting = false;
        this.onError(e);
      }
    } else {
      console.log('WARNING: '.yellow.bold+'Server already started. Cannot start twice. Make sure autoStart=true and start() are not being executed sequentially.');
    }
  },
  
  /**
   * @method
   * Stop the server.
   */
  stop: function(){
    if (this.running) {
      //this._server.close();
      this.onStop();
    }
  },
  
  /**
   * @event send
   * Fired when a response is sent to the client.
   * @returns {Object} responseStream
   */
  onSend: function(){
    this.emit('send',this._server.response);
  }
  
});



// Create a module out of this.
module.exports = Class;