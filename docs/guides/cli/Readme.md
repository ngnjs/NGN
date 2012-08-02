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
	module.exports = NGN.define('NGNX.xtn.Class',{
	
	    extend: 'NGN.core',
	
	    constructor: function(config) {
	
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

This class will actually work in a custom library, but it is not designed to.
It should go without saying that developers should replace things like 
`myFunction` and `someConfigProperty` with real meaningful features.

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

### Customizing

NGN is designed to be extended, i.e. a bootstrap for creating your own applications
and API's. NGN can document a custom API through the use of the `ngn.config.json` file.
This is a simple file located at the project root.

	{
		"extensions": 	["/path/to/custom/api"],
		"application":	{"id":"MyApp"},
		"default":		{}
	}

For documentation generation purposes, the most important part of this file is the `extensions`
attribute. This is an array of filepaths pointed to one or more extensions. NGN uses this 
attribute to detect and document custom API extensions.

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