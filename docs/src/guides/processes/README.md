# Using Processes

Processes are a fundamental building block in NGN. Process share a likeness with apps, in that
they run independently. However; they are often more focused than an app, often being the building
blocks for an app or network system. For example, common processes include a dynamic web server,
a RESTful interface, an RPC server, or a WebSocket server. A collection of processes together create
a whole system.

NGN has an infrastructure & workflow tailored to support distributed systems.

- Processes can be run on different physical servers.
- Processes communicate over the wire via a special background service (NGN Mechanic).


## Basic Process

NGN provides the infrastructure required to run and manage independent processes. The complexity
of this is abstracted so developers can focus on the important parts of their system/app. To do
this, NGN provides a simple `run` method to wrap your code into a process. This process can be
daemonized (i.e. made into a background service) using the native operating system, so it fits
in with many existing tools that monitor your operating system.

The most common process is a web server. In most cases, it should be running all the time. Doing
this with NGN might look like:

    require('ngn');

    NGN.run(function(){
      var server = new NGN.http.WebServer({
        port: 3000,
        viewEngine: 'ejs',
        views: '/path/to/views',
        routes: '/path/to/routes',
        assets: '/path/to/static/assets',
        assetRoute: '/assets' // The URL mapped route for static assets
      });
    });

The code above will run a basic web server. It can also be converted into an always-running
background service using NGN Mechanic.

In a vanilla NGN environment, this trivial example doesn't actually do anything differently than
a script where the web server isn't wrapped in `NGN.run`. However; adding NGN Mechanic to your
infrastructure offers many new options.

## Basic Process + NGN Mechanic

NGN Mechanic is the server agent used to monitor and maintain processes on a server. For example,
Mechanic stores common configuration data, which can be passed to the process. This could be
a shared data source connection, a mail server, or even credentials to make your app work with a
third party service like Facebook. Mechanic also monitors system health and enables communication
with a remotely connected Mechanic running on another server.

Since Mechanic can be used over a network, several security mechanisms exist. Mechanic can be
configured with a shared secret key. Without this key, a process will not be allowed to connect
to the Mechanic agent. Mechanic also has a special form of identifying local processes.

If security is enabled on Mechanic, the `NGN.run` method can provide this key, along with other
configuration information (if needed). This might look like:

    require('ngn');

    NGN.run({
      name: 'My Web Server',
      description: 'Dynamic template server.',
      mechanicSecret: 'superSecretCode'
    },function(mechanic){

      // Create the Web Server
      var server = new NGN.http.WebServer({
        port: 3000,
        viewEngine: 'ejs',
        views: '/path/to/views',
        routes: '/path/to/routes',
        assets: '/path/to/static/assets',
        assetRoute: '/assets' // The URL mapped route for static assets
      });
    });

There are several other mechanic-specific attributes that can be cconfigured, such as remote server,
port number (if a non-standard port is configured), and the ability to completely disable Mechanic for
a specific process.
