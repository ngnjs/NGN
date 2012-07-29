# Using NGN Global Features
NGN provides several built-in features and is capable of being extended to support many more.

By adding `require('ngn')` to the main node.js executable, all of the features found in this guide are made available
to any file in the application, via a global reference called `NGN`. This guide provides explanations of the features
exposed to applications in this reference. For more information about how this reference/namespace is created, please see
the [NGN Namespace Guide](#!/guide/ngn_namespace). Additionally, NGN creates a second empty global called
`application` for encapsulating custom application-specific objects/references/etc. More information can be found
in the [NGN Application Guide](#!/guide/application_scope).


## Data Sources
{@link NGN#DSN Data sources} are commonly used throughout applications. 


## Application Service Bus
NGN supports an Application Service Bus via the {@link NGN#BUS BUS} attribute. An Application Service Bus is 
conceptually similar to an [enterprise service bus](http://en.wikipedia.org/wiki/Enterprise_service_bus), except it only
interacts with other elements of the application.

When NGN is loaded, `BUS` is created as a basic EventEmitter. It is possible to predefine application-wide listeners
when NGN is required. For example:

**main.js**
	require('ngn');
	
	NGN.BUS.on('myevent',function(data){
		console.log('My Event Says: '+data);
	});
	
	require('applogic.js');

**applogic.js**

	app.get('/display/:message',function(req,res){
		NGN.BUS.emit('myevent',req.params.message);
	});

When someone visits `http://mydomain.com/display/Hello`, the console will display `My Event Says: Hello`.

The Application Service Bus concept is loosely incorporated into the framework so as to be as flexible as possible.
It can be used for just about anything, including hooking into an Enterprise Service Bus like [hook.io](http://hook.io),
acting as a global controller, or pushing a broadcast over a web socket.


## Email Servers
NGN stores server connections, such as `smtp` connections or connections to web API's like Sendgrid.


## Configuration
There are many occassions where properties need to be shared across the application. For example, access tokens to the Facebook API
or the API ket for stripe. The {@link NGN#CFG configuration} property handles this.

## Service Sources
Many applications rely on third party SaSS services and API's. These can be stored globally for reuse.

