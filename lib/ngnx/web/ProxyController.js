var Base = require('../../../lib/web/API');

/**
 * @class NGNX.web.ProxyController
 * Provides a REST wrapper around a NGN.web.Proxy, allowing it to be updated in real-time.
* 
* ## GET /host/:server/:port
* 
* Retrieve the details of a specific virtual host.
* 
* **EXAMPLE**
* 
* 	GET /host/localhost/80
* 
* This automatically searches for any alias.
* 
* **RESPONSE**
* 
* `HTTP 200` (ok)
* The virtual host was removed.
* 
* `HTTP 400` (Bad Request)
* A problem with the POST body.
* 
* `HTTP 404` (Missing)
* The virtual host does not exist or cannot be found.
* 
* 
* ## GET /host/:server/:port/destinations
* 
* Retrieve the destinations of a specific virtual host.
* 
* **EXAMPLE**
* 
* 		GET /host/localhost/80/destinations
* 
* This automatically searches for any alias.
* 
* **RESPONSE**
* 
* 	[
* 		'loadbalancer1.com',
* 		'loadbalancer2.com',
* 		'loadbalancer3.com'
* 	]
* 
* ## GET /host/:server/:port/rules
* 
* Retrieve the destinations of a specific virtual host.
* 
* **EXAMPLE**
* 
*	 GET /host/localhost/80/destinations
* 
* This automatically searches for any alias.
* 
* **RESPONSE**
* 
*	 {
* 		GET: [
* 			{'/\/api\/v1\/(.*)$/':'api.cfm?v=1&fn=$1'},
* 			{'/\/api\/v2\/(.*)$/':'api.cfm?v=2&fn=$1'}
* 		],
* 		ALL: [
* 			{'/\/api\/v3\/(.*)$/':'api.cfm?v=3&fn=$1'}
* 		]
* 	}
* 
* 
* ## GET /hosts
* 
* 
* 
* 
* ## POST /host
* 
* Create a new virtual host.
* 
* **Body (JSON)**
* 	{
* 		hostname: 	'localhost',							* Primary Host
* 		port:		80,										* Primary listening port
* 		alias:		['127.0.0.1'],							* Known aliases
* 		destination:['localhost:8383','localhost:8384'],	* Single server or array of load balanced servers.
* 		rewrite:	{
* 						GET: [
* 							{'/\/api\/v1\/(.*)$/':'api.cfm?v=1&fn=$1'},
* 							{'/\/api\/v2\/(.*)$/':'api.cfm?v=2&fn=$1'}
* 						],
* 						ALL: [
* 							{'/\/api\/v3\/(.*)$/':'api.cfm?v=3&fn=$1'}
* 						]
* 					}
* 	}
* 
* **RESPONSE**
* 
* `HTTP 201` (Created)
* The virtual host was created.
* 
* `HTTP 400` (Bad Request)
* A problem with the POST body.
* 
* `HTTP 205` (Reset Content)
* The virtual host already exists.
* 
* 
* ## DELETE /host/:server/:port
* 
* Delete a virtual host.
* 
* **EXAMPLE**
* 
* 	DELETE /host/localhost/80
* 
* **RESPONSE**
* 
* `HTTP 200` (ok)
* The virtual host was removed.
* 
* `HTTP 400` (Bad Request)
* A problem with the POST body.
* 
* `HTTP 205` (Reset Content)
* The virtual host does not exist.
* 
* 
* ## POST /host/:server/:port/rules
* 
* Add a rule or rule set to a specific virtual host.
* 
*	 	POST /host/localhost/80/rules
* 
* **BODY (JSON)**
* 	{
* 		GET: [
* 			{'/\/api\/v1\/(.*)$/':'api.cfm?v=1&fn=$1'},
* 			{'/\/api\/v2\/(.*)$/':'api.cfm?v=2&fn=$1'}
* 		],
* 		ALL: [
* 			{'/\/api\/v3\/(.*)$/':'api.cfm?v=3&fn=$1'}
* 		]
* 	}
* 
* These rules are _appended_ to any existing rules. To overwrite an
* existing rule set, use `PUT` instead of `POST`.
* 
* **RESPONSE**
* 
* `HTTP 201` (Created)
* The rules were created/appended to the virtual host rule set.
* 
* `HTTP 404` (Reset Content)
* The virtual host could not be found.
* 
* _For PUT:__
* `HTTP 200` (ok)
* The rule set replaced the existing rules.
* 
* 
* ## DELETE /host/:server/:port/rules
* 
* Delete a rule or rule set for a specific virtual host.
* 
* 		DELETE /host/localhost/80/rules
* 
* **BODY (JSON)**
* 	{
* 		GET: [
* 			'/\/api\/v1\/(.*)$/',
* 			'/\/api\/v2\/(.*)$/'
* 		],
* 		ALL: [
* 			'/\/api\/v3\/(.*)$/'
* 		]
* 	}
* 
* The specified rules are removed.
* 
* **RESPONSE**
* 
* `HTTP 200` (ok)
* The rules are removed.
* 
* _To delete all rules..._
* 
* ## DELETE /host/:server/:port/rules/all
* 
* Remove all rules for a specific virtual host.
* 
* 	DELETE /host/localhost/80/rules/all
* 	
* **RESPONSE**
* 
* `HTTP 200` (ok)
* Clears all rules for the specified virtual host.
* 
* `HTTP 404` (Reset Content)
* The virtual host could not be found.
* 
* 
* 
* 
* ## POST /from/:origin/:originport/to/:dest/:destport
* 
* Add a single destination server to the round-robin load balancer.
* 
* **EXAMPLE**
* 
*	 	POST /from/localhost/80/to/localhost/9000
* 
* This would add `localhost:9000` to the load balanced servers that `localhost:80` directs to.
* 
* **RESPONSE**
* 
* `HTTP 201` (Created)
* The virtual host was created.
* 
* `HTTP 205` (Reset Content)
* The virtual host already has the destination server.
* 
* 
* ## DELETE /from/:origin/:originport/to/:dest/:destport
* 
* Delete a single destination from the round-robin load balancer.
* 
* **EXAMPLE**
*	 	DELETE /from/localhost/80/to/localhost/9000
* 
* **RESPONSE**
* 
* `HTTP 200` (ok)
* The destination was removed.
* 
* 
* 
* ## POST /alias/:alias/to/:origin/:originport
* 
* Add an alias to a virtual host
* 
* **EXAMPLE**
* 
*	 	POST /alias/domain.biz/to/localhost/87
* 
* This would add `domain.biz` as an alias of `localhost:87`.
* 
* **RESPONSE**
* 
* `HTTP 201` (Created)
* The virtual host was created.
* 
* `HTTP 205` (Reset Content)
* The virtual host already has the destination server.
* 
* `HTTP 404` (Missing)
* The virtual host could not be found.
* 
* 
* ## DELETE /alias/:alias/to/:origin/:originport
* 
* Remove an alias from a virtual host
* 
* **EXAMPLE**
* 
*	 	DELETE /alias/domain.biz/to/localhost/87
* 
* This would remove the `domain.biz` alias of `localhost:87`.
* 
* **RESPONSE**
* 
* `HTTP 200` (ok)
* The alias was removed.
* 
* `HTTP 404` (Missing)
* The virtual host could not be found.
 * 
 * @extends NGN.web.API
 * @author Corey Butler
 */

