# NGN: The Basics

This guide covers what NGN is, basic features, and the concepts it works well with.

### Super Short Summary

NGN...

1. Is a Server Side JavaScript framework. 
2. Runs on Node.js.
3. Pronounced _N-G-N_ or _Engine_.

### Features

1. Web, API (REST), Mail, & Proxy Servers
2. Shared & Reusable Application Configurations
3. Named Datasource Connections (DSN)
4. Server Event Bus
5. Entity Models (Data Models)
6. Class-like Inheritance
7. SDK (BYO API)
8. Command Line Wizards
9. Documentation
10. Server & Application Modes
11. Scheduled Tasks

## Components

There are a few different components of the NGN ecosystem.

**NGN Process**

An NGN process, in most cases, is an application. This includes dynamic and static web servers,
which may be used to serve a web or mobile application. However; we specifically do not use
the term _application_ to define this since it can be much more or less than an application. For
example, NGN can be used to run just a piece of an application (like a REST API) while front-end
assets are hosted elsewhere, or it could be used to run something completely different, like a 
DNS server. In NGN, a process is basically _anything that runs_.

**NGN Manager**

The NGN manager is a special background process that runs on a server. It is designed specifically 
to interact with NGN Processes, store configurations, manage server-level events, and provide
a service bus for processes that need it. The NGN manager does not neessarily need to be hosted
on the same server where a NGN Process is running.

**NGN CLI (Command Line)**

The NGN CLI provides wizards for creating your own API, generating documentation, and 
controlling the _NGN Manager_. Please see the [CLI Guide](#!/guide/cli).

**NGN Namespaces**

The NGN namespaces are global namespaces used in code. They are the nuts and bolts of the framework.
There are entire sections dedicated to how these namespaces work, as well as detailed documentation
on each namespace's API.
