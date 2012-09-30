var Base		= require('../core/Server'),
	send 		= require('send'),
	http 		= require('http'),
	url			= require('url');

/**
 * @class NGN.web.Static
 * Provides a simple web server capable of serving static files (HTML, CSS, etc) only. This
 * does not provide any kind of dynamic rendering (templates) or server side logic. For that,
 * NGN.web.Server is a more appropriate fit (which can also serve static files). 
 * 
 * The static server, based on the (send)[https://github.com/visionmedia/send] module does not 
 * provide file compression or any internal caching. As the author of _send_ indicates, sites
 * large enough to warrant caching are better supported with a CDN or reverse proxy.
 * @docauthor Corey Butler
 * @extends NGN.core.HttpServer
 * @requires http
 * @requires url
 * @requires send
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a HTTP/S server.
	 */
	constructor: function(config){
		
		var me = this;
		
		config = config || {};
		config.type = 'HTTP';
		config.purpose = 'WWW';

		Class.super.constructor.call( this, config );
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String}
			 * Path to root directory where static assets are stored.
			 * @required 
			 */
			root: {
				value:		__NGN.path.normalize(config.root),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Number} [maxAssetAge=3600]
			 * The maximum age of an specific asset in seconds. 
			 * 
			 * * 1 Hour: 3600
			 * * 1 Year: 31557600000
			 */
			maxAssetAge: {
				value:		config.maxAssetAge || 3600,
				enumerable:	true,
				writable:	true
			},

			/**
			 * @cfg {String} [index=index.html]
			 * The default file when no filename is explicitly defined in the URL.
			 */
			index: {
				value:		config.index || 'index.html',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Function}
			 * Provide a function for error processing. The default is:
			 * 		function(err,_res) {
			 *    		_res.statusCode = err.status || 500;
    		 *			_res.end(err.message);
			 *		}
			 * 
			 */
			errorProcessor: {
				value:		config.errorProcessor || function(err,_res) {
													    _res.statusCode = err.status || 500;
													    if (_res.statusCode == 404)
													    	_res.end();
													    else
														    _res.end('An error occurred.');
													 },
				enumerable:	false,
				writable:	true
			},
			
			_server: {
				value:		null,
				enumerable:	false,
				writable:	true
			}

		});
		
		var me	 = this;
		
		this.on('requestend',function(res){
			me['on'+res.statusCode](res);
		});
			
		this._server = http.createServer(function(req,res){
			
			// Custom directory handling logic:
			function redirect() {
			    res.statusCode = 301;
			    res.setHeader('Location', req.url + '/');
			    res.end('Redirecting to ' + req.url + '/');
			}
			
			function procError(err){
				me.errorProcessor(err,res);
			}
			
			send(req, url.parse(req.url).pathname)
			  .from(me.root)
			  .maxage(me.maxAssetAge)
			  .on('error', procError)
			  .on('directory', redirect)
			  .on('stream',me.onRequestStart)
			  .on('end',me.onRequestEnd)
			  .pipe(res);
		});
	
		this.on('start',function(){
			me.onReady();
		});
		
		if (this.autoStart)
			this.start();
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
			this._server.close();
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
	},
	
	/**
     * @event requeststart
     * Fired when a request starts.
     */
    onRequestStart: function(req){
    	this.emit('requeststart',req||null);
    },
    
    /**
     * @event requestend
     * Fired just before the request ends
     */
    onRequestEnd: function(req,res){
    	this.emit('requestend',{request:req||null,response:res||null});
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
	 * @event beforerequest
	 * @param {Object} req
	 * Request stream object.
	 */
	onBeforeRequest: function(req){
		this.emit('beforerequest',req||null);
	},
	
	/**
	 * @event afterrequest
	 * @param {Object} req
	 * Request stream object.
	 */
	onAfterRequest: function(req){
		this.emit('afterrequest',req);
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