var Class = Base.extend({

	/**
	 * @constructor
	 * Create a new proxy controller.
	 */
    constructor: function(config) {

		config = config || {};
		
		var start = __NGN.coalesce(config.autoStart,true), me = this;
		
		config.autoStart = false;
		config.processors = new NGNX.web.ApiRequestHelper();
		
        // Inherit from NGN.core
        Class.super.constructor.call(this,config);

        Object.defineProperties(this,{
            
            /**
             * @cfg {NGN.web.Proxy} proxy (required)
             * The proxy to be controlled.
             */
            _proxy: {
            	value:		config.proxy,
            	enumerable:	true,
            	writable:	true
            }

        });
        
        this.routes = this.getRoutes();

		this._proxy.on('change',function(c){
			me._proxy.cache();
		})

      	if (start)
        	this.start();

    },
        
    /**
     * @method
     * Get the routes. This is a hard-coded object split into a function for code readability only.
     * @private
     */
    getRoutes: function() {
    	var p = this._proxy;
    	var proxy = {
			host: {
		
				/**
				 * Create a virtual host
				 */
				post: function(req,res){
					
					if (req.form.hostname == undefined) {
						res.send(400,'Missing attribute: hostname');
						return;
					}
					
					if (req.form.destination == undefined) {
						res.send(400,'Missing attribute: destination');
						return;
					}
					
					// Default port
					req.form.port = req.form.port || 80;
		
					if (typeof req.form.port !== 'number') {
						res.send(400,'Invalid port number: '+req.form.port);
						return;
					}
					
					// Add the hostname
					try {
						p.createVirtualHost({
							hostname: 	req.form.hostname,
							port:		req.form.port,
							target:		req.form.destination
						});
						
						res.send(201);
					} catch (e) {
						res.send(500,e);
					}
				},
				
				del: function(req,res){
					try {
						if (p.vhost[req.qs.port][req.qs.server] == undefined)
							res.send(404,'No virtual host by this address.');
						else {
							p.removeVirtualHost(req.qs.server,req.qs.port);
							res.send(200);
						}
					} catch(e) {
						res.send(500,e)
					}
				},
				
				get: function(req,res){
					if (p.vhost[req.qs.port][req.qs.server] == undefined)
						res.send(404,'No virtual host by this address.');
					else
						res.json(p.vhost[req.qs.port][req.qs.server].getConfiguration());
				},
				
				aliases: {
					get: function(req,res){
							if (p.vhost[req.qs.port][req.qs.server] == undefined)
								res.send(404,'No virtual host by this address.');
							else
								res.send(p.vhost[req.qs.port][req.qs.server].alias);
						}
				},
				
				destination: {
					post: function(req,res){
						if (p.vhost[req.qs.port][req.qs.hostname] == undefined){
							res.send(404,'No virtual host by this address.');
							return;
						} else if (p.vhost[req.qs.port][req.qs.hostname].target.indexOf(req.qs.server+':'+req.qs.serverport.toString()) >= 0) {
							res.send(205);
							return;
						} else
							p.vhost[req.qs.port][req.qs.hostname].addTarget(req.qs.server+':'+req.qs.serverport.toString());
						res.send(201);
					},
					
					del: function(req,res){
						if (p.vhost[req.qs.port][req.qs.hostname] == undefined) {
							res.send(404,'No virtual host by this address.');
							return;
						} else
							p.vhost[req.qs.port][req.qs.hostname].removeTarget(req.qs.server+':'+req.qs.serverport.toString());
						res.send(200);
					}
				},
				
				destinations: {
					get: function(req,res){
						if (p.vhost[req.qs.port][req.qs.server] == undefined)
							res.send(404,'No virtual host by this address.');
						else
							res.json(p.vhost[req.qs.port][req.qs.server].target);
					}
				},
				
				rule: {
					post: function(req,res){
						var vh = p.vhost[req.qs.port][req.qs.server];
						if (vh == undefined){
							res.send(404,'No virtual host by this address.');
							return;
						}
						
						req.form.method = req.form.method || 'ALL';
						
						if (req.form.pattern == undefined || req.form.substitute == undefined) {
							res.send(400,'Missing attribute: pattern and/or substitute');
							return;
						}
						
						vh.addRewriteRule(req.form.method.toUpperCase(),req.form.pattern,req.form.substitute,req.form.last,req.form.position||null);

						res.send(201);
					},
					
					del: function(req,res){
						
						var vh = p.vhost[req.qs.port][req.qs.server];
						if (vh == undefined){
							res.send(404,'No virtual host by this address.');
							return;
						}
						
						if (req.qs.method == undefined || req.qs.index == undefined) {
							res.send(400,'Missing attribute: method and/or index');
							return;
						}
						
						vh.removeRewriteRuleAt(req.qs.method.toUpperCase(),req.qs.index);

						res.send(200);
						
					},
					
					get: function(req,res){
						var vh = p.vhost[req.qs.port][req.qs.server];
						if (vh == undefined){
							res.send(404,'No virtual host by this address.');
							return;
						}
						
						res.json(vh.rules[re.qs.method.toUpperCase()][req.qs.index]);
					},
					
					put: function(req,res){
						res.send(501);
					}
				},
				
				rules: {
					get: function(req,res){
						if (p.vhost[req.qs.port][req.qs.server] == undefined)
							res.send(404,'No virtual host by this address.');
						else
							res.json(p.vhost[req.qs.port][req.qs.server].getConfiguration().rules);
					},
					
					del: function(req,res){
						var vh = p.vhost[req.qs.port][req.qs.server];
						if (vh == undefined){
							res.send(404,'No virtual host by this address.');
							return;
						}
					
						vh.rules = {};
						res.send(200);
					},
					
					post: function(req,res){
						var vh = p.vhost[req.qs.port][req.qs.server];
						if (vh == undefined){
							res.send(404,'No virtual host by this address.');
							return;
						}
						
						vh.rules = req.form;
						
						res.send(201);
					}
				}
			},
			
			hosts: {
				get: function(req,res){
					res.json(p.getVirtualHosts());
				}
			},
			
			alias: {
				post: function(req,res){
					if (p.vhost[req.qs.originport][req.qs.origin] == undefined){
						res.send(404,'No virtual host by this address.');
						return;
					} else if (p.vhost[req.qs.originport][req.qs.origin].alias.indexOf(req.qs.alias) >= 0) {
						res.send(205);
						return;
					} else
						p.vhost[req.qs.originport][req.qs.origin].addAlias(req.qs.alias);
					res.send(201);
				},
				del: function(req,res){
					if (p.vhost[req.qs.originport][req.qs.origin] == undefined){
						res.send(404,'No virtual host by this address.');
						return;
					}
					try {
						p.vhost[req.qs.originport][req.qs.origin].removeAlias(req.qs.alias);
						res.send(200);
					} catch(e) {
						res.send(500,e);
					}
				}
			}
			
		};
		
		return {
			'/proxy': {
				'/from/:hostname/:port/to/:server/:serverport': {
					post: proxy.host.destination.post,
					del: proxy.host.destination.del
				},
				
				'/alias': {
					'/:alias/of/:origin/:originport': {
						post: 	proxy.alias.post,
						del:	proxy.alias.del
					}
				},
				
				'/host': {
				
					'/:server/:port': {
						get: proxy.host.get,
						del: proxy.host.del,
				
						'/targets': {
							get: proxy.host.destinations.get
						},
						
						'/aliases': {
							get: proxy.host.aliases.get
						},
				
						'/rules': {
							del: proxy.host.rules.del,
							get: proxy.host.rules.get
						},
						'/rule': {
							'/:method/:index':{
								del: proxy.host.rule.del,
								put: proxy.host.rule.put,
								get: proxy.host.rule.get
							},
							post: proxy.host.rule.post
						}
					},
					post: proxy.host.post
				},
				
				'/hosts':{
					get: proxy.hosts.get
				}
			}
			
		};
    }

});

module.exports = Class;