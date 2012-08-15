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
			
			// Add a makeshift "all" method to the server
			this._server.all = function(route,method){
				me._server.get(route,method);
				me._server.put(route,method);
				me._server.post(route,method);
				me._server.del(route,method);
				me._server.head(route,method);
			};
			
			this._server.use(restify.acceptParser(this._server.acceptable));
			this.applyProcessor('preauthentication');
			this.applyProcessor('postauthentication');
			this.applyProcessor('preauthorization');
			this._server.use(restify.authorizationParser());
			this.applyProcessor('postauthorization');
			this._server.use(restify.dateParser());
			this._server.use(restify.queryParser());
			this._server.use(restify.bodyParser());
			
			this._server.use(function(req,res,next){
				if (req.body)
					req.body = typeof req.body == "string" ? JSON.parse(req.body) : req.body;
				next();
			});
			
			this.applyProcessor('prerequest');
			
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
			
			this.applyProcessor('postrequest');
			
			// End of request
			this._server.server.on('request',function(req,res){
				me.onRequestEnd(req,res);
			});
			
			this._serverOptions = options;
			
			this._server.listen(this.port,function(){
				
				me.on('start',function(){
					me.onReady();
				});

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
		
		// Catch All Route
		this._generateRoutes(function(rootExists){
			// Make sure routes are defined, otherwise generate a placeholder. 
			// This is a fallback if no root route is defined.
			if (!rootExists) {
				me._server.all('/',function(req,res){
					if (me.routes == null) {
						res.json({message:'The API server works, but no routes have been configured.'});
					} else {
						res.json({message:'The main route has not been configured.'});
					}
				});
			}
			
			// Catch All Route
			var all = /(.*)/;
			me._server.all(all,function(req,res){
				me.on404(res);
				res.send(404);
			});
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
	 * @event apiNotFound
	 * Fired when a route is not found.
	 * @param {Object} request
	 * @param {Object} response
	 */
	onNotFound: function(request, response){
		this.emit('apiNotFound',{request:request||null,response:response||null});
	},
	
	/**
	 * @event apiMethodNotAllowed
	 * Fired when a method is not allowed.
	 * @param {Object} request
	 * @param {Object} response 
	 */
	onMethodNotAllowed: function(request, response){
		this.emit('apiMethodNotAllowed',{request:request||null,response:response||null})
	},
	
	/**
	 * @event apiVersionNotAllowed
	 * Fired when a version is request is rejected.
	 * @param {Object} request
	 * @param {Object} response 
	 */
	onVersionNotAllowed: function(request, response){
		this.emit('apiVersionNotAllowed',{request:request||null,response:response||null})
	},
	
	/**
	 * @event apiAfter
	 * Fired after a request is complete.
	 * @param {Object} request
	 * @param {Object} response 
	 */
	onafter: function(request, response, route){
		this.emit('apiAfter',{request:request||null,response:response||null,route:route||null});
	},
	
	/**
	 * @event uncaughtException
	 * Fired when a version is request is rejected.
	 * @param {Object} request
	 * @param {Object} response 
	 */
	onuncaughtException: function(request, response, route, error){
		var eyes = require('eyes');
		eyes.inspect(error);
		//this.onafter(request||null,response||null,route||null);
		//this.fireError(error);
	}
});



// Create a module out of this.
module.exports = Class;
