var fs			= require('fs'),
	express		= require('express'),
	tpl			= require('consolidate'),
	uuid		= require('node-uuid'),
	Base		= require('../NGN.Base');

/**
 * @class NGN.http.Server
 * Provides a standard HTTP server interface for serving web content.  
 * 
 * This is based on [express 3.0](http://expressjs.com) from [TJ Holowaychuk](https://github.com/visionmedia).
 * ExpressJS is a powerful node module with a large feature set. It is also one of the most commonly used by the node
 * community. Express can be utilized with relative ease independently of any other structure, but NGN strives to
 * simplify many of the common boilerplate configurations surrounding Express. Furthermore, this object acts as a
 * consistent interface. Should it be necessary to switch to something other than Express, applications dependent on
 * NGN.http.Server should not require rework in order to use a different web server module.
 * 
 * Most web servers typically utilize routes for processing requests, templates for dynamic page construction,
 * and manage static assets like images, CSS, etc.
 * 
 * A standard web server using common [jade templates](http://jade-lang.com).
 * 
 * 		var server = new NGN.http.Server({
 * 			autoStart: false,
 * 			port: 80,
 * 			assets: '/path/to/static/file/dir',
 * 			views: '/path/to/templates',
 * 			viewEngine: 'jade',
 * 			routes: '/path/to/routes'
 * 		});
 * 		
 * 		server.start();
 * 
 * The following example creates an HTTP**S** web server. Note that `autoStart` is set
 * to `false`, and unlike Express, the server is started using `start()` instead of `listen()`.
 * The #start method will make the web server listen on the specified #port. In the case of `ssl`,
 * the port is assumed to be `443` (standard).
 * 
 * 		var server = new NGN.http.Server({
 * 			autoStart: false,
 * 			routes: '/path/to/routes',
 * 			ssl: {
 * 				cert:	'/path/to/cert.pem',
 * 				key:	'/path/to/key.pem'
 * 			}
 * 		});
 * 		
 * 		server.start();
 * 
 * @docauthor Corey Butler
 * @extends NGN.Base
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a HTTP/S server.
	 */
	constructor: function(config){
		
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
			 * @cfg {String/Array} routes (required)
			 * Path to directory where routes are stored. Also accepts an 
			 * array of file paths. Routes are created by recursively
			 * processing each specified directory and importing each `.js` file
			 * it finds. 
			 */
			routes: {
				value:		config.routes || null,
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
			 * @property
			 * The core express server object.
			 * @private
			 * @readonly
			 */
			_app: {
				value:		express(),
				enumerable:	false,
				writable:	false
			},
			
			/**
			 * @cfg {Object} [ssl=null]
			 * The certificate and key used for encrypting HTTP**S** traffic.
			 * 
			 * 		{
			 * 			cert: 	'/path/to/cert.pem',
			 * 			key:	'/path/to/key.pem'
			 * 		}
			 * For more information about generating SSL certificates, please see the [NGN Command Line Interface Guide](#!/guide/cli). 
			 */
			ssl: {
				value:		config.ssl || null,
				enumerable:	true,
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
			 * server will need to be started explicitly using the #start method.
			 */
			autoStart: {
				value:		config.autoStart || true,
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
				value:		config.sessionSecret || uuid.v1(),
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [enableCompression=false]
			 * Compress output sent to the browser using gzip.
			 */
			enableCompression: {
				value:		config.gzip || false,
				enumerable:	true,
				writable:	true
			}

		});
		
		this._app.use(this._app.bodyParser());
		
		if (this.enableCompression)
			this._app.use(express.compress());
			
		this.enableSessionManagement();
		this.enableTemplateRendering();
		this.generateRoutes();
		
		this._app.use(function(err, req, res, next){
		  // if an error occurs Connect will pass it down
		  // through these "error-handling" middleware
		  // allowing you to respond however you like
		  me.fireError(err)
		  res.send(500, { error: 'An unknown error occurred.' });
		});
		
		if (this.autoStart)
			this.start();
	},
	
	/**
	 * @method
	 * Start listening for requests.
	 */
	start: function(){
		this._app.listen(this.port);
	},
	
	/**
	 * @method
	 * Enable templating (based on configured parameters)
	 */
	enableTemplateRendering: function(){
		// If views are specified, make sure the rendering engines are available.
		if (this.views !== null) {
			
			// Default view engine 
			this._app.set('view engine','html');
			
			// Apply templating engines
			if (this.viewEngines !== null) {
				for (var tplt in this.viewEngines){
					if (this.viewEngines.hasOwnProperty(tplt)){
						this._app.engine(tplt,tpl[this.viewEngines[tplt]]);
					}
				}
			} else
				this._app.engine('html',tpl[this.viewEngine]);
		}
		
		this._app.use(this._app.router);
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
			this._app.use(express.cookieParser(this.sessionSecret));
			if (this.isString(this.sessionStorage)) {
				if (this.sessionStorage.trim().toLowerCase() !== 'memory'){
					throw Error('Invalid sessionStorage configuration: '+this.sessionStorage.trim()+' is not a valid configuration string.');
					return;
				}
				
				this._app.use(express.session());
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
				
				this._app.use(express.session({ store: store }));
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
	
		// Make sure routes are defined, otherwise generate a placeholder
		if (this.routes == null) {
			this.app.get('/',function(req,res){
				res.write('The web server works, but no routes have been configured.');
				res.end();
			});
			return;
		}
		
		// If the routes configuration provides an array of filepaths, loop
		// through them to process them all
		if (!this.isArray(this.routes))
			this.routes = this.routes.split(',');
		
		for (var i=0; i<this.routes.length; i++) {	
			// If a path is defined, make sure it exists.
			if (!require('fs').existsSync(this.routes[i].trim())){
				throw Error('The route path does not exist or could not be found.',this.routes[i].trim());
				return;
			}
			
			// Loop through the directories and add each JS file, assuming each is a route.
			require('wrench').readdirRecursive( this.routes[i].trim(), function(err, filepath){
				if (filepath.substr(filepath.length-3,3).toLowerCase() == 'js')
					require(filepath)(me._app);
			});
		}
	}
});



// Create a module out of this.
module.exports = Class;
