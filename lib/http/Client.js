var fs			= require('fs'),
	request		= require('request'),
	Base			= require('../NGN.Base');

/**
 * @class NGN.http.Client
 * Provides a standard HTTP request interface for making requests over HTTP/S.  
 * 
 * This is based on the [request](https://github.com/mikeal/request) module from [Mikeal Rogers](http://www.mikealrogers.com).
 * 
 * 	   @example
 * 	   var client = new NGN.http.Client();
 * 		
 *     client.GET('http://www.google.com',function(error, response, body) {
 * 			if (!error && response.statusCode == 200) {
 *   				console.log(body) // Print the google web page.
 * 			}
 *     });
 * 
 * Requests 
 * 
 * @docauthor Corey Butler
 * @extends NGN.Base
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a HTTP request client.
	 */
	constructor: function(){
		
		Class.super.constructor.call( this, {} );
		
		// Merge request module
		this.merge(request);
		
		// Object.defineProperties(this,{
		// });
		
		this.addEventListeners([
			'BeforeGet',
			'BeforePost',
			'BeforePut',
			'BeforeDelete',
			'BeforeHead',
			'BeforeDownload',
			'1xx','100','101','102',
			'2xx','200','201','202','203','204','205','206',
			'3xx','300','301','302','303','304','305','306','307',
			'4xx','400','401','402','403','404','405','406','407',
			'408','409','410','411','412','413','414','415','416','417',
			'5xx','500','501','502','503','504','505',
			'xxx'
		]);
	
	},
		
	/**
	 * @method
	 * Execute a `GET` request.
	 * @param {Object} [options]
	 * Documentation copied from [request module documentation](https://github.com/mikeal/request#requestoptions-callback).
	 * 
	 * * The first argument can be either a url or an options object. The only required option is uri, all others are optional.
	 * * `uri` || `url` - fully qualified uri or a parsed url object from url.parse()
	 * * `qs` - object containing querystring values to be appended to the uri
	 * * `method` - http method, defaults to GET
	 * * `headers` - http headers, defaults to {}
	 * * `body` - entity body for POST and PUT requests. Must be buffer or string.
	 * * `form` - sets `body` but to querystring representation of value and adds `Content-type: application/x-www-form-urlencoded; charset=utf-8` header.
	 * * `json` - sets `body` but to JSON representation of value and adds `Content-type: application/json` header.
	 * * `multipart` - (experimental) array of objects which contains their own headers and `body` attribute. Sends `multipart/related` request. See example below.
	 * * `followRedirect` - follow HTTP 3xx responses as redirects. defaults to true.
	 * * `followAllRedirects` - follow non-GET HTTP 3xx responses as redirects. defaults to false.
	 * * `maxRedirects` - the maximum number of redirects to follow, defaults to 10.
	 * * `encoding` - Encoding to be used on `setEncoding` of response data. If set to `null`, the body is returned as a Buffer.
	 * * `pool` - A hash object containing the agents for these requests. If omitted this request will use the global pool which is set to node's default maxSockets.
	 * * `pool.maxSockets` - Integer containing the maximum amount of sockets in the pool.
	 * * `timeout` - Integer containing the number of milliseconds to wait for a request to respond before aborting the request	
	 * * `proxy` - An HTTP proxy to be used. Support proxy Auth with Basic Auth the same way it's supported with the `url` parameter by embedding the auth info in the uri.
	 * * `oauth` - Options for OAuth HMAC-SHA1 signing, see documentation above.
	 * * `strictSSL` - Set to `true` to require that SSL certificates be valid. Note: to use your own certificate authority, you need to specify an agent that was created with that ca as an option.
	 * * `jar` - Set to `false` if you don't want cookies to be remembered for future use or define your custom cookie jar (see examples section)
	 * 
	 * @param {Function} [callback]
	 * Documentation copied from [request module documentation](https://github.com/mikeal/request#requestoptions-callback).
	 * The callback argument gets 3 arguments. The first is an error when applicable (usually from the http.Client option not the http.ClientRequest object). The second in an http.ClientResponse object. The third is the response body String or Buffer.
	 */
	GET: function() {
		this.fireEvent('beforeget');
		this.get.apply(this,arguments);
	},
	
	/**
	 * @method
	 * Execute a `PUT` request.
	 * @param {Object} [options]
	 * See #get options.
	 * @param {Function} [callback]
	 * See #get callback.
	 */
	PUT: function() {
		this.fireEvent('beforeput');
		this.put.apply(this,arguments);
	},
	
	/**
	 * @method 
	 * Execute a `POST` request.
	 * @param {Object} [options]
	 * See #get options.
	 * @param {Function} [callback]
	 * See #get callback.
	 */
	POST: function() {
		this.fireEvent('beforepost');
		this.post.apply(this,arguments);
	},
	
	/**
	 * @method 
	 * Execute a `DELETE` request.
	 */
	DEL: function() {
		this.fireEvent('beforedelete');
		this.del.apply(this,arguments);
	},
	
	/**
	 * @method 
	 * Execute a `HEAD` request.
	 */
	HEAD: function() {
		this.fireEvent('beforehead');
		this.head.apply(this,arguments);
	},
	
	/**
	 * @method
	 * Not currently implemented.
	 * @param {String} source
	 * The absolute path of the file or directory on the server from which the file(s) will be uploaded.
	 * @param {String} uri
	 * The destination URI where the file(s) will be delivered.
	 */
	upload: function(source,uri) {
		
	},
	
	/**
	 * @method
	 * Download/`GET` a file from a remote URL/URI. 
	 * 
	 * **Usage**
	 * 		var client = new NGN.http.Client();
	 * 
	 * 		client.download('http://www.google.com/logo.jpg','/path/to/image.jpg','overwrite');
	 *  
	 * This method instructs the client to utilize the [streaming](https://github.com/mikeal/request#streaming) 
	 * capabilities of the request module. It will automatically open a write stream to create
	 * the file. The `conflict` argument dictates what happens if the specified file already exists.
	 * @param {String} url
	 * The URL of the resource to download.
	 * @param {String} path
	 * The absolute path of the directory on the local file system where the file will be saved. This may
	 * be something like `/path/to/files` or `C:\Users\username\Downloads`.
	 * @param {String} [conflict=error]
	 * Dictates what happen when the specified file conflicts with an existing file of the same name.
	 * Optional values are:
	 * 
	 * * `error` The file is not saved and an error is thrown. This aborts the request.
	 * * `skip` The file is not saved and no error is thrown.
	 * * `overwrite` The existing file will be overwritten.
	 * * `append` The existing file will be appended with the new content.
	 * * `unique` A new file name will be created. For example, if `/path/to/image.jpg` already exists,
	 * the content will instead be written to `/path/to/image1.jpg`.
	 * @param {Function} [callback]
	 * The callback is passed a two arguments, a {@link Boolean} indicating `success` and
	 * the `filepath`.
	 * 
	 * 		var client = new NGN.http.Client();
	 * 
	 * 		var handleResponse = function(success, filepath) {
	 * 			if (success)
	 * 				console.log('File Saved!', filepath);
	 * 			else
	 * 				console.log('File Not Saved!');
	 * 		}
	 * 
	 * 		client.GET('http://www.google.com/logo.jpg').saveAs('/path/to/image.jpg','unique',handleResponse);
	 * 	
	 * The `filepath` is `null` if `conflict` is either `error` or `skip`.
	 */
	download: function(url, path, conflict, callback) {
		
		var me = this;
		
		callback = callback || function(){};
		if (typeof conflict === 'function'){
			callback = conflict;
			conflict = 'error';
		}
		
		// Check to see if the file already exists
		var file = path+'/'+this.getFileFromPath(url);
		
		this.fireEvent('beforedownload');
		fs.exists(file,function(exists){
			if (!exists){
				try {
					fs.createWriteStream(file).pipe(this.GET(url));
					me.fireEvent('afterdownload',true,file);
					callback(true,file);
				} catch (e) {
					callback(false);
					me.fireError(e);
				}
			} else {
				switch(conflict.trim().toLowerCase()){
					case 'overwrite':
						try {
							fs.createWriteStream(file).pipe(this.GET(url));
							me.fireEvent('afterdownload',true,file);
							callback(true,file);
						} catch (e) {
							callback(false);
							me.fireError(e);
						}
						break;
					case 'append':
						try {
							fs.createWriteStream(file,{flags:'r+'}).pipe(this.GET(url));
							me.fireEvent('afterdownload',true,file);
							callback(true,file);
						} catch (e) {
							callback(false);
							me.fireError(e);
						}
						break;
					case 'skip':
						callback(false);
						break;
					case 'unique':
						var fnm = this.getFileFromPath(url).split('.'),
							ext = fnm[fnm.length-1];
							
						fnm.pop();
						
						var base = fnm.join('.'),
							ct	 = 1;
							
						var nm = base+ct+'.'+ext;
						
						while(fs.existsSync(path+'/'+nm)){
							ct++;
							nm = base+ct+'.'+ext;
						}
						
						try {
							fs.createWriteStream(path+'/'+nm).pipe(this.GET(url));
							me.fireEvent('afterdownload',true,path+'/'+nm);
							callback(true,path+'/'+nm);
						} catch (e) {
							callback(false);
							me.fireError(e);
						}
						
						break;
					default:
						callback(false);
						me.fireError('Download failed. File already exists');
						break;
						
				}
			}
		});
	},
	
	/**
	 * @event beforeget
	 * Fired before a `GET` request. 
	 */
	onBeforeGet: function(){},
	
	/**
	 * @event beforeput
	 * Fired before a `PUT` request. 
	 */
	onBeforePut: function(){},
	
	/**
	 * @event beforepost
	 * Fired before a `POST` request 
	 */
	onBeforePost: function(){},
	
	/**
	 * @event beforedelete
	 * Fired before a `DELETE` request. 
	 */
	onBeforeDelete: function(){},
	
	/**
	 * @event beforehead
	 * Fired before a `HEAD` request. 
	 */
	onBeforeHead: function(){},
	
	/**
	 * @event beforedownload
	 * Fired before a download begins. 
	 */
	onBeforeDownload: function(){},
	
	/**
	 * @event 1xx
	 * Fired on every HTTP 100-level response.
	 */
	on1xx: function(){},
	
	/**
	 * @event 100
	 */
	on100: function(){},
	
	/**
	 * @event 101
	 */
	on101: function(){},
	
	
	/**
	 * @event 2xx
	 * Fired on every HTTP 200-level response.
	 */
	on2xx: function(){},
	
	/**
	 * @event 200
	 */
	on200: function(){},
	
	/**
	 * @event 201
	 */
	on201: function(){},
	
	/**
	 * @event 202
	 */
	on202: function(){},
	
	/**
	 * @event 203
	 */
	on203: function(){},
	
	/**
	 * @event 204
	 */
	on204: function(){},
	
	/**
	 * @event 205
	 */
	on205: function(){},
	
	/**
	 * @event 206
	 */
	on206: function(){},
	
	/**
	 * @event 3xx
	 * Fired on every HTTP 300-level response.
	 */
	on3xx: function(){},
	
	/**
	 * @event 300
	 */
	on300: function(){},
	
	/**
	 * @event 301
	 */
	on301: function(){},
	
	/**
	 * @event 302
	 */
	on302: function(){},
	
	/**
	 * @event 303
	 */
	on303: function(){},
	
	/**
	 * @event 304
	 */
	on304: function(){},
	
	/**
	 * @event 305
	 */
	on305: function(){},
	
	/**
	 * @event 306
	 */
	on306: function(){},
	
	/**
	 * @event 307
	 */
	on307: function(){},
	
	/**
	 * @event 4xx
	 * Fired on every HTTP 400-level response.
	 */
	on4xx: function(){},
	
	/**
	 * @event 400
	 */
	on400: function(){},
	
	/**
	 * @event 401
	 */
	on401: function(){},
	
	/**
	 * @event 402
	 */
	on402: function(){},
	
	/**
	 * @event 403
	 */
	on403: function(){},
	
	/**
	 * @event 404
	 */
	on404: function(){},
	
	/**
	 * @event 405
	 */
	on405: function(){},
	
	/**
	 * @event 406
	 */
	on406: function(){},
	
	/**
	 * @event 407
	 */
	on407: function(){},
	
	/**
	 * @event 408
	 */
	on408: function(){},
	
	/**
	 * @event 409
	 */
	on409: function(){},
	
	/**
	 * @event 410
	 */
	on410: function(){},
	
	/**
	 * @event 411
	 */
	on411: function(){},
	
	/**
	 * @event 412
	 */
	on412: function(){},
	
	/**
	 * @event 413
	 */
	on413: function(){},
	
	/**
	 * @event 414
	 */
	on414: function(){},
	
	/**
	 * @event 415
	 */
	on415: function(){},
	
	/**
	 * @event 416
	 */
	on416: function(){},
	
	/**
	 * @event 417
	 */
	on417: function(){},
	
	/**
	 * @event 5xx
	 * Fired on every HTTP 500-level response.
	 */
	on5xx: function(){},
	
	/**
	 * @event 500
	 */
	on500: function(){},
	
	/**
	 * @event 501
	 */
	on501: function(){},
	
	/**
	 * @event 502
	 */
	on502: function(){},
	
	/**
	 * @event 503
	 */
	on503: function(){},
	
	/**
	 * @event 504
	 */
	on504: function(){},
	
	/**
	 * @event 505
	 */
	on505: function(){},
	
	/**
	 * @event xxx
	 * Fired on every HTTP response.
	 */
	onXXX: function(){}
	
});



// Create a module out of this.
module.exports = Class;
