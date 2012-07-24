var fs	 = require('fs'),
	Base = require('./Server');

/**
 * @class NGN.core.HttpServer
 * A generic utility/base class representing a HTTP server.
 * This class typically isn't invoked directly. It is designed as a base class
 * for different server types like NGN.web.Server, NGN.web.ApiServer, etc.
 * @private
 * @extends NGN.core.Server
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new server.
	 * @params {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
		
		config.type = 'HTTP';
		
		Class.super.constructor.call(this, config);
		
		Object.defineProperties(this,{
			
			/**
			 * @property
			 * The core server object.
			 * @private
			 * @readonly
			 */
			_server: {
				value:		{},
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @property
			 * The core server options object.
			 * @private
			 * @readonly.
			 */
			_serverOptions: {
				value:		config.ssl || null,
				enumerable:	false,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {String/Array} routes (required)
			 * Path to directory where routes are stored. Also accepts an 
			 * array of file paths. Routes are created by recursively
			 * processing each specified directory and importing each `.js` file
			 * it finds. 
			 */
			routes: {
				value:		config.routes || [],
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {Object} [ssl=null]
			 * The certificate and key used for encrypting HTTP**S** traffic.
			 * 
			 * 		{
			 * 			cert: 	'/path/to/cert.pem',
			 * 			key:	'/path/to/key.pem',
			 * 			ca:		'/path/to/ca.crt' // Optional
			 * 		}
			 * For more information about generating SSL certificates, please see the [NGN Command Line Interface Guide](#!/guide/cli). 
			 */
			ssl: {
				value:		config.ssl || null,
				enumerable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {Boolean} [requireClientSsl=false]
			 * Require a client/browser SSL certificate to access the server.
			 */
			requireClientCert: {
				value:		config.requireClientSsl || false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [rejectUnauthorizedClientCert=false]
			 * Reject a client connection if the certificate presented is not assigned by the CA cert (see #ssl), has expired, or has been revoked.
			 * 
			 * **Only applicable when #requireClientSsl is** `true`**.**
			 */
			rejectUnauthorizedCert: {
				value:		config.rejectUnauthorizedClientCert || false,
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
			 * @cfg {Boolean} [enableCompression=false]
			 * Compress output sent to the browser using gzip.
			 */
			enableCompression: {
				value:		config.enableCompression || false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Function}
			 * A middleware function designed for authenticating client requests before processing them.
			 * 
			 * The function will receive three arguments, including `request`, `response`, and `next` (optional).
			 * If the function returns `false`, the server will respond with a `401 - Unauthorized`. If it returns
			 * `true`, processing continues.
			 * 
			 * **Example**
			 * 		var memberIds = [123,456,789,1011,1213]; 
			 * 		
			 * 		{
			 * 			authenticate: function(req,res,next){
			 * 				if (memberIds.indexOf(req.user.id) !== -1) {
			 * 					return true;
			 * 				} else {
			 * 					return false;
			 * 				}
			 * 			}
			 * 		}
			 * 
			 * If the application requires custom authentication responses (such as sending a `403 -Forbidden` instead of `401`), this configuration 
			 * should be ignored. A custom #preRequestMiddleware method can be used instead.
			 * 
			 */
			authenticate: {
				value:		config.authenticate || function(req,res,next){next()},
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {Function}
			 * A middleware function designed for authorizing client requests before processing them. This is always
			 * executed _after_ #authenticate.
			 * 
			 * The function will receive three arguments, including `request`, `response`, and `next` (optional).
			 * If the function returns `false`, the server will respond with a `401 - Unauthorized`. If it returns
			 * `true`, processing continues.
			 * 
			 * **Example**
			 * 		var adminIds = [123,456]; 
			 * 		
			 * 		{
			 * 			authorize: function(req,res,next){
			 * 				if (adminIds.indexOf(req.user.id) !== -1) {
			 * 					return true;
			 * 				} else {
			 * 					return false;
			 * 				}
			 * 			}
			 * 		}
			 * 
			 * If the application requires custom authentication responses (such as sending a `403 -Forbidden` instead of `401`), this configuration 
			 * should be ignored. A custom #preRequestMiddleware method can be used instead.
			 * 
			 */
			authorize: {
				value:		config.authorize || function(req,res,next){next()},
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			_ALLOWCORS: {
				value:		config.allowCrossOrigin || null,
				enumerable:	false,
				writable:	true
			},
			
			
			_ALLOWMETHODS: {
				value:		config.allowMethods || null,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean/String/Array} [enableCrossOrigin=false]
			 * Set to `true` to enable requests from all origins. Alternatively,
			 * provide a {String} domain, such as `my.safedomain.com` or `my.safedomain.com, other.domain.net`. 
			 * Also accepts an array of domains:
			 * 
			 * 		['first.safedomain.com','second.safedomain.com']
			 */
			enableCrossOrigin: {
				enumerable: true,
				get:		function(){ return this._ALLOWCORS; },
				set:		function(value){
								if (typeof value === 'boolean'){
									this._ALLOWCORS = value == true ? '*' : null;
								} else {
									this._ALLOWCORS = Array.isArray(value) == true ? value.join() : value;
								}
							}
			},
			
			/**
			 * @cfg {String/Array}
			 * Restrict traffic to specific HTTP methods/verbs such as `GET`,`POST`,`PUT`,`DELETE`, and `TRACE`.
			 * By default, everything is allowed. Only configure this when the application needs to explicitly
			 * use a limited number of verbs. For example, a read-only site may set this to `GET`.
			 */
			enableMethods: {
				enumerable: true,
				get:		function(){ return this._ALLOWMETHODS; },
				set:		function(value){
								this._ALLOWMETHODS = (Array.isArray(value) == true ? value.join() : value).toUpperCase();
							}
			},
			
			/*
			 * @cfg {Object}
			 * A key/value object containing custom middleware functions executed before.  
			 */
			/*preRequestMiddleware: {
				value:		config.middleware || {},
				enumerable:	true,
				configurable:true
			}*/
			
			/**
			 * @cfg {Boolean} [enableBasicAuth=false]
			 * Setting this to true will require basic authentication before completing a request. This should be 
			 * used in conjunction with #basicAuthUsers. If no users are specified, every request will fail!
			 * 
			 * Basic authentication is executed _before_ #authenticate and #authorize.
			 */
			enableBasicAuth: {
				value:		config.enableBasicAuth || false,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {Object}
			 * A key/value 
			 */
			basicAuthUsers: {
				
			}
			
		});
		
		if (this.requireClientCert || this.rejectUnauthorizedCert) {
			this._serverOptions = this._serverOptions || {};
			this._serverOptions.requireClientCert = true;
		
			if (this.rejectUnauthorizedCert)
				this._serverOptions.rejectUnauthorizedCert = true;
		}
		
	},
	
	/**
	 * @method
	 * Generates server routes. If no #routes are configured, a generic
	 * route will be created for the URL root.
	 * @param {Function} [callback]
	 * The callback sends a single {Boolean} argument to a method indicating a root route has been created. 
	 * @returns {Boolean}
	 */
	generateRoutes: function(callback) {
		return this._generateRoutes(callback);
	},
	
	/**
	 * @method
	 * Generates server routes. If no #routes are configured, a generic
	 * route will be created for the URL root.
	 * @private
	 * @param {Function} [callback]
	 * The callback sends a single {Boolean} argument to a method indicating a root route has been created. 
	 * @returns {Boolean}
	 */
	_generateRoutes: function(callback){

		callback = callback || null;
		
		var me = this;
		
		// Create a mapper
		if (!this._server.hasOwnProperty('map')) {
			Object.defineProperty(this._server,'map',{
				value:		function(a, route){
								route = route || '';
						  		for (var key in a) {
						  			if (a.hasOwnProperty(key)) {
							    		switch (typeof a[key]) {
							  				case 'object':
							    				me._server.map(a[key], route + key);
							   					break;
											case 'function':
												
												//console.log('%s %s', key, route);
							    				//me._server[key](route, a[key]);
							    				
							    				// Add special pointer variables for simpler processing.
							    				// If the route is a regex, support it
							    				if (route.trim().substr(0,1) == '/' && route.substr(route.trim().length-1,1) == '/')
								    				route = new RegExp(route.trim().substr(1,route.trim().length-2));
								    			
								    			me._server[key](route, function(__req,__res, __next){
							    					var req = __req,
							    						res = __res,
							    						next= __next || function(){};
							    					
							    					var fn = function(){

														var ua = (__req.headers['user-agent'] || '').toLowerCase();
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
																		method: __req.originalMethod || __req.method,
																		isMobileDevice: (/android|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(ad|hone|od)|playbook|silk|iris|kindle|lge |maemo|meego.+mobile|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4))),
																		'http_accept': __req.headers.accept !== undefined ? __req.headers.accept.split(',') : []
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
														
														// Specific to web server
														if (__res.locals) {
															__res.locals({
																session: this.session,
																url: this.url,
																browser: this.browser
															});
															
															if (global.application !== undefined)
																__res.locals.application = global.application.toJson;
															
															if (this.form !== {})
																__res.locals.form = this.form;
														}
																	
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
													me['on'+__res.statusCode](__res);
							    					
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
		this.routes = (typeof this.routes == 'string' ? this.routes.split(',') : this.routes);
		
		var _hasRootRoute = false;
		for (var i=0; i<this.routes.length; i++) {	
			// If a path is defined, make sure it exists.
			if (!require('fs').existsSync(this.routes[i].trim())){
				throw Error('The route path does not exist or could not be found.',this.routes[i].trim());
				return;
			}
			
			// Loop through the directories and add each JS file, assuming each is a route.
			var rt = this.routes[i].trim();
			/*
			// Async Route Loader
			require('wrench').readdirRecursive( rt, function(err, filepath){
				if(filepath !== null) {
					for(var n=0;n<filepath.length;n++) {
						if (filepath[n].substr(filepath[n].length-3,3).toLowerCase() == '.js'){
							var _rt = require(rt+'/'+filepath[n]);
							if (!_hasRootRoute && _rt['/'] !== undefined)
								_hasRootRoute = true;
							console.log('--->',_hasRootRoute)
							me._server.map(_rt);
						}
					}
				}
			});*/
			
			// Sync Route Loader
			console.log(this.routes,rt);
			var filepath = require('wrench').readdirSyncRecursive(rt);
			for (var n=0;n<filepath.length;n++){
				if (filepath[n].substr(filepath[n].length-3,3).toLowerCase() == '.js' && filepath[n].toString().trim().toLowerCase() !== 'root.js'){
					var _rt = require(rt+'/'+filepath[n]);
					if (!_hasRootRoute && _rt['/'] !== undefined)
						_hasRootRoute = true;
					this._server.map(_rt);
				}
			}
			
			if (!_hasRootRoute && require('fs').existsSync(rt+'/root.js')) {
				console.log(rt);
				var _rt = require(rt+'/root.js');
				if (!_hasRootRoute && _rt['/'] !== undefined)
					_hasRootRoute = true;
				this._server.map(_rt);
			}
				
		}
		
		if (callback !== null)
			callback(_hasRootRoute);
		else
			return _hasRootRoute;
	},
	
	/**
     * @event sessionstart
     * Fired when a user session starts. 
     */
    onSessionStart: function(){
    	this.fireEvent('sessionstart');
    },
    
    /**
     * @event sessionend
     * Fired when a session ends.
     */
    onSessionEnd: function(){
    	this.fireEvent('sessionend');
    },
    
    /**
     * @event requeststart
     * Fired when a request starts.
     */
    onRequestStart: function(){
    	this.fireEvent('requeststart');
    },
    
    /**
     * @event requestend
     * Fired just before the request ends
     */
    onRequestEnd: function(){
    	this.fireEvent('requestend');
    },
	
	/**
	 * @event 1xx
	 * Fired on every HTTP 100-level response.
	 */
	on1xx: function(code,res){
		this.emit('1xx',{code:code,response:(response||null)});
		this.onXXX(code,response||null);
	},
	
	/**
	 * @event 100
	 */
	on100: function(response){
		this.emit('100',{code:100,response:(response||null)});
		this.on1xx(100,response||null);
	},
	
	/**
	 * @event 101
	 */
	on101: function(response){
		this.emit('101',{code:101,response:(response||null)});
		this.on1xx(101,response||null);
	},
	
	
	/**
	 * @event 2xx
	 * Fired on every HTTP 200-level response.
	 */
	on2xx: function(code,response){
		this.emit('2xx',{code:code,response:(response||null)});
		this.onXXX(code,response||null);
	},
	
	/**
	 * @event 200
	 */
	on200: function(response){
		this.emit('200',{code:200,response:(response||null)});
		this.on2xx(200,response||null);
	},
	
	/**
	 * @event 201
	 */
	on201: function(response){
		this.emit('201',{code:201,response:(response||null)});
		this.on2xx(201,response||null);
	},
	
	/**
	 * @event 202
	 */
	on202: function(response){
		this.emit('202',{code:202,response:(response||null)});
		this.on2xx(202,response||null);
	},
	
	/**
	 * @event 203
	 */
	on203: function(response){
		this.emit('203',{code:203,response:(response||null)});
		this.on2xx(203,response||null);
	},
	
	/**
	 * @event 204
	 */
	on204: function(response){
		this.emit('204',{code:204,response:(response||null)});
		this.on2xx(204,response||null);
	},
	
	/**
	 * @event 205
	 */
	on205: function(response){
		this.emit('205',{code:205,response:(response||null)});
		this.on2xx(205,response||null);
	},
	
	/**
	 * @event 206
	 */
	on206: function(response){
		this.emit('206',{code:206,response:(response||null)});
		this.on2xx(206,response||null);
	},
	
	/**
	 * @event 3xx
	 * Fired on every HTTP 300-level response.
	 */
	on3xx: function(code,response){
		this.emit('3xx',{code:code,response:(response||null)});
		this.onXXX(code,response||null);
	},
	
	/**
	 * @event 300
	 */
	on300: function(response){
		this.emit('300',{code:300,response:(response||null)});
		this.on3xx(300,response||null);
	},
	
	/**
	 * @event 301
	 */
	on301: function(response){
		this.emit('301',{code:301,response:(response||null)});
		this.on3xx(301,response||null);
	},
	
	/**
	 * @event 302
	 */
	on302: function(response){
		this.emit('302',{code:302,response:(response||null)});
		this.on3xx(302,response||null);
	},
	
	/**
	 * @event 303
	 */
	on303: function(response){
		this.emit('303',{code:303,response:(response||null)});
		this.on3xx(303,response||null);
	},
	
	/**
	 * @event 304
	 */
	on304: function(response){
		this.emit('304',{code:304,response:(response||null)});
		this.on3xx(304,response||null);
	},
	
	/**
	 * @event 305
	 */
	on305: function(response){
		this.emit('305',{code:305,response:(response||null)});
		this.on3xx(305,response||null);
	},
	
	/**
	 * @event 306
	 */
	on306: function(response){
		this.emit('306',{code:306,response:(response||null)});
		this.on3xx(306,response||null);
	},
	
	/**
	 * @event 307
	 */
	on307: function(response){
		this.emit('307',{code:307,response:(response||null)});
		this.on3xx(307,response||null);
	},
	
	/**
	 * @event 4xx
	 * Fired on every HTTP 400-level response.
	 */
	on4xx: function(code,response){
		this.emit('4xx',{code:code,response:(response||null)});
		this.onXXX(code,response||null);
	},
	
	/**
	 * @event 400
	 */
	on400: function(response){
		this.emit('400',{code:400,response:(response||null)});
		this.on4xx(400,response||null);
	},
	
	/**
	 * @event 401
	 */
	on401: function(response){
		this.emit('401',{code:401,response:(response||null)});
		this.on4xx(401,response||null);
	},
	
	/**
	 * @event 402
	 */
	on402: function(response){
		this.emit('402',{code:402,response:(response||null)});
		this.on4xx(402,response||null);
	},
	
	/**
	 * @event 403
	 */
	on403: function(response){
		this.emit('403',{code:403,response:(response||null)});
		this.on4xx(403,response||null);
	},
	
	/**
	 * @event 404
	 */
	on404: function(response){
		this.emit('404',{code:404,response:(response||null)});
		this.on4xx(404,response||null);
	},
	
	/**
	 * @event 405
	 */
	on405: function(response){
		this.emit('405',{code:405,response:(response||null)});
		this.on4xx(405,response||null);
	},
	
	/**
	 * @event 406
	 */
	on406: function(response){
		this.emit('406',{code:406,response:(response||null)});
		this.on4xx(406,response||null);
	},
	
	/**
	 * @event 407
	 */
	on407: function(response){
		this.emit('407',{code:407,response:(response||null)});
		this.on4xx(407,response||null);
	},
	
	/**
	 * @event 408
	 */
	on408: function(response){
		this.emit('408',{code:408,response:(response||null)});
		this.on4xx(408,response||null);
	},
	
	/**
	 * @event 409
	 */
	on409: function(response){
		this.emit('409',{code:409,response:(response||null)});
		this.on4xx(409,response||null);
	},
	
	/**
	 * @event 410
	 */
	on410: function(response){
		this.emit('410',{code:410,response:(response||null)});
		this.on4xx(410,response||null);
	},
	
	/**
	 * @event 411
	 */
	on411: function(response){
		this.emit('411',{code:411,response:(response||null)});
		this.on4xx(411,response||null);
	},
	
	/**
	 * @event 412
	 */
	on412: function(response){
		this.emit('412',{code:412,response:(response||null)});
		this.on4xx(412,response||null);
	},
	
	/**
	 * @event 413
	 */
	on413: function(response){
		this.emit('413',{code:413,response:(response||null)});
		this.on4xx(413,response||null);
	},
	
	/**
	 * @event 414
	 */
	on414: function(response){
		this.emit('414',{code:414,response:(response||null)});
		this.on4xx(414,response||null);
	},
	
	/**
	 * @event 415
	 */
	on415: function(response){
		this.emit('415',{code:415,response:(response||null)});
		this.on4xx(415,response||null);
	},
	
	/**
	 * @event 416
	 */
	on416: function(response){
		this.emit('416',{code:416,response:(response||null)});
		this.on4xx(416,response||null);
	},
	
	/**
	 * @event 417
	 */
	on417: function(response){
		this.emit('417',{code:417,response:(response||null)});
		this.on4xx(417,response||null);
	},
	
	/**
	 * @event 5xx
	 * Fired on every HTTP 500-level response.
	 */
	on5xx: function(code,response){
		this.emit('5xx',{code:code,response:(response||null)});
		this.onXXX(code,response||null);
	
	},
	
	/**
	 * @event 500
	 */
	on500: function(response){
		this.emit('500',{code:500,response:(response||null)});
		this.on5xx(500,response||null);
	},
	
	/**
	 * @event 501
	 */
	on501: function(response){
		this.emit('501',{code:501,response:(response||null)});
		this.on5xx(501,response||null);
	},
	
	/**
	 * @event 502
	 */
	on502: function(response){
		this.emit('502',{code:502,response:(response||null)});
		this.on5xx(502,response||null);
	},
	
	/**
	 * @event 503
	 */
	on503: function(response){
		this.emit('503',{code:503,response:(response||null)});
		this.on5xx(503,response||null);
	},
	
	/**
	 * @event 504
	 */
	on504: function(response){
		this.emit('504',{code:504,response:(response||null)});
		this.on5xx(504,response||null);
	},
	
	/**
	 * @event 505
	 */
	on505: function(response){
		this.emit('505',{code:505,response:(response||null)});
		this.on5xx(505,response||null);
	},
	
	/**
	 * @event xxx
	 * Fired on every HTTP response.
	 */
	onXXX: function(code,response){
		this.emit('xxx',{code:code,response:(response||null)});
	}
	
});

module.exports = Class;
