# Application Scope
NGN creates an empty reference called {@link #application application}, which is stored in the [node.js global namespace](http://nodejs.org/api/globals.html#globals_global).

## Aren't Node.js Globals Bad Practice?
There are arguments on both sides as to whether or not using global namespaces is a good idea. On one side, globals provide a simple way
of keeping application logic [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself). Accessing globals becomes very simple, and avoids
a lot of scope conflicts when dealing with high level objects.

On the other hand, using globals can cause [dependency problems](http://blog.nodejs.org/2012/02/27/managing-node-js-dependencies-with-shrinkwrap/).
If a module depends on a global variable that is already taken, or if the global variable is not available (part of another package/module), then
modules can fail.

### Why NGN Globals Are Good: NGN Application Philosophy
NGN is designed to simplify construction of applications. Applications _are_ the product, whereas modules are typically a functional piece _of_ a product.
Applications are the last leg of development before users start using them. In most cases, if an application needs to be expanded, it will be further
developed, not treated as a module. If an application is going to be treated like a module, then the NGN framework isn't necessarily the best fit.

## Using the Application Scope
Using the `application` scope is quite simple. As long as the main/executable node.js file includes NGN, i.e. `require('ngn')`, `applicaton` will be
available. The scope is intended to be used as a key/value structure.

**Example**
	require('ngn');
	
	application.name 	= 'My Awesome App';
	application.started = new Date();
	application.defaults= {
							title: 		'Awesome App',
							author:		'Acme, Inc.',
							keywords:	'Awesome, App'
						};

The `application` scope contains a method called Application#load, which applies a key/value object to the application scope. 
An object or absolute file path can be passed as an argument to this method as a means of applying multiple attributes at once.

For example:

**Object Approach**
     var obj = {
     	title:      'Awesome App',
        author:     'Acme, Inc.',
		keywords:   'Awesome, App'
     }
     
     application.load(obj);

This approach is useful if application scope is contained in a remote or local database, REST service, or any other dynamic JSON provider. 

**Filepath Approach**
     application.load(__dirname + '/application.json');

This method is useful when you have a lot of predefined application properties in a static JSON file.

Remember that NGN has several powerful features, methods, and attributes of it's own (see [NGN Namespace Guide](#!/guide/global_features)). The `application`
scope could but shouldn't duplicate the built-in functionality of NGN. Many applications won't need the `application` scope at all, but it
is available for those that do.