**NOTICE:**

This repo is ridiculously out of date. NGN grew enormously, scattered amongst several repos. We've been working hard over the last year to centralize all of the code for [NGN 2.0.0](https://github.com/ngnjs/NGN/tree/2.0.0). We've been using NGN 1.x.x in production (clients and our own apps) for a few years, but have held off on a formal public release. Version 2.0.0 will be the first release we publicize. The [project roadmap](https://github.com/ngnjs/ngn-core/projects/1) is updated as we complete pieces of the revamped library.

We are in the midst of:

- Completing NGN 2.0.0 core.
- Building NGNX for Browsers & Node.js.
- Building Docker images for NGN server-side systems.
- Creating a completely new site at ngn.js.org.
- Building a brand new documentation system.
- Building a completely automated CI/CD pipeline.
- Massivley updating our CDN.
- Building a developer-friendly proxyfill service.

# NGN

NGN is a platform for building web systems. It provides best-practice building blocks
for backend architecture (distributed systems/microservices), frontend architecture (UI), data management (models), and general programming.

It consists of:

### IDK

The **I**nfrastructure **D**evelopment **K**it consists of a series of [Docker](http://docker.com)
images, designed specifically for distributed/microservice oriented
backend architecture.

### SDK

The **S**oftware **D**evelopment **K**it is a series of [Node.js](http://nodejs.org) modules that seamlessly connect to and interact with IDK components. It alleviates
boilerplate coding and provides professional API's to simplify the effort of
programming microservices. It also contains a robust and extendable data model API.

### Chassis

Chassis is the UI engine. It has a [SASS](http://sass-lang.com) layout engine and
a JavaScript library for smart developers. The vanilla JavaScript library provides an
event bus architecture to make UI interactivity as simple to create as the backend
logic found in the SDK.

For complete details, please visit the [NGN website](http://ngn.js.org). This repository is the home of the primary SDK.

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

<a href="https://nodei.co/npm/ngn/" target="_blank"><img src="https://nodei.co/npm/ngn.png?downloads=true&stars=true"/></a>

### Platform Status

<table>
	<tr>
		<th colspan="2" style="text-align:left">Component</th>
		<th>Grade</th>
		<th>Build</th>
	</tr>
	<tr style="background-color:#ccffc7;">
		<th style="text-align:left">NGN</th>
		<td><code>npm install ngn</code></td>
		<td><a href="https://codeclimate.com/github/ngnjs/NGN" target="_blank"><img src="https://codeclimate.com/github/ngnjs/NGN.png"/></a></td>
		<td><a href="https://travis-ci.org/ngnjs/NGN" target="_blank"><img src="https://api.travis-ci.org/ngnjs/NGN.png"/></a></td>
	</tr>
	<!--<tr>
		<th style="text-align:left"><a href="https://github.com/ngnjs/ngn-core" target="blank">NGN&nbsp;Core</a></th>
		<td><code>ngn install core</code></td>
		<td><a href="https://codeclimate.com/github/ngnjs/ngn-core" target="_blank"><img src="https://codeclimate.com/github/ngnjs/ngn-core.png"/></a></td>
		<td><a href="https://david-dm.org/ngnjs/ngn-core" target="_blank"><img src="https://david-dm.org/ngnjs/ngn-core.png"/></a></td>
		<td><a href="https://travis-ci.org/ngnjs/ngn-core" target="_blank"><img src="https://api.travis-ci.org/ngnjs/ngn-core.png"/></a></td>
	</tr>
		<th style="text-align:left"><a href="https://github.com/ngnjs/ngn-idk-core" target="blank">NGN&nbsp;IDK&nbsp;Core</a></th>
		<td><code>ngn install idk-core</code></td>
		<td><a href="https://codeclimate.com/github/ngnjs/ngn-idk-core" target="_blank"><img src="https://codeclimate.com/github/ngnjs/ngn-idk-core.png"/></a></td>
		<td><a href="https://david-dm.org/ngnjs/ngn-idk-core" target="_blank"><img src="https://david-dm.org/ngnjs/ngn-idk-core.png"/></a></td>
		<td><a href="https://travis-ci.org/ngnjs/ngn-idk-core" target="_blank"><img src="https://api.travis-ci.org/ngnjs/ngn-idk-core.png"/></a></td>
	</tr>-->
</table>
