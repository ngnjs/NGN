# Creating NGN Processes

Processes, as defined in the [overview](#!/guide/overview), are _anything that runs_. The most common
use of this is to create a web or mobile application. However; a process can be pretty much any
JavaScript file that runs on Node.js.

NGN does not force developers to use NGN for all aspects of a project. However; utilzing NGN processes
offers many advantages. It was designed to simplify development and reduce boilerplate work that commonly
accompanies new application development.

A key advantage to using an NGN process is registration with the NGN Manager. The Manager is a local or
remote service capable of reusing shared configurations such as datasource connections, mail servers,
pre-established 3rd party connections, etc.

## Build a Process

Writing a basic process is pretty simple.

**example.js**
	require('ngn');
	
	new NGN.system.Process(function(){
		console.log('Hello World'.yellow);
	});

<div class="prettyprint" style="width: 55%;box-shadow:0px 3px 5px #333; -moz-border-radius: 6px;-webkit-border-radius: 6px;-khtml-border-radius: 6px;behavior: url(/assets/css/border-radius.htc);border-radius: 6px;position: relative;zoom: 1;background-color: #000000;color: #eeeeee;font-family: Monaco, Consolas, Arial, Helvetica, Sans-Serif;border: 1px solid #333333;border-top: 16px solid #dddddd;padding:4px 22px 4px 22px !important;margin-bottom:6px;border-left: 0 !important;border-right: 0 !important;">
	$ node example.js<br/>
	&nbsp;&nbsp;<span style="color: yellow;">Hello World</span>
</div>

This trivial example does nothing more than write some colored output to the console. However;
behind the scenes, this process registered itself with the local NGN Manager.