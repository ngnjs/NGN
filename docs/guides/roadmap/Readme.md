NGN Roadmap
===========

## Unknown Release Version

Add the following base classes:

**Core Server Types**

* NGN.core.TcpServer
* NGN.core.DnsServer
* NGN.core.FtpServer
* NGN.core.TelnetServer
* NGN.core.SmtpServer
* NGN.core.MailServer (extends NGN.core.SmtpServer)
* NGN.core.Cluster (mixin?)

**Core Data Libraries**
* NGN.date.Date, NGN.date.Month, NGN.date.Year, NGN.date.Day, NGN.date.Week
_perhaps include datejs?_
_Add commonly used funcitonality like DateAdd(), DateDiff(), etc._

**Application Helpers**

* NGN.app.EventBus

**Simplified Server-2-Server Networking**

* NGN.net.Connection

**Simplified Servers/Clients**

* NGN.ftp.Server
* NGN.ftp.Client
* NGN.dns.Server
* NGN.web.Proxy
* NGN.web.Socket

**Web Authentication Strategies**

* NGN.web.auth.Strategy
* NGN.web.auth.OAuth
* NGN.web.auth.Facebook
* NGN.web.auth.Twitter
* NGN.web.auth.LinkedIn
* NGN.web.auth.Github
* NGN.web.auth.Foursquare
* NGN.web.auth.Dwolla
* NGN.web.auth.Group
* NGN.web.auth.Role
* NGN.web.auth.Permission

**New Datasource Connectors**

* NGN.datasource.SQL (generic RDBMS base connection)
* NGN.datasource.MySql
* NGN.datasource.PostgreSql
* NGN.datasource.Oracle
* NGN.datasource.SqlServer
* NGN.datasource.Azure
* NGN.datasource.CouchDB
* NGN.datasource.Neo4j
* NGN.datasource.Cassandra
* NGN.datasource.Hadoop

_Optional Generic Connectors?_

* NGN.datasource.Document (NoSQL)
* NGN.datasource.Graph (NoSQL)
* NGN.datasource.KeyValue (NoSQL)
* NGN.datasource.XML
* NGN.datasource.JSON
* NGN.datasource.Memory (Object store?)

### Common Extension Library

* NGNX.Person
* NGNX.Group
* NGNX.Account
* NGNX.Actor
* NGNX.Device
* NGNX.Template
* NGNX.Organization
* NGNX.Email
* NGNX.Address (street address)
* NGNX.PhoneNumber
* NGNX.Location (generic geographic location)
* NGNX.Date

_Potential Geographic Library_

* NGNX.Country
* NGNX.Region
* NGNX.City
* NGNX.PostalCode

_Service Wrappers?_
* NGNX.service.Stripe
* NGNX.service.Facebook
* NGNX.service.Twitter
* NGNX.service.LinkedIn
* NGNX.service.Foursquare
* NGNX.service.Dwolla
* NGNX.service.**Sendgrid**
* NGNX.service.Loggly
* NGNX.service.Bitly
* NGNX.service.Github
* NGNX.service.Bitbucket
...


CLI Commands
============

`ngn --extend ngn` Create a stub for a new NGN class.
`ngn --extend ngnx` Create a stub for a new NGNX class.
`ngn --extend api` Create a stubb for a new extension API class.
`ngn --extend api --uml /path/to/file` Create a stub library for a new API, based on a UML file. 
`ngn --create template` Create a new NGN project using a template.


Wishlist
========
Support loading a "map" object for HttpServer routes instead of just passing in a string of file paths.

### Supporting Apps

It would be nice to have the following syntax for building apps:

	NGN.app('configReference',function(){
		// Application Logic, similar to onReady
	});

`configReference` would be a string, object, local file, or URI. When using a string, it assumes a master controller (NGN Admin)
would manage configurations. It would therefore connect to the master controller, retrieve the configuration from it, and load it.
Using an object would be the manual equivalent. Passing a file would be the semi-manual equivalent, and passing a URI would
assume the response is a loadable configuration. Of course, no configuration could be passed as well (i.e. configReference is optioanl).
Using this approach, the callback function would be called once all of the configuration is complete.

This approach would enable the ability to store things like server connections, log settings, app settings, and a bunch of other stuff.
This would be great for generalized settings, like using a common mail server/fallback mail server across every app, or specifying a
common datasource used for caching. By supporting remote configurations, it would be possible to maintain clusters from a centralized
configuration server.

Ultimately, this concept is based on a desire to create a management application. It's inspired by ColdFusion, specifically the concept
of a web-based administrator that allows for registering DSN's and other common services. This, of course, is probably much further down
the road. It should be noted that this kind of management system is a considerable amount of work. This portion may need to be commercialized
to support ongoing development... if NGN reaches this point.

### Managing Apps Efficiently

NGN supports extensions, i.e. devs can write their own API's by extending `NGN` or `NGNX`. It should be possible to only load the libraries
a dev wants/needs to reduce overhead. If the app doesn't require NGNX, it should not be loaded. If multiple extension APIs are created,
only load the ones the app needs.

This could be part of a app configuration, but that doesn't really reduce overhead. Elements of the namespace can be deleted after NGN is
initialized, but this only minimizes what is already a small memory footprint. For more performant startup, it would be better to simply
not load what isn't required.

Perhaps a CLI tool to parse a project and return non-required classes would be sufficient. By providing developers a copy/paste list of 
excluded features, the development overhead could be minimized for those seeking more performant initialization sequences. 

### Simple Global-ish Functionality

A library of common functions that can be used throughout the application could shrink dev time and make code more readable/managable.
It would be nice to shrink the namespace so not everything has to be `NGN.whatever()`. However, most of the useful characters are already
used by other libraries like JQuery and Underscore. Perhaps `&` or `@`? Something like `@.dateDiff(date1,date2)`? 

* NGN.isArray(), NGN.isString(), NGN.isNumber(), NGN.isDate, NGN.isBoolean(), NGN.isSimple(), etc.
* NGN.dump() --> For generating JSON screen dumps (otherwise use eyes/inspect)
* NGN.dateDiff(), NGN.dateCompare(), etc.
