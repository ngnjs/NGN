var Core = require('../NGN.core');

/**
 * @class NGN.core.Server
 * A generic utility class representing a server in the application.
 * This class typically isn't invoked directly. It is designed as a base class
 * for different server types like NGN.web.Server, NGN.web.ApiServer, etc.
 * @extends NGN.core
 * @private
 */
var Class = Core.extend({
	
	/**
	 * @constructor
	 * Create a new server.
	 * @params {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
	
		Class.super.constructor.call(this, config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String}
			 * The type of server. For example, `HTTP`, `DNS`, `FTP`, etc.
			 */
			type: {
				value:		config.type || 'UNKNOWN',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The purpose of the server. Typical values include:
			 * 
			 * * WWW
			 * * REST
			 * * API
			 * * DATA
			 * 
			 * Any value will work for this. This attribute acts as a "tag"
			 * to identify groups of servers that may serve similar purposes.
			 */
			purpose: {
				value:		config.purpose || 'UNKNOWN',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The name of the server. This can be referenced via NGN.app.Application (if used) or NGN#getServer.
			 */
			id: {
				value:		config.id || __NGN.uuid().replace(/\-/gi,''),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Number}
			 * The port on which the server will listen/connect.
			 */
			port: {
				value:		config.port || null,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @property {Boolean} [running=false]
			 * Indicates the server is currently running.
			 * @readonly
			 */
			running: {
				value:		false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean}
			 * Automatically register a helper reference to the server (available via NGN#getServer or NGN#getServers). 
			 */
			autoRegister: {
				value:		__NGN.coalesce(config.autoRegister,true),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [autoStart=true]
			 * Automatically start the server. If this is set to `false`, the
			 * server will need to be running explicitly using the #start method.
			 */
			autoStart: {
				value:		__NGN.coalesce(config.autoStart,true),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {NGN.util.Logger}
			 * Specify a logging utility to log server activity.
			 */
			syslog: {
				value:		config.logger || null,
				enumerable:	false,
				configurable:true
			},
			
			/**
			 * @property {Boolean}
			 * Indicates whether the server is in the process of starting.
			 */
			starting: {
				value:		false,
				enumerable:	true,
				writable:	true,
				configurable:true
			}
			
		});
		
		// Create a generic empty logger to prevent code from breaking.
		if (this.syslog == null){
			this.syslog == {
				disabled: true,
				info: __NGN.emptyFn,
				warn: __NGN.emptyFn,
				debug: __NGN.emptyFn,
				error: __NGN.emptyFn
			};
		}
		
		if (this.autoRegister)
			this.register();
		
	},
	
	/**
	 * @method
	 * Registers the server within the application scope by creating a pointer to it.
	 */
	register: function(){
		this.id = __NGN.registerServer(this);
	},
	
	start: function(){
		this.onStart();
	},
	
	stop: function(){
		this.onStop();
	},
	
	/**
	 * @event start
	 * Fired when the web server starts.
	 */
	onStart: function(){
		if (!this.running && this.starting) {
			this.running = true;
			this.fireEvent('start',this);
		}
	},
	
	/**
	 * @event stop
	 * Fired when the server stops.
	 */
	onStop: function(){
		if (this.running) {
			this.running = false;
			this.starting= false;
			this.fireEvent('stop',this);
		}
	}
	
});

module.exports = Class;