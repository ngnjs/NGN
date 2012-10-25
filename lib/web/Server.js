var express		= require('express'),
	tpl			= require('consolidate'),
	Base		= require('../core/HttpServer'),
	fs			= require('fs'),
	passport	= null;

/**
 * @class NGN.web.Server
 * Provides a standard HTTP server interface for serving web content.  
 * 
 * For a detailed review of how to use the web server, please see the [Web Server Fundamentals Guide](#!/guides/webserver).
 * 
 * An example of a common web server.
 * 
 * 		var server = new NGN.web.Server({
 * 			assets: '/path/to/static/file/dir',
 * 			views: '/path/to/templates',
 * 			viewEngine: 'jade',
 * 			routes: '/path/to/routes'
 * 		});
 * 		
 * Creating a HTTP**S** web server.
 * 
 * 		var server = new NGN.web.Server({
 * 			routes: '/path/to/routes',
 * 			ssl: {
 * 				cert:	'/path/to/cert.pem',
 * 				key:	'/path/to/key.pem'
 * 			}
 * 		});
 * 
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
		config.purpose = 'WWW';
		require('colors');

		Class.super.constructor.call( this, config );
		
		Object.defineProperties(this,{
			
			/*
			 * @cfg {String} [ref=null]
			 * The name of a global reference that should be created
			 * as a pointer to this web server.
			 */
			
			/**
			 * @cfg {String}
			 * Path to directory where static assets are stored. 
			 */
			assets: {
				value:		config.assets || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Number} [maxAssetAge=31557600000]
			 * The maximum age of an specific asset in seconds. 
			 * 
			 * * 1 Year: 31557600000
			 */
			maxAssetAge: {
				value:		config.maxAssetAge || 31557600000,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * Path to directory where view templates are stored.
			 */
			views: {
				value:		config.views || null,
				enumerable:	true,
				writable:	true
			},
			
			
			/**
			 * @cfg {String}
			 * The template engine to use for rendering #views.
			 * NGN web servers use the (consolidate renderers)[https://github.com/visionmedia/consolidate.js#supported-template-engines]
			 * for rendering dynamic content.
			 */
			viewEngine: {
				value:		config.viewEngine || 'ejs',
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {Object}
			 * An optional feature to support different #viewEngine renderers for 
			 * different kinds of pages.
			 * 
			 * For example:
			 * 		{
			 * 			html: 'jade',
			 * 			css: 'stylus'
			 * 		}
			 * The configuration shown above would use the `jade` templating engine
			 * any time it needs to render a file with a `.html` extension, but it will
			 * use the `stylus` engine when rendering and file with a `.css` extension.
			 * 
			 * Setting a template engine map will override any engine specified in #viewEngine.
			 */
			viewEngines: {
				value:		config.viewEngines || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [poweredBy=NGN]
			 * Sets the `x-powered-by` header value.
			 */
			poweredBy: {
				value:		config.poweredBy || 'NGN v'+__NGN.version,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [customErrors=null]
			 * A directory path where the server should look for custom error templates.
			 * This is not necessary if the value of #views contains
			 * the custom error templates. 
			 */
			customErrors: {
				value:		config.customErrors || null,
				enumerable:	true,
				writable:	true
			},
			
			/*
			 * @cfg {Boolean} [cacheAllViews=true]
			 * Enables caching if the #templateEngine supports it. If the engine
			 * does not support caching, it will likely be ignored.
			 */
			/*cacheAllViews: {
				value:		config.cacheAllViews || true,
				enumerable:	true,
				writable:	true
			},*/
			
			/**
			 * @cfg {Object/String}
			 * Sessions can be stored in memory or persisted in a NGN.datasource.Connection.
			 * 
			 * The following datasources can be used for session storage:
			 * 
			 * * `memory` (commonly not used in production)
			 * * NGN.datasource.Redis
			 * 
			 * _For robust shared session storage in production environments, memory should not be used._
			 */
			sessionStorage: {
				value:		config.sessionStorage || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Number} [sessionTimeout=-1]
			 * The number of seconds before the session times out.
			 * 
			 * * Never: -1 
			 * * 5 minutes: 300
			 * * 30 minutes: 1800
			 * * 30 minutes: 3600
			 * * 1 day: 86400
			 * * 1 week: 604800
			 * * 30 days: 25952000
			 */
			sessionTimeout: {
				value:		config.sessionTimeout || -1,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * An optional session secret to use for encrypting sessions. If
			 * no value is specified, a random UUID is generated.
			 */
			sessionSecret: {
				value:		config.sessionSecret || __NGN.uuid(),
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [preventCsrf=true]
			 * Enable CSRF protection.
			 */
			preventCsrf: {
				value:		__NGN.coalesce(config.preventCsrf,true),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [enableStaticCache=true]
			 * This value is ignored if there is no static content.
			 */
			enableStaticCache: {
				value:		__NGN.coalesce(config.enableStaticCache,true),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [disableBodyParsing=false]
			 * When set to true, the request body will not be parsed.
			 * If #preventCsrf is enabled, this option is automatically forced to
			 * `true` since body parsing is required for Anti-CSRF protection.
			 */
			disableBodyParsing: {
				value:		__NGN.coalesce(config.disableBodyParsing,false),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @property {Object}
			 * Holds the custom headers to be sent on every request.
			 * @private
			 */
			_customHeaders: {
				value:		null,
				enumerable:	false,
				writable:	true
			}

		});
		
		this._server = express();
	
	//	this._server.use(express.logger());
	
		if (!this.disableBodyParsing || this.preventCsrf)
			this._server.use(express.bodyParser());
		
		this._server.use(express.methodOverride());
		
		this.on('start',function(){
			me.onReady();
		});
		
		if (this.autoStart)
			this.start();
	},
	
	/**
	 * @method
	 * Add a header to each request. This can also be used to overwrite an existing header.
	 * 
	 * **Example**
	 * 		web.setHeader('x-custom-header','value');
	 * @param {String} headerName
	 * The name of the header
	 * @param {String} headerValue
	 * The value assigned to the header.
	 */
	addHeader: function(headerName,headerValue){
		this._customHeaders[headerName] = headerValue;
	},
	
	/**
	 * @method
	 * Edit an existing header.
	 * @param {String} headerName
	 * The name of the header
	 * @param {String} headerValue
	 * The value assigned to the header.
	 */
	setHeader: function(headerName,headerValue){
		this.addHeader(headerName,headerValue);
	},
	
	/**
	 * @method
	 * Remove a header.
	 * @param {String} headerName
	 * The name of the header
	 */
	removeHeader: function(headerName){
		delete this._customHeaders[headerName];
	},
	
	/**
	 * @method
	 * Set multiple headers by providing a key/value object. Applied to every request.
	 * This overwrites any existing _custom_ headers.
	 *  
	 * **Example**
	 * 		web.setHeaders({
	 * 			'x-custom-header','value',
	 * 			'x-custom-header2','value2'
	 * 		});
	 * @param {Object} headers
	 * A key/value object with headers and their values.
	 */
	setHeaders: function(headers){
		this._customHeaders = headers;
	},
	
	/**
	 * @method
	 * The method for applying Cross Origin Policy across the entire server.
	 * 
	 * This method typically does not need to be overridden or used directly.
	 * This method is enabled when #allowCrossOrigin is enabled.
	 * @param {Object} req
	 * Request stream.
	 * @param {Object} res
	 * Response stream.
	 * @param {Function} next
	 * Processing method.
	 */
	handleCrossOrigin: function(req, res, next) {
	    res.header('Access-Control-Allow-Origin', this._ALLOWCORS);
	    if ( req.method == 'OPTIONS')
	      	res.send(200);
	    else
		   	next();
	},
	
	/**
	 * @method
	 * The method for restricting traffic to specific HTTP methods, such as `GET`, `POST`, `PUT`, `DELETE`, `HEAD`, and `OPTIONS`.
	 * @param {Object} req
	 * Request stream.
	 * @param {Object} res
	 * Response stream.
	 * @param {Function} next
	 * Processing method.
	 */
	handleMethods: function(req, res, next) {
	    res.header('Access-Control-Allow-Methods', this._ALLOWMETHODS);
	    if ( req.method == 'OPTIONS')
	      	res.send(200);
	    else
		   	next();
	},
	
	/**
	 * @method
	 * Error handler.
	 * @param {Error} err
	 * The error thrown.
	 * @param {Object} req
	 * The request object.
	 * @param {Object} res
	 * The response object.
	 * @param {Function} next
	 * The next method indicating completion of function processing.
	 */
	handleError: function(err, req, res, next){
		try {
			// Respond with html page
			var s = err.status || 500;
			if (req.accepts('html')) {
				res.status(s);
			  	this.renderIfExists(res, s, s.toString(), { url: req.url });
			  	return;
			}
			
			// respond with json
			if (req.accepts('json')) {
			  res.send(s,{ error: 'Not found' });
			  return;
			}
		} catch (e) {	
			// default to plain-text. send()
			res.type('txt').send('Not found');
		}
	},
	
	/**
	 * @method
	 * Start listening for requests.
	 * @private
	 */
	start: function(){
		this.starting = true;
		
		if (!this.running) {
		
			try {
				
				var me 	= this;
				
				// PreAuthenticate Middleware
				this.applyProcessor('preauthentication');
				
				if (!this.disableBasicAuth && this.basicAuthUsers !== null)
					this._server.use(express.basicAuth(this.testBasicAuth))
				
				this._server.use(this.authenticate);
				
				// PostAuthenticate Middleware
				this.applyProcessor('postauthentication');
				
				// PreAuthorize Middleware
				this.applyProcessor('preauthorization');
				this._server.use(this.authorize);
				
				// PostAuthorize Middleware
				this.applyProcessor('postauthorization');
				
				// PreRequest Middleware
				this.applyProcessor('prerequest');
				
				// Add custom headers
				if (this.poweredBy || this._customHeaders) {
					
					var _hdrFn = function(req,res,next){
									res.set('x-powered-by',me.poweredBy);
									if (me._customHeaders) {
										for(var hdr in me._customHeaders)
											res.set(hdr,me._customHeaders[hdr]);
									}
									next();
								};
					
					this._server.use(_hdrFn);
				}
				
				// PostRequest Middleware
				express.request.on('end',function(req,res,next){
					me.onRequestEnd(req,res);
				});
	
				// Handle Global Cross Origin			
				if (this._ALLOWCORS !== null)
					this._server.use(this.handleCrossOrigin);
					
				if (this._ALLOWMETHODS !== null)
					this._server.use(this.handleMethods);
			
				this.enableSessionManagement();
				this.enableTemplateRendering();
				
				this.generateRoutes();
				
				if (this.assets !== null) {
					if (!fs.existsSync(this.assets && fs.existsSync(__NGN.path.join(__NGN.rootDir,this.assets))))
						this.assets = __NGN.path.join(__NGN.rootDir,this.assets);
					if (this.enableStaticCache)
						this._server.use(express.staticCache());
					var opts = this.maxAssetAge == null ? null : {maxAge:this.maxAssetAge};
					this._server.use(express.static(this.assets,opts));
				}
				
				this.applyProcessor('postrequest');
				
				if (this.enableCompression)
					this._server.use(express.compress());
	
				this._server.use(this.handleError);
	
				if (this._serverOptions !== null) 
					this._httpServer = require('https').createServer(this._serverOptions,this._server);
				else
					this._httpServer = require('http').createServer(this._server);
				
				this._server.listen(this.port,function(){
					me.onStart();
				});
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
			this._httpServer.close();
			this.onStop();
		}
	},
	
	/**
	 * @method
	 * Add a [passport authentication strategy](https://github.com/jaredhanson/passport#strategies-1).
	 * This should be done before the server is started. Adding an authorization strategy while the server is
	 * running will ot be detected. Please see the [OAuth Guide](#!guides/oauth_strategies) for detail.
	 * @param {NGN.web.auth.Strategy}
	 * An OAuth strategy object.
	 */
	addAuthStrategy: function(strategy){
		if (this.running)
			this.fireError('Invalid auth strategy. Cannot be added while server is running.');
		
		if (passport == null) {	
			passport = require('passport');
			this._server.use(passport.initialize());
			if(this.sessionStorage !== null) {
				this._server.use(passport.session());
				
				passport.serializeUser(function(user, done) {
				  done(null, user.id);
				});
				
				passport.deserializeUser(function(id, done) {
				  User.findById(id, function (err, user) {
				    done(err, user);
				  });
				});
			}
		}
	},
	
	/**
	 * @method
	 * Enable templating (based on configured parameters)
	 * @private
	 */
	enableTemplateRendering: function(){
		// If views are specified, make sure the rendering engines are available.
		if (this.views !== null || this.customErrors !== null) {
			
			// Default view engine 
			this._server.set('view engine',this.viewEngine||'html');
			
			// Apply templating engines
			if (this.viewEngines !== null) {
				for (var tplt in this.viewEngines){
					if (this.viewEngines.hasOwnProperty(tplt)){
						this._server.engine(tplt,tpl[this.viewEngines[tplt]]);
					}
				}
			} else
				this._server.engine('html',tpl[this.viewEngine]);
		}
		
		this.enableStandardErrorHandling();
		//this._server.use(this._server.router);
	},
	
	/**
	 * @method
	 * Determines whether a specific view exists or can be found.
	 * @param {String} tpl
	 * The template name. This should be the same value one might see
	 * when sending res.render('<tpl>');
	 * @returns {Boolean}
	 * @private
	 */
	renderIfExists: function(res,status,tpl,data) {
		try {
			res.render(tpl,data||null);
		} catch(e) {
			status = status || this._server.response.status || 500;
			console.log(this._server.response);
			res.send(status);
		}
	},
	
	/**
	 * @method
	 * Enable custom error handling. This method uses custom templates and falls back
	 * to standard types to make sure the error is conveyed appropriately.
	 * @private
	 */
	enableStandardErrorHandling: function(){
		var me = this;
		this._server.use(this.handleError);
	},
	
	/**
	 * @method
	 * Enables session management (based on configured parameters)
	 * @private
	 * @returns {Boolean}
	 * Returns `true` if session management was enabled successfully.
	 */
	enableSessionManagement: function(){
		if (this.sessionStorage !== null){
			this._server.use(express.cookieParser(this.sessionSecret));
			if (this.isString(this.sessionStorage)) {
				if (this.sessionStorage.trim().toLowerCase() !== 'memory'){
					throw Error('Invalid sessionStorage configuration: '+this.sessionStorage.trim()+' is not a valid configuration string.');
					return;
				}
				
				this._server.use(express.session());
			} else {
				
				var options = {}, SessionStore = {};
				
				switch(this.sessionStorage.type.toLowerCase()){
					case 'redis':
						options.client = this.sessionStorage.getClient();
						options.db = this.sessionStorage.database;
						options.prefix = 'ngn:sess:';
						if (this.sessionTimeout > 0)
							options.ttl = this.sessionTimeout;
						SessionStore = require('connect-redis')(express);
						break;
					default:
						throw Error('Invalid sessionStorage connection.');
						break;
				}
				
				var store = new SessionStore(options);
				
				this._server.use(express.session({ store: store }));
			}
			this._server.use(express.cookieSession());
			
			if (this.preventCsrf) {
				this._server.use(function(req, res, next) {
					var token = req.session._csrf;
				  	res.local['csrf_token']= token;
				  	res.local['csrf_input_field'] = '<input type="hidden" name="_csrf" value="' + token + '"/>';
				  	next();
				});
			}
			
			return true;
		}
		return false;
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
					if (me.routes.length == 0) {
						res.write('The web server works, but no routes have been configured.');
						res.end();
					} else {
						res.write('The main route has not been configured.');
						res.end();
					}
				});
			}
			
			// Catch All
			me._server.all(/(.*)/,function(req,res){
				me.on404(res);
				res.send(404);
			});
			
		});
	
	},
	
	/**
	 * @event login
	 * Fired when a login is detected
	 * @returns {Object}
	 * Emits whatever metadata is passed to the onLogin method.
	 */
	onLogin: function(meta){
		this.fireEvent('login',meta||null)
	},
	
	/**
	 * @event logout
	 * Fired when a user logs out.
	 * @returns {Object}
	 * Emits whatever metadata is passed to the onLogin method.
	 */
	onLogout: function(meta){
		this.fireEvent('logout',meta);
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
		this.emit('xxx',{code:code,response:express.response});
		this.onSend();
	}
});



// Create a module out of this.
module.exports = Class;