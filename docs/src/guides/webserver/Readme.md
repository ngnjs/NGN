# Web Server Fundamentals

The web server is based on [express](http://expressjs.com)(v3.0) from [TJ Holowaychuk](https://github.com/visionmedia).
Express, which works on [Connect](http://senchalabs.github/com/connect) is the most widely used web server framework in
the node community. Express can be used independently or with NGN objects, but NGN strives to
simplify many of the common boilerplate configurations of Express. Furthermore, NGN.http.Sever acts as a
consistent API interface, should it be necessary to switch to an alternative web server.

The remainder of this guide is dedicated to both basic and advanced use of the NGN.http.Server.

## The Most Basic Server

The most basic web server can be used like

	var server = new NGN.http.Server();

This will launch a `localhost` server on port `80`. Since no routes are specified,
the server generates a test route for developers to verify the server is actually running.

By pointing a browser to `http://localhost` with the aforementioned setup, the browser will display

 `The web server works, but no routes have been configured.`
 
Of course, this on its own isn't useful beyond testing. The real power of an NGN web server
appears in the configuration. Since it is based on Express, it has all of the features of Express,
plus several others. These features include:

* Simpler Configuration
* Route File Structure
* Automatic Route Loading
* Expanded Route Controls, like renderIfExists()
* NGN.datasource.Connection-based Persistent Sessions.
* More Template Renderers
* OAuth Integration
 

## Routing

Most web servers utilize routes to process requests and dynamic views.
Typically, routes also manage static assets like images, CSS, etc. NGN
supports both static and dynamic routing by providing a file management
structure around express. 

Take the following server:

	var server = new NGN.http.Server({
		port: 		81,
		assets: 	'/path/to/static/files',
		views: 		'/path/to/templates',
		viewEngine: 'jade',
		routes: 	'/path/to/routes'
	});

There is a lot going on here. First, the server will be automatically started on port `81`,
meaning it is accessible at `http://localhost:81`. 

### Static Files

NGN looks for static files on the path 
configured in the `assets` directory, or `/path/to/static/files`. NGN, like express, will 
look in this directory when it receives a request for a URL it does not have a route associated with.
For example, a request to `http://localhost:81/images/logo.png` would look for 
`/path/to/static/files/images/logo.png`. 

### Routes

NGN supports a simple and straightforward way to define any number of routes.
When the web server is started, it will recursively parse the `routes` directory
in an effort to find and load all routes for your application. In this sample,
it will look for all `.js` files in `/path/to/routes` with the assumption
that this directory _only contains route controllers_.

**Route Controllers**

A route controller is specially structured file that works similarly to express routing.

_example:_

	 module.exports = {
	 	'/test': {							// #1
			'/more': {						// #2
				get: function(){
					res.write('Testing more nested routes');
					res.end();
				}
			},
			get: function(req,res){
				res.write('Basic Test');
				res.end();
			}
		},
		'/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/': {  // #3
			get: function(){
				res.end('Yo!');
			}
		},
		'/': {								 // #4
			get: function(){
				res.end('Hello. I am root.');
			}
		}
	}

The example above contains several different routes for the following URL's:

* `GET` http://localhost:81 (#4)
* `GET` http://localhost:81/test (#1)
* `GET` http://localhost:81/test/more (#2)
* `GET` http://localhost:81/foo/bar/juice (#3)
* `GET` http://localhost:81/whatever/path (#3)

As the example indicates, it is possible to nest route paths for readability.
This is not a requirement, but may make some code easier to maintain. NGN has a built
in mapper to automatically generate these routes.

The example leads with `module.exports = {...}`, which is a common node package construct.
This must be included in each route file so node can load it properly.

Notice the inherited object `res` in each of the `get` functions, which is not explicitly passed as an argument. 
If you're used to using express, you may remember a different syntax more like:

	app.get('/',function(req,res,next){
		...
		res.render('mytemplate');
	});

Notice _route #3_ is a {RegExp}. Since a RegExp is an object iteself, it cannot be used as
a property of an object. Therefore, regular expressions are wrapped in quotes. NGN 
automatically detects them by finding a beginning and trailing `/` in the route, which
is automatically converted to a {RegExp} object.

NGN wraps express routing methods and provides some sugar syntax to make the code simpler to read,
less to type, and (hopefully) friendlier overall. However; the wrapper supports the same express syntax
for those who wish to continue using it. There are several additional inherited variables made available
to route methods (regardless of the syntax you choose). These include:

* **res/response:** The raw `response` object. This is the same object typically passed in app.get('/',function(**req**,...){}).
* **req/request:** The raw `request` object. This is the same object typically passed in app.get('/',function(req, **res**,...){}).
* **next:** The `next` method. This is the same method typically passed in app.get('/',function(req,res,**next**){}).
* **url:** A key/value object containing any URL parameters. For example, `http://localhost/?hello=world` would be the same as `url = {hello:"world"}`.
* **session:** A reference to `req.session`.
* **form**: A key/value object containing any <form> attributes POSTed to the URL. This is a blank object if no form attributes are submitted.
* **cgi:** A key/value object containing different CGI attributes, including `headers`, `isMobileDevice`, `path_info`, `user_agent`, `method`, and `http_accept`. This list will likely grow over time, as additional values are needed.

All of the common routing methods are available, including:

* `get`
* `put`
* `post`
* `del` (used instead of `delete`, which is a reserved word in JavaScript)
* `head`

### Dynamic Views & Templates

NGN automatically extends the local variables sent to templates.

* **session** {Object} This contains whatever is stored in the session.
* **application** {Object} This object is accessible to the entire running process.
* **url** {Object} This is a key/value object of all URL query parameters sent in the request.
* **browser** {Object}
The _browser_ object is structured like:

		{
			name: 'Safari 5.0.1',
			version: '5.0.1',
			family:	'Safari,
			major: 5,
			minor: 0,
			patch: 1,
			mobile: false
		}

CSRF protection is enabled by default when session management is enabled. A `local` variable is available called `csrf_input_field`,
which generates a CSRF token and makes the HTML code available for insertion into a template. The code injected looks like

	<input type="hidden" name="_csrf" value="<generated-token>"/>


### Caching Dynamic Templates

The NGN web server uses (consolidate)[https://github.com/visionmedia/consolidate.js] to support
multiple different template rendering engines. Each of the consolidate engines supports
caching at the route level. By default, caching is not enabled.

To enable caching for a specific URI route, the `cache:true` parameter should be passed as an option
when the template is rendered. For example:

	server.get('/my/path',function(req,res){
		res.render('index',{pagetitle:'Welcome',cache:true},function(err,html){
			if (err) throw err;
			console.log('Generated HTML:',html);
		});
	}); 

When the first request to http://mydomain.com/my/path is received, the template will
be rendered and stored in memory (RAM). All subsequent requests to this URL will 
render the cached content.



