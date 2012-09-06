NGN Command Line
================
The NGN command line interface (CLI) automates some of the more tedious aspects
of creating and maintaining projects. The NGN CLI is available as an npm global
installation, i.e.

	npm install ngn -g

## Generate Class Stubs

Class stubs are a "fill in the blank" JavaScript class based on the NGN class system. 
The CLI utility provides a wizard that will generate a working shell file. These files
should be filled in with the appropriate logic, but they will work natively with
developer-defined attributes.

To use the stub generator, execute the following command.

`ngn --create class`

This will start a wizard that looks similar to the following:

	Class Creation Wizard
	Class Name: (NGNX.xtn.Class) 
	Filename: (Class.js) 
	Description: This is my custom class.
	Author: (NGN Generator) Corey Butler
	Extends: (NGN.core) 
	Private Class?: (n) y
	Singleton?: (n) y
	Will this class have custom methods/functions?: (y) 
	Will this class have custom properties/config attributes?: (y) 
	Save to Directory: (./) 
	Class stub created at /path/to/Class.js

The example above, which primarily uses the default values, generates `/path/to/Class.js` as shown below:

	require('ngn');
	
	/**
	 * @class NGNX.xtn.Class
	 * This is my custom class.
	 * @extends NGN.core
	 * @private
	 * @singleton
	 * @author Corey Butler
	 */
	var Class = NGN.define('NGNX.xtn.Class',{
	
	    extend: 'NGN.core',
	
	    constructor: function(config) {
	    
	    	config = config || {};
			
			// Inherit from NGN.core
			Class.super.constructor.call(this,config);
			
	        //TODO: Create configuration/properties.
	        Object.defineProperties(this,{
	            /**
	             * @cfg {String} [someConfigPropery=null]
	             * Replace me.
	             */
	            someConfigProperty: {
	                value: config.someConfigProperty || null,
	                enumerable: true,
	                writable: true,
	                configurable: true
	            },
	
	            /**
	             * @property {String}
	             * Replace me.
	             */
	            someProperty: {
	                value: null,
	                enumerable: true,
	                writable: true,
	                configurable: true
	            }
	
	        });
	
	        // Remaining constructor code goes here....
	
	    },
	
	    //TODO: Create class functions.
	
	    /**
	     * @method
	     * This is a custom function.
	     * @param {String} [arg=null]
	     * This argument is `null` by default.
	     */
	    myFunction: function(arg) {
	        // Code...
	    }
	
	});
	
	module.exports = Class;

This class will actually work in a custom library, but it is not designed to. It is merely a starting point.
It should go without saying that developers should replace things like 
`myFunction` and `someConfigProperty` with meaningful features.

Aside from being a starting point for a functional class, the stub is also designed
to provide a starting point for meaningful documentation. NGN uses [JSDuck](https://github.com/senchalabs/jsduck)
to generate documentation. The comments in a generated stub class are valid syntax
for use with JSDuck.

## Generating Custom Documentation

The NGN CLI utility includes a documentation generator. NGN uses [JSDuck](https://github.com/senchalabs/jsduck) to
generate documentation websites. The NGN CLI automatically generates the appropriate
configiuration and executes the command to create the documentation.

To generate the basic documentation, execute the following command:

`ngn --create docs`

_sudo may be required on some systems since this writes to the file system._

By default, this will generate the docs in `./docs/manual`.

The output of the command looks something like:

	Documentation Generator
	 >> Cleaning up existing docs...
	 >> Checking configuration...
	 >> Building docs...
	DONE
	Docs are available at: file:////path/to/projectroot/docs/manual/index.html

## Generate Custom API Scaffolding

NGN is designed to be extended, i.e. a bootstrap for creating your own applications
and API's. A CLI option can help get you started.
	ngn --create api
This command launches a simple wizard to configure a location for a custom API
capable of extending NGN. The wizard prompts for a location and namespace. The
location is the physical directory path where the custom API(s) are found. The
namespace is the actual value used in an application to identify the API.
_Example:_
	$ ngn --create api
	Custom API Creation Wizard.
	API Namespace: (MY) TEST
	Directory: (/path/to/app/ngn_extensions) 
	 >> Creating custom API directories...
	 >> Creating/Updating NGN configuration...
	 >> Building demo class...
	Done
	The custom API has been started in /path/to/app/ngn_extensions/TEST
	Class stub created:/path/to/app/ngn_extensions/TEST/CustomClass.js
In the example above, the API namespace provided was `TEST`. The namespace
was created in `path/to/app/ngn_extensions`. Remember a namespace is just
a directory, so the actual API can be found in `/path/to/app/ngn_extensions/TEST`.

The wizard also generates a starter class called `CustomClass.js`. This is a working
example that can be renamed, modified, etc. This class will technically work
(though it doesn't really do anything) by calling it in a script like:
	require('ngn');
	
	var myClass = new TEST.CustomClass();
	
	console.log(myClass);
NGN recognizes custom API's through the use of the `ngn.config.json` file.
This is a simple file located at the project root. The wizard will automatically
create this if it doesn't exist, or it will update it with the new custom API.

The `ngn.config.json` may look like:
	{
		"extensions": 	["/path/to/app/ngn_extensions"],
		"application":	{"id":"MyApp"},
		"default":		{}
	}
For documentation generation purposes, the most important part of this file is the `extensions`
key. This is an array of filepaths pointed to one or more extensions. NGN uses this 
attribute to detect and document custom API extensions. Any custom API found in this
series of directories will be documented.

The API wizard only needs to be run once per namespace. To add additional classes to the
custom library, consider creating files by hand or by using the stub generation wizard.

### CLI Options

There are several optional parameters that can be passed to the CLI:

`--examples`

This will include the example custom extension library that ships with NGN.

`--showcmd`

This shows the raw command used to generate the documentation. It also shows
the configuration file passed as a `jsduck` argument. 

`--output`

This option expects an absolute path of the directory where the generated documentation
should be saved (overrrides the default `projectroot/docs/manual`).

_Example_
	ngn --create docs --output /path/to/another/place


## NOTES

The CLI should make life easy with as many utilities as possible.

### Nice to Have
* UML processing -> Create multiple stubs from UML/xmi doc.
* A wizard to create an NGN application configuration.
* Starting the app server as a daemon.