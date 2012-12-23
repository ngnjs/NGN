# NGN: Node.js Engines

NGN is a Node.js rapid system development platform. It provides much of the boilerplate
infrastructure required to work with Node, such as a web-socket compatible proxy server,
web servers (dynamic & static), API (REST/WS) servers, mail servers, a service bus, 
& management tools among others. All of the infrastructure is based on best of breed
Node.js modules that are widely used/supported, with a simplified an consistent interface
for developers and administrators. As a result, developers can skip most of the boilerplate
setup required in the majority of Node.js projects.

Additionally, NGN provides a class-like code structure for those who wish to use it. It is
an extendable framework, designed for developers as a starting point for their own API's.
The code framework focuses largely around conceptual data modeling, datastore connections, 
and persistence. However; additional features for network communication, templating, and
other common application-logic utilities.

NGN uses the `80/20` approach. 80% of time is consumed by 20% of the goal. NGN was built
to make sure that `80%` is spent on building applications/solutions, not on infrastructure.
For that reason, there are many precreated data objects, such as `Person`, 'Email`, `Group`,
and more. Common RegExp patterns are made available through a singleton, and many common
data sources are predefined (MongoDB, Redis, MySQL, etc). Other features, such as making
a connection & sending messages with Gmail, are trivial using NGN. Of course, most of this
is based on our own observations, and by no means will it meet every specific need. That's 
why we made it extendable. Developers can use NGN as a starting point for their own API's.
There are examples and even command line utilities to assist with this.

## Installation

**tl;dr**

1. `npm install -g ngn`
2. `ngn setup`

**About Installation:**

NGN is split into multiple `npm` packages, making it possible to use only what you need. 
There is a server agent, called _Mechanic_, which runs a background process on your server
and provides a shell program for administering the environment. The code framework can be
run independently. However; administration will be significantly easier with Mechanic.

To get started, install globally via `npm`, i.e. `npm install -g ngn`.

Since Mechanic is a server agent, it does not come with the base package. However; it
does come with a wizard that will install Mechanic and configure it properly. To do this,
run `ngn setup`. The wizard will guide you. It takes about a minute to do everything.

**Troublshooting Installation:**

NGN uses some native packages like [bcrypt](https://github.com/ncb000gt/node.bcrypt.js).
These leverage [node-gyp](https://github.com/TooTallNate/node-gyp), which can be tricky, 
especially if you're on Windows. If you're running on Windows, be sure to check the node-gyp
requirements. Please note (below) that NGN will run on Windows 7/8 using Visual C++ 2012.

If you have installed all the requirements for `node-gyp` and it complains about an incorrect
version, then you may need to change the version of Visual C++ node uses. This can be 
done by typing `export npm_config_msvs_version=2012` in Powershell.

Some libraries may utilize SSL-based repositories with self-signed SSL certificates. If `npm`
complains about SSL security, it can be fixed by executing `npm config set strict-ssl false`.
After installation, it is possible to set this back to `true`, but remember this could 
potentially affect the NGN updater application.

For any other issues, please post in the issues.


# To-Do
* npmx (for installations) - split into separate project.
* ngn (REPL)
* ngn --create app (to generate an app structure based on ngn)
* ngn --create api (to create structure for building own extensions API)
* ngn --build-docs --config config.json --output /path/to/dir
