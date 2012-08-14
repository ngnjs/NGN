var Base	= require('../core/Server'),
	http	= require('http'),
	https	= require('https'),
	prx		= require('http-proxy'),
	fs		= require('fs');

/**
 * @class NGN.web.Proxy
 * A simple reverse proxy server, based on [http-proxy](https://github.com/nodejitsu/node-http-proxy).
 * 
 * The http-proxy module provides a number of well-tested base features, including websocket support. In addition
 * to these features, the NGN simple reverse proxy adds the following:
 * 
 * * Multiple Virtual Hosts (NGN.web.proxy.VirtualHost).
 * * Virtual Host Aliasing.
 * * Simple Round-Robin Load Balancing.
 * * URL Rewriting (NGN.web.proxy.RewriteRule) using RegExp.
 * * Hot-loading: Add aliases, load balancing, virtual hosts, & rewrite rules (no restart required).
 * 
 * The proxy server is designed to be extended. The NGNX library provides several examples. 
 * NGNX.web.Proxy adds support for local and remote JSON configuration files & caching. 
 * NGNX.web.proxy.Controller provides a REST interface for managing the configuration in real-time.
 * 
 * @extends NGN.core.Server
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new proxy server.
	 */
	constructor: function(config) {
    	
    	config = config || {};
		
		config.type = 'HTTP';
		config.purpose = 'REVERSEPROXY';
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [cache]
			 * The path to the `cache.json` file. This can also be a URL
			 * that returns a JSON configuration object.
			 */
			/**
			 * @property {Object} [_cache=null]
			 * The configuration held in memory.
			 * @private
			 */
			_cache: {
				value:		config.cache || null,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {Object} [server={}]
			 * The raw proxy server object.
			 * This is initialized when the proxy server is started and destroyed when it is stopped.
			 * @readonly 
			 */
			server: {
				value:		{},
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @property {Object} [vhost={}]
			 * The virtual hosts supported by this server.
			 * @private
			 * @readonly
			 */
			vhost: {
				value:		{},
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {Boolean} [ready=false]
			 * Indicates the proxy is ready to process requests.
			 * @readonly
			 */
			ready: {
				value:		false,
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {Array} [portsInUse=[]]
			 * An array of unique ports in use.
			 * @readonly
			 */
			portsInUse: {
				value:		[],
				enumerable:	true,
				writable:	true
			}
			
		});
		
	},
	
	/**
	 * @method
	 * Remove a virtual host from the proxy.
	 * @param {String} hostname
	 * The hostname to proxy.
	 * @param {Number} port
	 * The port number relevant to the hostname.
	 */
	removeVirtualHost: function(host,port) {
		try {
			delete this.vhost[port][host]
		} catch (e) {
			console.log(e);
		}
	},
	
	/**
	 * @method
	 * Add a virtual host to the proxy router.
	 * If the virtual host already exists, it will be overwritten.
	 * @param {String} hostname
	 * The hostname to proxy.
	 * @param {Number} port
	 * The port number relevant to the hostname.
	 */
	addVirtualHost: function(obj) {
		obj = obj || {};
		
		var _rules = obj.rules || {};
		
		if (obj.rules)
			delete obj.rules;
		
		this.vhost[obj.port] = this.vhost[obj.port] || {};
		this.vhost[obj.port][obj.hostname] = new __NGN.web.proxy.VirtualHost(obj);
		
		for (var method in _rules) {
			for (var rule in _rules[method]){
				if (_rules[method].hasOwnProperty(rule)){
					for (var rl in _rules[method][rule]){
						if (_rules[method][rule].hasOwnProperty(rl)){
							var sub = 	_rules[method][rule][rl].substr(_rules[method][rule][rl].length-5,5) == '-last' 
										? _rules[method][rule][rl].substr(0,_rules[method][rule][rl].length-5) 
										: _rules[method][rule][rl];
							this.vhost[obj.port][obj.hostname].addRewriteRule(method,new RegExp(rl),sub);
						}
					}
				}
			}
		}
	},
	
	
	
	/**
	 * @method
	 * Return a virtual host by it's alias.
	 * @param {Number} port (required)
	 * The port number on which the virtual host is active.
	 * @param {String} alias (required)
	 * The alias hostname.
	 * @returns {NGN.web.proxy.VirtualHost}
	 */
	getVirtualHostByAlias: function(port,alias) {
		if (this.vhost[port] == undefined)
			return null;
		for(var h in this.vhost[port]){
			if (this.vhost[port][h].isAlias(alias))
				return this.vhost[port][h];
		}
		return null;
	},
	
	/**
	 * @method
	 * Start the server.
	 */
	start: function() {
		
		if (this.ready) {

			var me = this;
			
			for (var p=0;p<this._cache.cache.length;p++) {
				var h = me._cache.cache[p];
				var port = h.port;
				
				this.server[port] = prx.createServer({source:{host:this._cache.cache[p].hostname,port:port}},function(_req,_res,proxy){
					
					// Parse the URL Request
					var url		= require('url').parse('http'+(h.ssl==undefined?'':'s')+'://'+_req.headers.host+':'+port+_req.url);
		
					// If the host deos not exist, look for aliases
					var vh = me.vhost[port][url.hostname] || me.getVirtualHostByAlias(port,url.hostname);
					
					if (!vh) {
						console.log('No virtualhost!'.red);
						_res.writeHead(502);
	  					_res.end();
						return;
					}
					
					var target 	= vh.getTarget(_req),
						dest = require('url').parse('http'+(h.ssl == undefined ? '' : 's')+'://'+target);
					
					proxy.proxyRequest(_req,_res,{
						host:	dest.hostname,
						port:	parseInt(dest.port||(h.ssl==undefined?80:443)),
						buffer:	prx.buffer(_req)
					});
					
				});
				
				// Websocket Support
				this.server[port].proxy.on('upgrade',function(req, socket, head){
					console.log('Connection Upgrade: WebSockets'.green);
					me.server[port].proxy.proxyWebSocketRequest(req, socket, head);
				});
				
				this.server[port].proxy.on('end',function(){
					me.onProxy();
				});

				this.server[port].listen(port,function(){
					me.onProxyReady(this.proxy.source.port);
				});

			}
		}
	},
	
	/**
	 * @method
	 * Stop the server.
	 */
	stop: function() {
		this.server.close();
		this.onStop();
	},
	
	/**
	 * @event proxy
	 * Fired when a request is successfully proxied.
	 * @param {Object} meta
	 * Metadata passed by the proxy server.
	 */
	onProxy: function(meta){
		this.emit('proxy',meta||null);
	},
	
	/**
	 * @event available
	 * Fired when a proxy server is ready for processing.
	 */
	onProxyReady: function(port) {
		this.portsInUse.push(port)
		this.emit('available',port);
	},
	
	/**
	 * @event ready
	 * Fired when the proxy is ready for processing.
	 */
	onReady: function() {
		this.ready = true;
		this.emit('ready');
	}
	
});

module.exports = Class;