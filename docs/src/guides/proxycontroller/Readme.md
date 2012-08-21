# Proxy Servers & Controllers

NGN provides a simple reverse proxy server with methods for creating virtual
hosts, simple round-robin load balancing, aliasing, and URL rewrites.
These features are available through the NGN.web.Proxy server object.

NGN.web.Proxy wraps [http-proxy](http://github.com/nodejitsu/http-proxy)
with configuration helper methods. It abstracts the concept of virtual
hosts and URL rewriting into NGN.web.proxy.VirtualHost and NGN.web.proxy.RewriteRule
respectively. Together, these classes isolate logic in managable chunks
and simplify control of a reverse proxy.

The basic proxy on it's own is powerful, but it does not force developers
to use a specific pattern for controlling/updating a proxy configuration.

One of the core reasons the proxy server was created at all is to fill the following
common use case:

* Support websocket traffic natively.
* Support simple load balancing.
* Support URL rewrites.
* _Hot updates witout restarts._
* No additional software (i.e. Nginx, HAProxy, etc).

NGN's classes support all of this, but they only expose the components of the
proxy server. The NGN library does not provide an interface to manage communication with 
these components though.

NGNX takes proxying to the next level. NGNX.web.Proxy adds capabilities for reading
and writing a `cache.json` file, which can be used to save & load proxy settings.

NGNX.web.ProxyController takes this one step further by wrapping the proxy
server with a REST interface. REST was chosen in order to make the controller
more universally accessible. Developers are still free to create other wrappers,
such as a websocket interface, around the proxy classes to meet specific application
requirements.


## Example Implementation

The most minimal implementation would be:

	require('ngn');
	
	NGN.application(function(){
		
		var proxy = new NGNX.web.Proxy(); // Notice the 'X' in NGNX
	
		proxy.start();
	
		var controller = new NGNX.web.ProxyController({
			proxy: 	proxy
		});
	
	});

Sometimes it is important to see what's happening when the proxy starts
up and/or processes requests. The following example shows how events expose
the processes internal flow.

	require('ngn');
	
	NGN.application(function(){
		
		// 1. Create the proxy server
		var proxy = new NGNX.web.Proxy({
			cache: '/path/to/cache.json' // Optional
		});
	
		// 2. Indicate when the proxy is ready & available for processing.
		proxy.on('available',function(port){
			console.log('Proxy available on port '.yellow+port.toString().yellow.bold);
		});
		
		// 3. Indicate when a request is proxied
		proxy.on('proxy',function(){
			console.log('Request successfully proxied.'.green);
		});
		
		// 4. Start the proxy
		proxy.start();
	
		// 5. Create a controller & assign it to the proxy
		var controller = new NGNX.web.ProxyController({
			autoStart: false,
			proxy: 	proxy
		});
		
		// 6. Indicate when the proxy controller is ready to accept requests.
		controller.on('ready',function(){
			console.log('Proxy Controller is ready'.green);
		});
		
		// 7. Start the proxy controller
		controller.start();
	
	}); 

The code sample above could be used just like any other node file (i.e. `node myproxy.js`).

**#1**

The proxy controller utilizes the special properties and methods found in the
extended proxy (NGNX.web.Proxy, not NGN.web.Proxy). The only difference in
creating them is the optional `cache` attribute. Developers can use this to
specify a disk location where the cache file is saved. If this is not specified,
a cache file will automatically be created, relative to the node module.

**2** & **3**

The proxy emits a couple of events. This is purely an optional step,
typically used to see _when_ the proxy starts up and begins processing.
The `available` event is fired after the proxy has initialized and loaded
the configuration. In other words, it's fired when the proxy is available
for processing requests.

**4**

This code block makes the proxy start listening on any ports defined in the
configuration.

**5**

Finally, the controller! The only required parameter is the proxy parameter.
The `proxy` parameter tells the proxy controller to communicate with the
proxy defined in #1. The `autoStart` parameter is optional, and actually defaults
to `true` if it is not set. In this case, the controller would start 
automatically and immediately (i.e. don't need #6 & #7).

**6**
  
The controller has a few events, and this code listens for the `ready` event.
This is inherited from NGN.web.API and is fired when the REST service is
ready to accept requests.

**7**

Start the controller. This only needs to be explicitly called when `autoStart`
is `false`, otherwise the controller will start on it's own. 

# REST Controller Interface

The following documentation lists all of the endpoints provided by the 
NGNX.web.ProxyController class.

The REST interface runs on port `3000` by default and generates
a base url of `/proxy`. In other words, the API in it's default 
state would be available at `http://localhost:3000/proxy`. A `GET`
request made to `http://localhost:3000/proxy/hosts` provides the
highest level call.

<p style="padding:4px;border-radius:6px;background:#f7f7c6;color:#6e3204;border:1px solid #705502;">
	<b>Remember:</b> Any POST or PUT with a JSON body requires the "Content-Type"
	header to be set to "application/json". 
</p>

## List All

Retrieve all virtual hosts currently registered with the proxy.
	GET /hosts

**Response**

* `HTTP 200` (ok): Contains a JSON array of all the virtual hosts (see next section for detail).


## Virtual Hosts

Virtual Hosts are the core building block of the reverse proxy server.
They store hostnames, target servers, URL rewrite rules, and support
hostname aliases. A proxy must have at least one virtual host in order
to function. 

### Create Virtual Host

Create a new virtual host.
	POST /host
	{
		"hostname": 'localhost',							// Primary Host
		"port":		80,										// Primary listening port
		"alias":	['127.0.0.1'],							// Known aliases
		"target":	['localhost:8383','localhost:8384'],	// Single server or array of load balanced servers.
		"rewrite":	{
						"GET": [
							{'/api/v1/(.*)$':'api.cfm?v=1&fn=$1'},
							{'/api/v2/(.*)$':'api.cfm?v=2&fn=$1'}
						],
						"ALL": [
							{'/api/v3/(.*)$':'api.cfm?v=3&fn=$1'}
						]
					}
	}

**Respones**

* `HTTP 201` (Created): The virtual host was created.
* `HTTP 205` (Reset Content): The virtual host already exists.
* `HTTP 400` (Bad Request): A problem with the POST body.

### Retrieve Virtual Host

Retrieve the details of a specific virtual host.
	GET /host/<domain.com>/<port>
_Supports retrieval by alias._

**Response**

* `HTTP 200` (ok):
		{
			hostname: 	"domain.com",
			port:		83,			
			alias:		["127.0.0.1"],
			target:		["localhost:3000"],
			rules:		{
							GET: [
								{"/api/v1/(.*)$":"api.php?v=1&fn=$1"},
								{"/api/v2/(.*)$":"api.php?v=2&fn=$1"}
							],
							ALL: [
								{"/api/v3/(.*)$":"api.php?v=3&fn=$1"}
							]
						}
		}
* `HTTP 400` (Bad Request): A problem with the POST body.
* `HTTP 404` (Missing): The virtual host does not exist or cannot be found.

### Remove Virtual Host

Remove a virtual host from the proxy.
	DELETE /host/<domain.com>/<port>
**Response**

* `HTTP 200` (ok): The virtual host was removed.
* `HTTP 400` (Bad Request): A problem with the POST body.
* `HTTP 205` (Reset Content): The virtual host does not exist.




## Aliases

Aliases are alternative domain names that map requests the same way the 
primary host does. For example, `www.domain.com` may be an alias of `domain.com`,
meaning both domains would proxy requests to the same server.

### Create Alias

Add an alias of a virtual hostname:
	POST /alias/<alias.com>/of/<domain.com>/<port>

**Response**

* `HTTP 201` (Created): The virtual host was created.
* `HTTP 205` (Reset Content): The virtual host already has the destination server.
* `HTTP 404` (Missing): The virtual host could not be found.


### Remove Alias

Remove an alias of a virtual hostname:
	DELETE /alias/<alias.com>/of/<domain.com>/<port>
**Response**

* `HTTP 200` (ok): The alias was removed.
* `HTTP 404` (Missing): The virtual host could not be found.

### List Aliases

Retrieve a list of aliases associated with a virtual host.
	GET /host/<domain.com>/<port>/aliases
**Response**

* `HTTP 200` (ok): Example: `['alias1.com','alias2.com']`
* `HTTP 404` (Missing): The virtual host could not be found.



## Target/Destination Servers

Target servers are the servers where virtual host requests are proxied to.
NGN provides simple round-robin load-balancing. As a result, a single
virtual host may have one or more target servers associated with it. 

### Add Target Server

Add a target server to the virtual host. This will be appended to the load
balancer queue.
	POST /from/<domain.com>/<port>/to/<server.com>/<port>
**Response**

* `HTTP 201` (Created): The virtual host was created.
* `HTTP 205` (Reset Content): The virtual host already has the destination server.
* `HTTP 404` (Missing): The virtual host could not be found.

### List Target Servers

Retrieve a list of the destination servers the virtual host should route requests to.
	GET /host/<domain.com>/<port>/targets
_Supports retrieval by alias._

**Response**

* `HTTP 200`:
	[
		'loadbalancer1.com',
		'loadbalancer2.com',
		'loadbalancer3.com'
	]
* `HTTP 404` (Missing): The virtual host could not be found.

### Remove Target Server

Explicitly remove a specific target server from a virtual host.
	DELETE /from/<domain.com>/<port>/to/<server.com>/<port>
**Response**

* `HTTP 200` (ok): Complete.
* `HTTP 404` (Missing)`: The virtual host could not be found.

## URL Rewrite Rules

URL rewrite rules are RegExp-based patterns and subsitutions that
will rewrite the destination URL. If the request URL matches
a rewrite rule, it will use substitution to manipulate the URL
accordingly.

### Create Rule

Create a rule for a specific virtual host.
	POST /host/<domain.com>/<port>/rule
	{
		GET: [
			{'/api/v1/(.*)$':'api.cfm?v=1&fn=$1'},
			{'/api/v2/(.*)$':'api.cfm?v=2&fn=$1'}
		],
		ALL: [
			{'/api/v3/(.*)$':'api.cfm?v=3&fn=$1'}
		]
	}
**Response**

* `HTTP 201` (Created): The rules were created/appended to the virtual host rule set.
* `HTTP 404` (Reset Content): The virtual host could not be found.

### List Rules

Retrieve the rules associated with a virtual host.
	 GET /host/<domain.com>/<port>/rules
_Supports retrieval by alias._

**Response**
* `HTTP 200` (ok):
	 {
		GET: [
			{'/api/v1/(.*)$':'api.cfm?v=1&fn=$1'},
			{'/api/v2/(.*)$':'api.cfm?v=2&fn=$1'}
		],
		ALL: [
			{'/api/v3/(.*)$':'api.cfm?v=3&fn=$1'}
		]
	}
* `HTTP 404` (Missing): The virtual host does not exist or cannot be found.

### Delete Rule

Delete a rule from a virtual host.
	DELETE /host/<domain.com>/<port>/rule/<method>/<index>
Method will be a valid HTTP method, such as `POST`, `PUT`, `GET`, `DELETE`, etc.

Index refers to the array index of the ruleset. Using the following rule set
as an example, the 2<sup>nd</sup> `GET` rule is no longer required.
	{
		GET: [
			{'/api/v1/(.*)$':'api.cfm?v=1&fn=$1'},
			{'/api/v2/(.*)$':'api.cfm?v=2&fn=$1'}	// <--- Remove This
		],
		ALL: [
			{'/api/v3/(.*)$':'api.cfm?v=3&fn=$1'}
		]
	}

The method would be `GET` and the index would be `1`. Therefore, removing this
rule would look like:
	DELETE /host/<domain.com>/<port>/rule/GET/1
**Response**

* `HTTP 200` (ok): The rules are removed.
* `HTTP 404` (Missing): The virtual host does not exist or cannot be found.

### Purge All Rules

All of the rules for a specific virtual host can be removed at once. 
Be careful with this, as it is irreversible.
	DELETE /host/<domain.com>/<port>/rules
**Response**

* `HTTP 200` (ok): The rules are removed.
* `HTTP 404` (Missing): The virtual host does not exist or cannot be found.