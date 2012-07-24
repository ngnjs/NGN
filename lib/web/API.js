var fs			= require('fs'),
	restify		= require('restify'),
	Base		= require('../core/HttpServer');

/**
 * @class NGN.web.API
 * Provides a HTTP server **without** support for views and templating. This is based on
 * [restify](http://mcavage.github.com/node-restify/), which ignores templating in favor of
 * performance. This is designed to be used for creating data API's.
 * 
 * @docauthor Corey Butler
 * @extends NGN.core.HttpServer
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a REST Server.
	 */
	constructor: function(config){
		
		config = config || {};
		config.purpose = 'API';
		
		Class.super.constructor.call( this, config );
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [name=NGN]
			 * The name of the API.
			 */
			name: {
				value:		config.name || 'NGN',
				enumerable:	true,
				writable:	true
			},
			
			/*
			 * @cfg {String/Array} routes (required)
			 * Path to directory where routes are stored. Also accepts an 
			 * array of file paths. Routes are created by recursively
			 * processing each specified directory and importing each `.js` file
			 * it finds. 
			 */
			/*routes: {
				value:		config.routes || null,
				enumerable:	true,
				writable:	true
			},*/
			
			_ssl: {
				value:		config.ssl || null,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {Number} [port=80|443]
			 * The port on which the web server will listen. Each web server must
			 * listen on a unique port. If no port is defined, the default port `80`
			 * will be used. If #ssl is supplied, the port will be set to `443` by default. 
			 */
			port: {
				value:		config.port || (this.ssl == null ? 80 : 443),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [autoStart=true]
			 * Automatically start the server. If this is set to `false`, the
			 * server will need to be running explicitly using the #start method.
			 */
			autoStart: {
				value:		config.autoStart || true,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @property {Boolean}
			 * Indicates the server is running.
			 * @readonly
			 */
			running: {
				value:		false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [defaultVersion=1.0.0]
			 * The version of the API to use when a request doesn't explicitly state which 
			 * version of the API it needs to use.
			 * 
			 * Though not required, common practice is to conform to [semver](http://semver.org/) version numbering.
			 */
			defaultVersion: {
				value:		config.defaultVersion || '1.0.0',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [responseTimeHeader=X-Response-Time]
			 * The header used to indicate response time.
			 * 
			 * A common alternative is 'X-Runtime', but any custom name can be used.
			 */
			responseTimeHeader: {
				value:		config.resposeTimeHeader || 'X-Response-Time',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Function} [responseTimeFormatter=null]
			 * Allows you to apply formatting to the value of the header. The duration is passed as an argument in number of milliseconds to execute.
			 * 
			 * For example:
			 * 		var API = new NGN.web.Api({
			 * 			responseTimeFormatter: function(durationInMilliseconds) {
			 * 		    	return durationInMilliseconds / 1000;
			 * 			}
			 * 		});
			 */
			responseTimeFormatter: {
				value:		config.responseTimeFormatter || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Object} [formatters=null]
			 * Custom response formatters for `res.send()`.
			 */
			formatters: {
				value:		config.formatters || null,
				enumerable:	true,
				writable:	true
			}
		});
		
		// Redefine ssl since the attribute names vary slightly for restify.
		delete this.ssl;
		Object.defineProperty(this,'ssl',{
				enumerable:	false,
				get:		function(){
								if (this._ssl == null)
									return null;
									
								var obj = this._ssl;
								if (obj.certificate !== undefined){
									obj.cert = obj.certificate;
									delete obj.certificate; 
								}
								return obj;
							},
				set:		function(obj) {
								if (obj == null){
									this._ssl = null;
									return;
								}
								if (obj.certificate == undefined){
									obj.certificate = obj.cert;
									delete obj.cert;
								}
								this._ssl = obj;
							}
			});
		
		var me = this;
		
		if (this.autoStart)
			this.start();
	},
	
	/**
	 * @method
	 * @param {Error} err
	 * The error thrown.
	 * @param {Object} req
	 * The request object.
	 * @param {Object} res
	 * The response object.
	 * @param {Function} next
	 * The next method indicating completion of function processing.
	 */
	errorHandler: function(err, req, res, next){
		res.send(500, {message:err.message || 'Unknown Error'});
		this.onError(err);
	},
	
	/**
	 * @method
	 * Start listening for requests.
	 */
	start: function(){
		if (!this.running) {
			var me 		= this,
				options = this._ssl == null ? {} : this._ssl;
				
			options.name = this.name;
			options.version = this.defaultVersion;
			options.responseTimeHeader = this.responseTimeHeader;
			
			if (this.responseTimeFormatter !== null)
				options.responseTimeFormatter = this.responseFormatter;
			
			if (this.formatters !== null)
				options.formatters = this.formatters;
				
			//TODO: Support logging with Bunyan/Loggers
			
			this._server = restify.createServer(options);
			
			var _evt = [
				'NotFound',
				'MethodNotAllowed',
				'VersionNotAllowed',
				'after',
				'uncaughtException'
			];
			
			for (var e=0;e<_evt.length;e++)
				this._server.on(_evt[e],this['on'+_evt[e]]);
			
			this.generateRoutes();
			
			this._server.listen(this.port,function(){
				me.onStart();
			});
		}
	},
	
	/**
	 * @method
	 * Stop the server.
	 */
	stop: function(){
		if (this.running) {
			this._server.close();
			this.onStop();
		}
	},	
	
	/**
	 * @method
	 * Generates server routes. If no #routes are configured, a generic
	 * route will be created.
	 * @private 
	 */
	generateRoutes: function() {

		var me = this;
		this._generateRoutes(function(rootExists){
			// Make sure routes are defined, otherwise generate a placeholder. 
			// This is a fallback if no root route is defined.
			if (!rootExists) {
				me._server.get('/',function(req,res){
					if (me.routes == null) {
						res.json({message:'The API server works, but no routes have been configured.'});
					} else {
						res.json({message:'The main route has not been configured.'});
					}
				});
			}
		});
	
	},
	
	/**
	 * @event send
	 * Fired when a response is sent to the client.
	 * @returns {Object} responseStream
	 */
	onSend: function(){
		this.emit('send',this._server.response);
	},
	
	/**
	 * @event xxx
	 * Fired on every HTTP response.
	 */
	onXXX: function(code){
		this.emit('xxx',{code:code,response:null});
		this.onSend();
	},
	
	/**
	 * @event NotFound
	 * Fired when a route is not found.
	 * @param {Object} request
	 * @param {Object} response
	 */
	onNotFound: function(request, response){
		this.emit('NotFound',{request:request||null,response:response||null});
	},
	
	/**
	 * @event MethodNotAllowed
	 * Fired when a method is not allowed.
	 * @param {Object} request
	 * @param {Object} response 
	 */
	onMethodNotAllowed: function(request, response){
		this.emit('MethodNotAllowed',{request:request||null,response:response||null})
	},
	
	/**
	 * @event VersionNotAllowed
	 * Fired when a version is request is rejected.
	 * @param {Object} request
	 * @param {Object} response 
	 */
	onVersionNotAllowed: function(request, response){
		this.emit('VersionNotAllowed',{request:request||null,response:response||null})
	},
	
	/**
	 * @event after
	 * Fired after a request is complete.
	 * @param {Object} request
	 * @param {Object} response 
	 */
	onafter: function(request, response, route){
		this.emit('after',{request:request||null,response:response||null,route:route||null});
	},
	
	/**
	 * @event uncaughtException
	 * Fired when a version is request is rejected.
	 * @param {Object} request
	 * @param {Object} response 
	 */
	onuncaughtException: function(request, response, route, error){
		this.emit('after',{request:request||null,response:response||null,route:route||null,error:error||null});
		this.fireError(error);
	}
});



// Create a module out of this.
module.exports = Class;
