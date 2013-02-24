var fs			= require('fs'),
	Base		= require('../NGN.core');

/**
 * @class NGN.core.HttpClient
 * A base class for HTTP operations. This provides common functionality to NGN.http.Client,
 * NGN.http.JsonClient, etc.
 * 
 * This is a utility class not designed for direct use. It is meant to be extended by HTTP clients.
 * @private
 * @extends NGN.core
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a TCP client.
	 */
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call( this, config );
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [userAgent=node.js]
			 * A custom user agent string to use when making requests.
			 */
			userAgent: {
				value:		config.appAgent || 'node.js',
				enumerable:	true,
				writable:	true
			}
			
		});

	},
	
	// The following must be overridden
	/**
	 * @method
	 * Execute a `GET`.
	 */
	get: function(){},
	
	/**
	 * @method
	 * Execute a `PUT`.
	 */
	put: function(){},
	
	/**
	 * @method
	 * Execute a `POST`.
	 */
	post:function(){},
	
	/**
	 * @method
	 * Execute a `DELETE`.
	 */
	del: function(){},
	
	/**
	 * @method
	 * Execute a `HEAD`.
	 */
	head:function(){},
	
	/**
	 * @method
	 * Execute a `TRACE`.
	 */
	trace:function(){},
	
	/**
	 * @method GET
	 * Fire the #beforeget event, then execute #get.
	 */
	GET: function() {
		this.onBeforeGet();
		this.get.apply(this,arguments);
	},
	
	/**
	 * @method
	 * Fire the #beforeput event, then execute #put
	 */
	PUT: function() {
		this.onBeforePut()
		this.put.apply(this,arguments);
	},
	
	/**
	 * @method
	 * Fire the #beforepost event, then execute #post.
	 */
	POST: function() {
		this.onBeforePost();
		this.post.apply(this,arguments);
	},
	
	/**
	 * @method
	 * Fire the #beforedelete event, then execute #del
	 */
	DEL: function() {
		this.onBeforeDelete();
		this.del.apply(this,arguments);
	},
	
	/**
	 * @method
	 * Fire the #beforehead event, then execute #head 
	 */
	HEAD: function() {
		this.onBeforeHead();
		this.head.apply(this,arguments);
	},
	
	/**
	 * @method
	 * Fire the #beforetrace event, then execute #trace 
	 */
	TRACE: function() {
		this.onBeforeHead();
		this.head.apply(this,arguments);
	},
	
	/**
	 * @event beforeget
	 * Fired before a `GET` request. 
	 */
	onBeforeGet: function() {
		this.emit('beforeget',this);
	},
	
	/**
	 * @event beforeput
	 * Fired before a `PUT` request. 
	 */
	onBeforePut: function() {
		this.emit('beforeput',this);
	},
	
	/**
	 * @event beforepost
	 * Fired before a `POST` request 
	 */
	onBeforePost: function() {
		this.emit('beforepost',this);
	},
	
	/**
	 * @event beforedelete
	 * Fired before a `DELETE` request. 
	 */
	onBeforeDelete: function() {
		this.emit('beforedelete',this);
	},
	
	/**
	 * @event beforehead
	 * Fired before a `HEAD` request. 
	 */
	onBeforeHead: function() {
		this.emit('beforehead',this)
	},
	
	/**
	 * @event send
	 * Fired when a response is sent to the client.
	 * @returns {Object} responseStream
	 */
	onReceive: function() {
		this.emit('receive',response||null);
	},
	
	/**
	 * @event GET
	 * Fired when the client completes a GET request
	 */
	onGet: function(req,res) {
		thie.emit('GET',{req:req,res:res});
	},
	
	/**
	 * @event POST
	 * Fired when the client completes a GET request
	 */
	onPost: function(obj) {
		this.emit('POST',{req:req,res:res})
	},
	
	/**
	 * @event PUT
	 * Fired when the client completes a PUT request
	 */
	onPut: function(obj) {
		this.emit('PUT',{req:req,res:res})
	},
	
	/**
	 * @event DELETE
	 * Fired when the client completes a DELETE request
	 */
	onDelete: function(obj) {
		this.emit('DELETE',{req:req,res:res})
	},
	
	/**
	 * @event HEAD
	 * Fired when the client completes a HEAD request
	 */
	onHead: function(obj) {
		this.emit('HEAD',{req:req,res:res})
	},
	
	/**
	 * @event TRACE
	 * Fired when the client completes a TRACE request
	 */
	onTrace: function(obj) {
		this.emit('TRACE',{req:req,res:res})
	},
	
	onOptions: function(obj) {
		this.emit('OPTIONS',{req:req,res:res})
	},
	
	/**
	 * @event 1xx
	 * Fired on every HTTP 100-level response.
	 */
	on1xx: function(code,response){
		this.emit('1xx',{code:code,response:(response||null)});
		this.onXXX(code);
	},
	
	/**
	 * @event 100
	 * Fired on HTTP Status Code 100
	 */
	on100: function(response) {
		this.emit('100',{code:100,response:(response||null)});
		this.on1xx(100);
	},
	
	/**
	 * @event 101
	 * Fired on HTTP Status Code 101
	 */
	on101: function(response){
		this.emit('101',{code:101,response:(response||null)});
		this.on1xx(101);
	},
	
	
	/**
	 * @event 2xx
	 * Fired on every HTTP 200-level response.
	 */
	on2xx: function(code,response){
		this.emit('2xx',{code:code,response:(response||null)});
		this.onXXX(code);
	},
	
	/**
	 * @event 200
	 * Fired on HTTP Status Code 200
	 */
	on200: function(response){
		this.emit('200',{code:200,response:(response||null)});
		this.on2xx(200);
	},
	
	/**
	 * @event 201
	 * Fired on HTTP Status Code 201
	 */
	on201: function(response){
		this.emit('201',{code:201,response:(response||null)});
		this.on2xx(201);
	},
	
	/**
	 * @event 202
	 * Fired on HTTP Status Code 202
	 */
	on202: function(response){
		this.emit('202',{code:202,response:(response||null)});
		this.on2xx(202);
	},
	
	/**
	 * @event 203
	 * Fired on HTTP Status Code 203
	 */
	on203: function(response){
		this.emit('203',{code:203,response:(response||null)});
		this.on2xx(203);
	},
	
	/**
	 * @event 204
	 * Fired on HTTP Status Code 204
	 */
	on204: function(response){
		this.emit('204',{code:204,response:(response||null)});
		this.on2xx(204);
	},
	
	/**
	 * @event 205
	 * Fired on HTTP Status Code 205
	 */
	on205: function(response){
		this.emit('205',{code:205,response:(response||null)});
		this.on2xx(205);
	},
	
	/**
	 * @event 206
	 * Fired on HTTP Status Code 206
	 */
	on206: function(response){
		this.emit('206',{code:206,response:(response||null)});
		this.on2xx(206);
	},
	
	/**
	 * @event 3xx
	 * Fired on every HTTP 300-level response.
	 */
	on3xx: function(code,response){
		this.emit('3xx',{code:code,response:(response||null)});
		this.onXXX(code);
	},
	
	/**
	 * @event 300
	 * Fired on HTTP Status Code 300
	 */
	on300: function(response){
		this.emit('300',{code:300,response:(response||null)});
		this.on3xx(300);
	},
	
	/**
	 * @event 301
	 * Fired on HTTP Status Code 301
	 */
	on301: function(response){
		this.emit('301',{code:301,response:(response||null)});
		this.on3xx(301);
	},
	
	/**
	 * @event 302
	 * Fired on HTTP Status Code 302
	 */
	on302: function(response){
		this.emit('302',{code:302,response:(response||null)});
		this.on3xx(302);
	},
	
	/**
	 * @event 303
	 * Fired on HTTP Status Code 303
	 */
	on303: function(response){
		this.emit('303',{code:303,response:(response||null)});
		this.on3xx(303);
	},
	
	/**
	 * @event 304
	 * Fired on HTTP Status Code 304
	 */
	on304: function(response){
		this.emit('304',{code:304,response:(response||null)});
		this.on3xx(304);
	},
	
	/**
	 * @event 305
	 * Fired on HTTP Status Code 305
	 */
	on305: function(response){
		this.emit('305',{code:305,response:(response||null)});
		this.on3xx();
	},
	
	/**
	 * @event 306
	 * Fired on HTTP Status Code 306
	 */
	on306: function(response){
		this.emit('306',{code:306,response:(response||null)});
		this.on3xx(306);
	},
	
	/**
	 * @event 307
	 * Fired on HTTP Status Code 307
	 */
	on307: function(response){
		this.emit('307',{code:307,response:(response||null)});
		this.on3xx(307);
	},
	
	/**
	 * @event 4xx
	 * Fired on every HTTP 400-level response.
	 */
	on4xx: function(code,response){
		this.emit('4xx',{code:code,response:(response||null)});
		this.onXXX(code);
	},
	
	/**
	 * @event 400
	 * Fired on HTTP Status Code 400
	 */
	on400: function(response){
		this.emit('400',{code:400,response:(response||null)});
		this.on4xx(400);
	},
	
	/**
	 * @event 401
	 * Fired on HTTP Status Code 401
	 */
	on401: function(response){
		this.emit('401',{code:401,response:(response||null)});
		this.on4xx(401);
	},
	
	/**
	 * @event 402
	 * Fired on HTTP Status Code 402
	 */
	on402: function(response){
		this.emit('402',{code:402,response:(response||null)});
		this.on4xx(402);
	},
	
	/**
	 * @event 403
	 * Fired on HTTP Status Code 403
	 */
	on403: function(response){
		this.emit('403',{code:403,response:(response||null)});
		this.on4xx(403);
	},
	
	/**
	 * @event 404
	 * Fired on HTTP Status Code 404
	 */
	on404: function(response){
		this.emit('404',{code:404,response:(response||null)});
		this.on4xx(404);
	},
	
	/**
	 * @event 405
	 * Fired on HTTP Status Code 405
	 */
	on405: function(response){
		this.emit('405',{code:405,response:(response||null)});
		this.on4xx(405);
	},
	
	/**
	 * @event 406
	 * Fired on HTTP Status Code 406
	 */
	on406: function(response){
		this.emit('406',{code:406,response:(response||null)});
		this.on4xx(406);
	},
	
	/**
	 * @event 407
	 * Fired on HTTP Status Code 407
	 */
	on407: function(response){
		this.emit('407',{code:407,response:(response||null)});
		this.on4xx(407);
	},
	
	/**
	 * @event 408
	 * Fired on HTTP Status Code 408
	 */
	on408: function(response){
		this.emit('408',{code:408,response:(response||null)});
		this.on4xx(408);
	},
	
	/**
	 * @event 409
	 * Fired on HTTP Status Code 409
	 */
	on409: function(response){
		this.emit('409',{code:409,response:(response||null)});
		this.on4xx(409);
	},
	
	/**
	 * @event 410
	 * Fired on HTTP Status Code 410
	 */
	on410: function(response){
		this.emit('410',{code:410,response:(response||null)});
		this.on4xx(410);
	},
	
	/**
	 * @event 411
	 * Fired on HTTP Status Code 411
	 */
	on411: function(response){
		this.emit('411',{code:411,response:(response||null)});
		this.on4xx(411);
	},
	
	/**
	 * @event 412
	 * Fired on HTTP Status Code 412
	 */
	on412: function(response){
		this.emit('412',{code:412,response:(response||null)});
		this.on4xx(412);
	},
	
	/**
	 * @event 413
	 * Fired on HTTP Status Code 413
	 */
	on413: function(response){
		this.emit('413',{code:413,response:(response||null)});
		this.on4xx(413);
	},
	
	/**
	 * @event 414
	 * Fired on HTTP Status Code 414
	 */
	on414: function(response){
		this.emit('414',{code:414,response:(response||null)});
		this.on4xx(414);
	},
	
	/**
	 * @event 415
	 * Fired on HTTP Status Code 415
	 */
	on415: function(response){
		this.emit('415',{code:415,response:(response||null)});
		this.on4xx(415);
	},
	
	/**
	 * @event 416
	 * Fired on HTTP Status Code 416
	 */
	on416: function(response){
		this.emit('416',{code:416,response:(response||null)});
		this.on4xx(416);
	},
	
	/**
	 * @event 417
	 * Fired on HTTP Status Code 417
	 */
	on417: function(response){
		this.emit('417',{code:417,response:(response||null)});
		this.on4xx(417);
	},
	
	/**
	 * @event 5xx
	 * Fired on every HTTP 500-level response.
	 */
	on5xx: function(code,response){
		this.emit('5xx',{code:code,response:(response||null)});
		this.onXXX(code);
	
	},
	
	/**
	 * @event 500
	 * Fired on HTTP Status Code 500
	 */
	on500: function(response){
		this.emit('500',{code:500,response:(response||null)});
		this.on5xx(500);
	},
	
	/**
	 * @event 501
	 * Fired on HTTP Status Code 501
	 */
	on501: function(response){
		this.emit('501',{code:501,response:(response||null)});
		this.on5xx(501);
	},
	
	/**
	 * @event 502
	 * Fired on HTTP Status Code 502
	 */
	on502: function(response){
		this.emit('502',{code:502,response:(response||null)});
		this.on5xx(502);
	},
	
	/**
	 * @event 503
	 * Fired on HTTP Status Code 503
	 */
	on503: function(response){
		this.emit('503',{code:503,response:(response||null)});
		this.on5xx(503);
	},
	
	/**
	 * @event 504
	 * Fired on HTTP Status Code 504
	 */
	on504: function(response){
		this.emit('504',{code:504,response:(response||null)});
		this.on5xx(504);
	},
	
	/**
	 * @event 505
	 * Fired on HTTP Status Code 505
	 */
	on505: function(response){
		this.emit('505',{code:505,response:(response||null)});
		this.on5xx(505);
	},
	
	/**
	 * @event xxx
	 * Fired on every HTTP response.
	 */
	onXXX: function(code,response){
		this.emit('xxx',{code:code,response:(response||null)});
		this.onReceive(response);
	}

});

module.exports = Class;