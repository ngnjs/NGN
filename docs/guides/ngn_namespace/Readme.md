# The NGN Namespace

The NGN namespace is a special [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself)-like class responsible for loading the 
framework into the [node.js global namespace](http://nodejs.org/api/globals.html#globals_global). 

NGN is designed to be a base framework for many kinds of _applications_. It provides a rich feature set, including
an Enterprise Service Bus (ESB), pooled datasource connections (DSN), and access to system resources like mail servers, loggers, etc.

## Purpose & Goals
NGN attempts to simplify programming of behind-the-scenes application logic. It is a framework for _applications_. It's intended for
helping organize and abstract logic in a DRY-like manner. It is ideally suited for rapid application development.

NGN is **not** meant to be a foundation for building independent node modules, though it does leverage many modules.

## Usage 

Using NGN is a one-line (`require('NGN');`) include in your main executable.

**app.js**

     require('NGN'); // <-- That's it!

     var userDB = new NGN.datasource.MongoDB();

     NGN.createDatasource('users',userDB);

     var www = require('./myWebServer.js');

     www.listen(80);

The code above loads the framework in the first line. The remainder of the code registers a MongoDB instance as a user data store 
and launches a web server defined in `myWebServer.js`. This code would be executed from the CLI as would any other node.js application:
     node app.js

The framework is then available in any other file. For example, the code of `myWebServer.js` might look like: 

**myWebServer.js**

     var express = require('express');
     var app     = express.createServer();
     var db      = NGN.getDatasource('users');

     app.get('/user/:id',function(req,res){
         db.find(..., callback);
     });

     modules.exports = app;

## Alternative Namespace Name
If you're concerned about naming/dependency conflicts in the node.js `global` scope, or simply want to customize how the framework is reference, 
it can be configured to use an alternative name.

     require('NGN')('app');
     
     // Create a DSN with the new reference.
     app.createDatasource('users',userDB);

The `global` scope of node.js is case sensitive, so NGN automatically creates a lowercase and uppercase convenience scope 
(i.e. `app` and `APP` in the above example).
 
## Loading the NGN Namespace
NGN generates the entire namespace by looping through the directories of the `ngn` directory
and performing operations (`require`) on each file found within the framework.

It recursively loops through the `ngn/lib` directory, adding each directory as a sub-namespace,
and each file as an element of the appropriate namespace.

For example, let's assume NGN/lib/user exists as shown below. This directory contains files Person.js and Login.js.
    > ngn
        > lib
            > user
                - Person.js
                - Login.js
NGN recognizes `user` is a directory and creates a subspace for it (i.e. NGN.user). It then loops through
the `user` directory and requires each `.js` file it encounters. In this case, it would automatically
generate two classes: `NGN.user.Person` and `NGN.user.Login`. As a result, developers can use a sugar syntax like:
    var Person = new NGN.user.Person({ first:'John', last:'Doe' });
    var Login  = new NGN.user.Login({ type:'facebook', id:'1234567890' });
It is important to note that the `lib` directory contains three files in the root, with the rest of the core API
being contained in `ngn/lib` subdirectories. These files include `BaseClass.js`, `NGN.js` (this file), and `NGN.Global.js`.

All files in the `lib` directory are included with the following exceptions:

### BaseClass.js
This file is not included directly in the namespace because it is a common construct used to establish
JavaScript inheritance. There is nothing specific to application logic in this file.

### NGN.Global.js
This is an extension of `BaseClass.js` (#Class). This is the core object the API is built on. Any extensions to the API
extend this class. However; it itself is not part of the application logic of the API. It is only a construct.

### NGN.js
This is responsible for creating the namespace dynamically, and is not necessary after the namespace
is constructed.


## Inspiration
NGN was inspired by ColdFusion. There's really nothing similar to ColdFusion coding, but it is inspired by the administration
system. ColdFusion allows developers to define data sources, mail servers, etc in the administration. Developers can then
leverage these "global features" in their applications while many common/tedious tasks are performed automatically.

There are several differences from the concepts of ColdFusion, the major one being this framework isolates applications. Another
major difference is it does not attempt to manage physical resources, such as clustering across servers, session sharing, etc.
NGN leaves those decisions up to the web/network engineer. Of course, the framework could be extended to do this, but will not
do so by default due to the incredible variances in web infrastructure.