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
* NGNX.service.Sendgrid
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



Simple Functionality
====================
* NGN.isArray(), NGN.isString(), NGN.isNumber(), NGN.isDate, NGN.isBoolean(), NGN.isSimple(), etc.
* NGN.

