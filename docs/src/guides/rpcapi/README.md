Building an API often starts simply, especially when building new products or services.
However; practically no real application remains the same over time. As systems and
applications grow, the needs of the API change. Keeping up with them can be a challenge
if they're not designed properly from the start.

## The Case for Separation

When application logic is embedded in a REST API or web socket service, it can
easily become tough spaghetti code. For example, perhaps you've built a great new
customer service platform using a REST service to tie your UI to the backend.
The code starts nice and clean.

### The Good Predicament

Business picks up! Customers start using your service! Some of them want more 
immediate support than a self-service website can offer. You build a cool web socket 
chat server just to find that most questions could really be answered just
by looking through the website (customers just like the personal touch?).
The solution? Copy the search logic from the REST service into the web socket API! 

Next, customers want to reach you via Google Talk or other IM services. 
Same issue again, but now you're supporting three different communication channels. 
If you copy/paste your application logic into the REST, web socket, and XMPP (chat) 
services while tweaking each to better fit the channel, you end up with the same 
logic all over the place.

### The Good Design Pattern

A common design pattern to resolve this is to isolate application logic and use
each channel as an interface to a common logic API. Some developers create a
namespace to do this, others create modules. Those are definitely viable in certain
circumstances. However; it gets harder to share common application logic when
your application runs on multiple servers.

## Common RPC API

NGN has a special [RPC](http://en.wikipedia.org/wiki/Remote_procedure_call) server and
client component that can be used to isolate common application logic and share it
with other processes, no matter where they're physically running. 

Using the customer service example, the API would be separated into five components:

- RPC Server (common.js)
- Common Logic Module (./mymodule)
- REST API (rest.js)
- Web Socket API (ws.js)
- XMPP API (xmpp.js)

These would be four lightweight NGN processes running together (pooled), plus one 
custom module.

_These examples use_ [NGN Mechanic](#!/guide/mechanic).

**common.js**

    require('ngn');
    
    NGN.run({
      name: 'CustomerServiceAPI',
      description: 'Provides the core application logic.',
      administrators: 'me@mydomain.com',
    },function(){
      
      var server = new NGN.rpc.Server({
        port: 4000,
        expose: require('./mymodule'),
      });
    
    });

This file creates a process called `CustomerServiceAPI` and sets up an RPC server.
NGN.rpc.Server is set to autostart by default, so this is the only code required to
launch the server as a process.

Notice the line `expose: require('./mymodule')`. This is where you expose your application 
logic. This particular syntax assumes you wish to expose a custom node module. While this 
is the recommended way to manage a logic API, it is also possible to expose hard-coded 
logic by passing a key/value object like the following:

    {
      hello: function (name,reply) {
        reply('Hello '+name);
      },
      goodbye: function (name,reply) {
        reply('Goodbye '+name);
      },
    }

The methods `hello` and `goodbye` will be available to the RPC client.

<div style="border-radius:3px;background:#eee;border:2px solid #CCC;padding:14px;width:53%">
  <b>A Note About Methods</b><br/>
  <p>The RPC module is based on [axon-rpc](https://github.com/visionmedia/axon-rpc) and supports
  the same syntaxes for exposing methods. The most notable difference is that passing an
  error (or `null`) is **not** required, but it will work. For example:</p>
  
  <pre>reply('Hello '+name);</pre>
  <p>is equivalent to</p>
  <pre>reply(null,'Hello '+name);</pre>
  
  <p>If you need to pass an error, it should be the first argument of the reply:</p>
  
  <pre>reply(new Error('Nobody by that name!'),'Hello '+name);</pre>
  
  <p>NGN automatically detects errors and processes them using the standard error handling.</p>
</div>


**rest.js**

    var rest = new NGN.http.RestServer({
      routes: './routes',
      port: 80
    });
  
**./routes/main.js**

    var api = new NGN.rpc.Client({
      port: 4000,
      host: '10.50.20.101'
    });
    
    module.exports = {
      '/custom': {
        get: function(){
          api.myCustomMethod(function(data){
            ... modify data here ...
            res.json(data);
          })
        }
      }
    }

The key here is creating the `api` variable, which connects to the RPC server (presumably 
running on a different server in the network). The REST service can now access all of the
methods exposed in `common.js` as though they were included in a local module.

The _web socket_ and _xmpp_ files would both have the same RPC client defined, but would
otherwise look like any other node.js/NGN file.

## Overkill?

There are applications where this architecture is overkill. However; it provides simple
building blocks designed to help your application scale. It may be overkill for a personal
service only used by you and your family, but that is not what this architecture is
designed for. It is designed for systems and applications that will (or plan to) grow.


## Security

Security is left up to the developer, but the NGN RPC components are designed to make
security as simple as possible for the most common kinds of applications. Most people 
will choose to run an RPC server on a port that is not publicly exposed, or only allows 
whitelisted clients. For more extensive security, it is possible to extend NGN.rpc.Server
and NGN.rpc.Client with your own custom logic, or it can be programmed into the methods
that are exposed by the RPC server. 