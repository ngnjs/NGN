var fs			= require('fs'),
	restify		= require('restify'),
	Base		= require('../NGN.Base');

/**
 * @class NGN.http.API
 * Provides a HTTP server **without** support for views and templating. This is based on
 * [restify](http://mcavage.github.com/node-restify/), which ignores templating in favor of
 * performance. This is designed to be used for creating data API's.
 * 
 * @docauthor Corey Butler
 * @extends NGN.Base
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a REST Server.
	 */
	constructor: function(config){
		
		Class.super.constructor.call( this, config );
		
		Object.defineProperties(this,{
			
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
			 * server will need to be running explicitly using the #start method.
			 */
			autoStart: {
				value:		config.autoStart || true,
				enumerable:	true,
				writable:	true
			},
			
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
			},
			
			/**
			 * @cfg {Array/String} [OAuth=[]]
			 * Supports OAuth logins using [passport](http://passportjs.org).
			 * Any [supported passport](http://passportjs.org/guide/oauth-providers.html) is
			 * available to NGN.
			 */
			OAuth: {
				value:		config.OAuth || [],
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
			 * @property {Object}
			 * The raw HTTP Server.
			 * @readonly
			 * @private
			 */
			_httpServer: {
				value:		null,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [preventCsrf=true]
			 * Enable CSRF protection.
			 */
			preventCsrf: {
				value:		config.preventCsrf || true,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [enableStaticCache=true]
			 * This value is ignored if there is no static content.
			 */
			enableStaticCache: {
				value:		config.enableStaticCache || true,
				enumerable:	true,
				writable:	true
			}

		});
		
		var me = this;
		
		this._app.use(express.logger());
		this._app.use(express.bodyParser());
		this._app.use(express.methodOverride());
		
		if (this.enableCompression)
			this._app.use(express.compress());
			
		this.enableSessionManagement();
		
		if (!Array.isArray(this.OAuth))
			this.OAuth = this.OAuth.split(',').remove(null);
		
		if (this.OAuth.length){
			passport = require('passport');
			this._app.use(passport.initialize());
			if(this.sessionStorage !== null)
				this._app.use(passport.session());
		}
		
		this.enableTemplateRendering();
		this.generateRoutes();
		
		if (this.assets !== null) {
			if (this.enableStaticCache)
				this._app.use(express.staticCache());
			var opts = this.maxAssetAge == null ? null : {maxAge:this.maxAssetAge};
			this._app.use(express.static(this.assets,opts));
		}
		
		if (this.autoStart)
			this.start();
	},
	
	/**
	 * @method
	 * Start listening for requests.
	 */
	start: function(){
		if (!this.running) {
			var me 		= this,
				options = {};
			
			if (this.ssl !== null)
				this._server = require('https').createServer(this.ssl,this._app);
			else
				this._server = require('http').createServer(this._app);
	
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
	 * Enable templating (based on configured parameters)
	 */
	enableTemplateRendering: function(){
		// If views are specified, make sure the rendering engines are available.
		if (this.views !== null || this.customErrors !== null) {
			
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
		
		//this.enableStandardErrorHandling();
		this._app.use(this._app.router);
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
			status = status || this._app.response.status || 500;
			console.log(this._app.response);
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
		this._app.use(function(req, res, next){

			// Respond with html page
			if (req.accepts('html')) {
			  res.status(404);
			  me.renderIfExists(res, 404, '404', { url: req.url });
			  return;
			}
			
			// respond with json
			if (req.accepts('json')) {
			  res.send({ error: 'Not found' });
			  return;
			}
			
			// default to plain-text. send()
			res.type('txt').send('Not found');
		});
		
		this._app.use(function(err, req, res, next){
		  // we may use properties of the error object
		  // here and next(err) appropriately, or if
		  // we possibly recovered from the error, simply next().
		  res.status(err.status || 500);
		  me.renderIfExists(res, 500, '500', { error: err });
		});
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
			this._app.use(express.cookieSession());
			
			if (this.preventCsrf) {
				this._app.use(function(req, res, next) {
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
		
		// Create a mapper
		if (this._app.map == undefined) {
			Object.defineProperty(this._app,'map',{
				value:		function(a, route){
								route = route || '';
						  		for (var key in a) {
						  			if (a.hasOwnProperty(key)) {
							    		switch (typeof a[key]) {
							  				case 'object':
							    				me._app.map(a[key], route + key);
							   					break;
											case 'function':
												
												//console.log('%s %s', key, route);
							    				//me._app[key](route, a[key]);
							    				
							    				// Add special pointer variables for simpler processing.
							    				me._app[key](route, function(__req,__res, __next){
							    					var req = __req,
							    						res = __res,
							    						next= __next || function(){};
							    					
							    					var fn = function(){

														var ua = __req.headers['user-agent'].toLowerCase();
														var uaParser = require('ua-parser');
														var b = uaParser.parse(ua);
														
														// Pointers
							    						this.url	= __req.query || {};
							    						this.form	= __req.method.trim().toUpperCase() == 'PUT' 
																	|| __req.method.trim().toUpperCase() == 'POST'
																	?  __req.body
																	: {};
														this.session= __req.session || {};
														this.cgi	= {
																		http_headers: __res.headers,
																		path_info: __req.url,
																		user_agent: __req.headers['user-agent'],
																		method: __req.originalMethod || _eq.method,
																		isMobileDevice: (/android|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(ad|hone|od)|playbook|silk|iris|kindle|lge |maemo|meego.+mobile|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4))),
																		'http_accept': __req.headers.accept.split(',')
																	};
														this.browser={
																		name: b.toString(),
																		version: b.toVersionString(),
																		family:	b.family,
																		major: b.major,
																		minor: b.minor,
																		patch: b.patch,
																		mobile: this.cgi.isMobileDevice	
																	};
														
														__res.locals({
															session: this.session,
															application: application,
															url: this.url,
															browser: this.browser
														});
														
														if (this.form !== {})
															__res.locals.form = this.form;
																	
							    						this.request=
							    						this.req 	= __req;
							    						this.response=
							    						this.res 	= __res;
							    						this.next	= __next;
							    						
							    						this.fn = a[key];
							    						
							    						this.fn(this.req,this.res,this.next);
							    					}
							    					
							    					fn();	
							    					
							    					// Emit a status code based on what is sent to the client.
													me['on'+this.res.statusCode]();
							    					
							    				});
							    				break;
										}
									}
								}
							},
				enumerable: false
			});
		}
		
		// If the routes configuration provides an array of filepaths, loop
		// through them to process them all
		this.routes = this.routes == null ? [] : this.routes.split(',');
		
		for (var i=0; i<this.routes.length; i++) {	
			// If a path is defined, make sure it exists.
			if (!require('fs').existsSync(this.routes[i].trim())){
				throw Error('The route path does not exist or could not be found.',this.routes[i].trim());
				return;
			}
			
			// Loop through the directories and add each JS file, assuming each is a route.
			var rt = this.routes[i].trim();
			require('wrench').readdirRecursive( rt, function(err, filepath){
				if(filepath !== null) {
					for(var n=0;n<filepath.length;n++) {
						if (filepath[n].substr(filepath[n].length-3,3).toLowerCase() == '.js'){
							me._app.map(require(rt+'/'+filepath[n]));
						}
					}
				}
			});
		}
	
		// Make sure routes are defined, otherwise generate a placeholder. 
		// This is a fallback if no root route is defined.
		this._app.get('/',function(req,res){
			if (me.routes == null) {
				res.write('The web server works, but no routes have been configured.');
				res.end();
			} else {
				res.write('The main route has not been configured.');
				res.end();
			}
		});
	},
	
	/**
	 * @event start
	 * Fired when the web server starts.
	 */
	onStart: function(){
		this.running = true;
		this.emit('ready');
		this.fireEvent('start',this);
	},
	
	/**
	 * @event stop
	 * Fired when the server stops.
	 */
	onStop: function(){
		this.running = false;
		this.fireEvent('stop',this);
	},
	
	/**
	 * @event send
	 * Fired when a response is sent to the client.
	 * @returns {Object} responseStream
	 */
	onSend: function(){
		this.emit('send',this._app.response);
	},
	
	/**
	 * @event 1xx
	 * Fired on every HTTP 100-level response.
	 */
	on1xx: function(code){
		this.emit('1xx',{code:code,res:express.response});
		this.onXXX(code);
	},
	
	/**
	 * @event 100
	 */
	on100: function(){
		this.emit('100',{code:100,res:express.response});
		this.on1xx(100);
	},
	
	/**
	 * @event 101
	 */
	on101: function(){
		this.emit('101',{code:101,res:express.response});
		this.on1xx(101);
	},
	
	
	/**
	 * @event 2xx
	 * Fired on every HTTP 200-level response.
	 */
	on2xx: function(code){
		this.emit('2xx',{code:code,res:express.response});
		this.onXXX(code);
	},
	
	/**
	 * @event 200
	 */
	on200: function(){
		this.emit('200',{code:200,res:express.response});
		this.on2xx(200);
	},
	
	/**
	 * @event 201
	 */
	on201: function(){
		this.emit('201',{code:201,res:express.response});
		this.on2xx(201);
	},
	
	/**
	 * @event 202
	 */
	on202: function(){
		this.emit('202',{code:202,res:express.response});
		this.on2xx(202);
	},
	
	/**
	 * @event 203
	 */
	on203: function(){
		this.emit('203',{code:203,res:express.response});
		this.on2xx(203);
	},
	
	/**
	 * @event 204
	 */
	on204: function(){
		this.emit('204',{code:204,res:express.response});
		this.on2xx(204);
	},
	
	/**
	 * @event 205
	 */
	on205: function(){
		this.emit('205',{code:205,res:express.response});
		this.on2xx(205);
	},
	
	/**
	 * @event 206
	 */
	on206: function(){
		this.emit('206',{code:206,res:express.response});
		this.on2xx(206);
	},
	
	/**
	 * @event 3xx
	 * Fired on every HTTP 300-level response.
	 */
	on3xx: function(code){
		this.emit('3xx',{code:code,res:express.response});
		this.onXXX(code);
	},
	
	/**
	 * @event 300
	 */
	on300: function(){
		this.emit('300',{code:300,res:express.response});
		this.on3xx(300);
	},
	
	/**
	 * @event 301
	 */
	on301: function(){
		this.emit('301',{code:301,res:express.response});
		this.on3xx(301);
	},
	
	/**
	 * @event 302
	 */
	on302: function(){
		this.emit('302',{code:302,res:express.response});
		this.on3xx(302);
	},
	
	/**
	 * @event 303
	 */
	on303: function(){
		this.emit('303',{code:303,res:express.response});
		this.on3xx(303);
	},
	
	/**
	 * @event 304
	 */
	on304: function(){
		this.emit('304',{code:304,res:express.response});
		this.on3xx(304);
	},
	
	/**
	 * @event 305
	 */
	on305: function(){
		this.emit('305',{code:305,res:express.response});
		this.on3xx();
	},
	
	/**
	 * @event 306
	 */
	on306: function(){
		this.emit('306',{code:306,res:express.response});
		this.on3xx(306);
	},
	
	/**
	 * @event 307
	 */
	on307: function(){
		this.emit('307',{code:307,res:express.response});
		this.on3xx(307);
	},
	
	/**
	 * @event 4xx
	 * Fired on every HTTP 400-level response.
	 */
	on4xx: function(code){
		this.emit('4xx',{code:code,res:express.response});
		this.onXXX(code);
	},
	
	/**
	 * @event 400
	 */
	on400: function(){
		this.emit('400',{code:400,res:express.response});
		this.on4xx(400);
	},
	
	/**
	 * @event 401
	 */
	on401: function(){
		this.emit('401',{code:401,res:express.response});
		this.on4xx(401);
	},
	
	/**
	 * @event 402
	 */
	on402: function(){
		this.emit('402',{code:402,res:express.response});
		this.on4xx(402);
	},
	
	/**
	 * @event 403
	 */
	on403: function(){
		this.emit('403',{code:403,res:express.response});
		this.on4xx(403);
	},
	
	/**
	 * @event 404
	 */
	on404: function(){
		this.emit('404',{code:404,res:express.response});
		this.on4xx(404);
	},
	
	/**
	 * @event 405
	 */
	on405: function(){
		this.emit('405',{code:405,res:express.response});
		this.on4xx(405);
	},
	
	/**
	 * @event 406
	 */
	on406: function(){
		this.emit('406',{code:406,res:express.response});
		this.on4xx(406);
	},
	
	/**
	 * @event 407
	 */
	on407: function(){
		this.emit('407',{code:407,res:express.response});
		this.on4xx(407);
	},
	
	/**
	 * @event 408
	 */
	on408: function(){
		this.emit('408',{code:408,res:express.response});
		this.on4xx(408);
	},
	
	/**
	 * @event 409
	 */
	on409: function(){
		this.emit('409',{code:409,res:express.response});
		this.on4xx(409);
	},
	
	/**
	 * @event 410
	 */
	on410: function(){
		this.emit('410',{code:410,res:express.response});
		this.on4xx(410);
	},
	
	/**
	 * @event 411
	 */
	on411: function(){
		this.emit('411',{code:411,res:express.response});
		this.on4xx(411);
	},
	
	/**
	 * @event 412
	 */
	on412: function(){
		this.emit('412',{code:412,res:express.response});
		this.on4xx(412);
	},
	
	/**
	 * @event 413
	 */
	on413: function(){
		this.emit('413',{code:413,res:express.response});
		this.on4xx(413);
	},
	
	/**
	 * @event 414
	 */
	on414: function(){
		this.emit('414',{code:414,res:express.response});
		this.on4xx(414);
	},
	
	/**
	 * @event 415
	 */
	on415: function(){
		this.emit('415',{code:415,res:express.response});
		this.on4xx(415);
	},
	
	/**
	 * @event 416
	 */
	on416: function(){
		this.emit('416',{code:416,res:express.response});
		this.on4xx(416);
	},
	
	/**
	 * @event 417
	 */
	on417: function(){
		this.emit('417',{code:417,res:express.response});
		this.on4xx(417);
	},
	
	/**
	 * @event 5xx
	 * Fired on every HTTP 500-level response.
	 */
	on5xx: function(code){
		this.emit('5xx',{code:code,res:express.response});
		this.onXXX(code);
	
	},
	
	/**
	 * @event 500
	 */
	on500: function(){
		this.emit('500',{code:500,res:express.response});
		this.on5xx(500);
	},
	
	/**
	 * @event 501
	 */
	on501: function(){
		this.emit('501',{code:501,res:express.response});
		this.on5xx(501);
	},
	
	/**
	 * @event 502
	 */
	on502: function(){
		this.emit('502',{code:502,res:express.response});
		this.on5xx(502);
	},
	
	/**
	 * @event 503
	 */
	on503: function(){
		this.emit('503',{code:503,res:express.response});
		this.on5xx(503);
	},
	
	/**
	 * @event 504
	 */
	on504: function(){
		this.emit('504',{code:504,res:express.response});
		this.on5xx(504);
	},
	
	/**
	 * @event 505
	 */
	on505: function(){
		this.emit('505',{code:505,res:express.response});
		this.on5xx(505);
	},
	
	/**
	 * @event xxx
	 * Fired on every HTTP response.
	 */
	onXXX: function(code){
		this.emit('xxx',{code:code,res:express.response});
		this.onSend();
	}
});



// Create a module out of this.
module.exports = Class;
