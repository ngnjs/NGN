var Base	= require('../core/Server'),
  	http	= require('http'),
  	https	= require('https'),
  	prx		= require('http-proxy'),
  	fs		= require('fs');

/**
 * @class NGN.http.Proxy
 * A simple reverse proxy server, based on [http-proxy](https://github.com/nodejitsu/node-http-proxy).
 * 
 * The http-proxy module provides a number of well-tested base features, including websocket support. In addition
 * to these features, the NGN simple reverse proxy adds the following:
 * 
 * * Multiple Virtual Hosts (NGN.http.proxy.VirtualHost).
 * * Virtual Host Aliasing.
 * * Simple Round-Robin Load Balancing.
 * * URL Rewriting (NGN.http.proxy.RewriteRule) using RegExp.
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
	 * Retrieve a specific virtual host.
	 * @param {String} hostname
	 * @param {Number} port
	 * @returns {NGN.http.proxy.VirtualHost} 
	 */
	getVirtualHost: function(hostname,port) {
		port = port || 80;
		return this.vhost[port][hostname.toLowerCase()];
	},
	
	/**
	 * @method
	 * Retrieve all of the virtual host objects
	 * @returns {Array}
	 */
	getVirtualHosts: function() {
		var rt = [];
		for (var vh in this.vhost)
			rt = rt.concat(this.vhost[vh])
		return rt;
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
		
		var old = __NGN.clone(this.vhost,true);
		this.onBeforeChange({
			type: 'virtualhost::delete',
			was: old,
		});	
		
		try {
			delete this.vhost[port][host.toLowerCase()]
		
			this.onChange({
				type: 'virtualhost::delete',
				was: old,
				is: this.vhost
			});
		} catch (e) {
			console.log(e);
		}
	},
	
	/**
	 * @method
	 * Add a virtual host to the proxy router.
	 * If the virtual host already exists, it will be overwritten.
	 * @param {Object} config
	 * The configuration of the NGN.http.proxy.VirtualHost object.
	 */
	createVirtualHost: function(obj) {
		
		var old = __NGN.clone(this.vhost,true);
		this.onBeforeChange({
			type: 'virtualhost::create',
			was: old,
		});	
		
		
		
		obj = obj || {};
		
		var _rules = obj.rules || {}, me = this;
		
		if (obj.rules)
			delete obj.rules;
		
		this.vhost[obj.port] = this.vhost[obj.port] || {};
		this.vhost[obj.port][obj.hostname.toLowerCase()] = new __NGN.http.proxy.VirtualHost(obj);
		
		for (var method in _rules) {
			for (var rule in _rules[method]){
				if (_rules[method].hasOwnProperty(rule)){
					for (var rl in _rules[method][rule]){
						if (_rules[method][rule].hasOwnProperty(rl)){
							var sub = 	_rules[method][rule][rl].substr(_rules[method][rule][rl].length-5,5) == '-last' 
										? _rules[method][rule][rl].substr(0,_rules[method][rule][rl].length-5) 
										: _rules[method][rule][rl];
							this.vhost[obj.port][obj.hostname.toLowerCase()].addRewriteRule(method,new RegExp(rl),sub);
						}
					}
				}
			}
		}
		
		this.vhost[obj.port][obj.hostname.toLowerCase()].on('beforechange',function(meta){
			me.onBeforeChange(meta);
		});
		
		this.vhost[obj.port][obj.hostname.toLowerCase()].on('change',function(meta){
			me.onChange(meta);
		});
		
		this.vhost[obj.port][obj.hostname.toLowerCase()].on('abortchange',function(meta){
			me.onAbortChange(meta);
		});
		
		this.onChange({
			type: 'virtualhost::create',
			was: old,
			is: this.vhost
		});
	},
	
	
	
	/**
	 * @method
	 * Return a virtual host by it's alias.
	 * @param {Number} port (required)
	 * The port number on which the virtual host is active.
	 * @param {String} alias (required)
	 * The alias hostname.
	 * @returns {NGN.http.proxy.VirtualHost}
	 */
	getVirtualHostByAlias: function(port,alias) {
		if (this.vhost[port] == undefined)
			return null;
		for(var h in this.vhost[port]){
			if (this.vhost[port][h].isAlias(alias.toLowerCase()))
				return this.vhost[port][h];
		}
		return null;
	},
	
	/**
	 * @method
	 * Get the current working configuration.
	 * @return {Object}
	 * Returns JSON.
	 */
	getConfiguration: function(){
		var cfg 	= [],
			vhosts 	= this.getVirtualHosts();
		
		for (var i=0;i<vhosts.length;i++){
			for (var host in vhosts[i])
				cfg.push(vhosts[i][host].getConfiguration());
		}
		
		return cfg;
	},
	
	/**
	 * @method
	 * Start the server.
	 */
	start: function() {

		if (this.ready) {

			var me = this;

			if (Object.keys(this.vhost).length == 0){
				this.fireWarning('The proxy has no virtual hosts!');
				this.onReady();
				return;
			}

			for (var port in this.vhost) {
				
				this.server[port] = prx.createServer({source:{host:'localhost',port:port}},function(_req,_res,proxy){
					
					// Parse the URL Request
					var url		= require('url').parse('http'+''+'://'+_req.headers.host.toLowerCase()+':'+port+_req.url);
		
					// If the host deos not exist, look for aliases
					var vh = me.vhost[port][url.hostname.toLowerCase()] || me.getVirtualHostByAlias(port,url.hostname.toLowerCase());
					
					if (!vh) {
						console.log(port,url,me.vhost);
						_res.writeHead(502);
	  					_res.end();
						return;
					}
					
					var target 	= vh.getTarget(_req),
						dest = require('url').parse('http'+''+'://'+target);
					
					proxy.proxyRequest(_req,_res,{
						host:	dest.hostname.toLowerCase(),
						port:	parseInt(dest.port||80),
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
	},
    
    /**
     * @event change
     * Fired when a configuration change is detected.
     * @param {Object} [delta]
     * A change object.
     */
    onChange: function(delta){
    	delta = delta || {type:'unknown'};
    	this.emit('change',delta);
    },
    
    /**
     * @event beforechange
     * Fired before a configuration change is implemented.
     * @param {Object} [change]
     * The change object.
     */
    onBeforeChange: function(change){
    	this.emit('beforechange',change);
    },
    
    /**
     * @event abortchange
     * Fired when a change is aborted before it completes.
     * @param {String} [reason]
     */
	onAbortChange: function(reason){
		this.emit('abortchange',reason);
	}
	
});

module.exports = Class;