Ext.data.JsonP.cli({"guide":"<h1>NGN Command Line</h1>\n<div class='toc'>\n<p><strong>Contents</strong></p>\n<ol>\n<li><a href='#!/guide/cli-section-1'>Generate Class Stubs</a></li>\n<li><a href='#!/guide/cli-section-2'>Generating Custom Documentation</a></li>\n<li><a href='#!/guide/cli-section-3'>NOTES</a></li>\n</ol>\n</div>\n\n<p>The NGN command line interface (CLI) automates some of the more tedious aspects\nof creating and maintaining projects. The NGN CLI is available as an npm global\ninstallation, i.e.</p>\n\n<pre><code>npm install ngn -g\n</code></pre>\n\n<h2 id='cli-section-1'>Generate Class Stubs</h2>\n\n<p>Class stubs are a \"fill in the blank\" JavaScript class based on the NGN class system.\nThe CLI utility provides a wizard that will generate a working shell file. These files\nshould be filled in with the appropriate logic, but they will work natively with\ndeveloper-defined attributes.</p>\n\n<p>To use the stub generator, execute the following command.</p>\n\n<p><code>ngn --create class</code></p>\n\n<p>This will start a wizard that looks similar to the following:</p>\n\n<pre><code>Class Creation Wizard\nClass Name: (NGNX.xtn.Class) \nFilename: (Class.js) \nDescription: This is my custom class.\nAuthor: (NGN Generator) Corey Butler\nExtends: (<a href=\"#!/api/NGN.core\" rel=\"NGN.core\" class=\"docClass\">NGN.core</a>) \nPrivate Class?: (n) y\nSingleton?: (n) y\nWill this class have custom methods/functions?: (y) \nWill this class have custom properties/config attributes?: (y) \nSave to Directory: (./) \nClass stub created at /path/to/Class.js\n</code></pre>\n\n<p>The example above, which primarily uses the default values, generates <code>/path/to/Class.js</code> as shown below:</p>\n\n<pre><code>require('ngn');\n\n/**\n * @class NGNX.xtn.Class\n * This is my custom class.\n * @extends <a href=\"#!/api/NGN.core\" rel=\"NGN.core\" class=\"docClass\">NGN.core</a>\n * @private\n * @singleton\n * @author Corey Butler\n */\nmodule.exports = <a href=\"#!/api/NGN-method-define\" rel=\"NGN-method-define\" class=\"docClass\">NGN.define</a>('NGNX.xtn.Class',{\n\n    extend: '<a href=\"#!/api/NGN.core\" rel=\"NGN.core\" class=\"docClass\">NGN.core</a>',\n\n    constructor: function(config) {\n\n        //TODO: Create configuration/properties.\n        Object.defineProperties(this,{\n            /**\n             * @cfg {String} [someConfigPropery=null]\n             * Replace me.\n             */\n            someConfigProperty: {\n                value: config.someConfigProperty || null,\n                enumerable: true,\n                writable: true,\n                configurable: true\n            },\n\n            /**\n             * @property {String}\n             * Replace me.\n             */\n            someProperty: {\n                value: null,\n                enumerable: true,\n                writable: true,\n                configurable: true\n            }\n\n        });\n\n        // Remaining constructor code goes here....\n\n    },\n\n    //TODO: Create class functions.\n\n    /**\n     * @method\n     * This is a custom function.\n     * @param {String} [arg=null]\n     * This argument is `null` by default.\n     */\n    myFunction: function(arg) {\n        // Code...\n    }\n\n});\n</code></pre>\n\n<p>This class will actually work in a custom library, but it is not designed to.\nIt should go without saying that developers should replace things like\n<code>myFunction</code> and <code>someConfigProperty</code> with real meaningful features.</p>\n\n<p>Aside from being a starting point for a functional class, the stub is also designed\nto provide a starting point for meaningful documentation. NGN uses <a href=\"https://github.com/senchalabs/jsduck\">JSDuck</a>\nto generate documentation. The comments in a generated stub class are valid syntax\nfor use with JSDuck.</p>\n\n<h2 id='cli-section-2'>Generating Custom Documentation</h2>\n\n<p>The NGN CLI utility includes a documentation generator. NGN uses <a href=\"https://github.com/senchalabs/jsduck\">JSDuck</a> to\ngenerate documentation websites. The NGN CLI automatically generates the appropriate\nconfigiuration and executes the command to create the documentation.</p>\n\n<p>To generate the basic documentation, execute the following command:</p>\n\n<p><code>ngn --create docs</code></p>\n\n<p><em>sudo may be required on some systems since this writes to the file system.</em></p>\n\n<p>By default, this will generate the docs in <code>./docs/manual</code>.</p>\n\n<p>The output of the command looks something like:</p>\n\n<pre><code>Documentation Generator\n &gt;&gt; Cleaning up existing docs...\n &gt;&gt; Checking configuration...\n &gt;&gt; Building docs...\nDONE\nDocs are available at: file:////path/to/projectroot/docs/manual/index.html\n</code></pre>\n\n<h3>Customizing</h3>\n\n<p>NGN is designed to be extended, i.e. a bootstrap for creating your own applications\nand API's. NGN can document a custom API through the use of the <code>ngn.config.json</code> file.\nThis is a simple file located at the project root.</p>\n\n<pre><code>{\n    \"extensions\":   [\"/path/to/custom/api\"],\n    \"application\":  {\"id\":\"MyApp\"},\n    \"default\":      {}\n}\n</code></pre>\n\n<p>For documentation generation purposes, the most important part of this file is the <code>extensions</code>\nattribute. This is an array of filepaths pointed to one or more extensions. NGN uses this\nattribute to detect and document custom API extensions.</p>\n\n<h3>CLI Options</h3>\n\n<p>There are several optional parameters that can be passed to the CLI:</p>\n\n<p><code>--examples</code></p>\n\n<p>This will include the example custom extension library that ships with NGN.</p>\n\n<p><code>--showcmd</code></p>\n\n<p>This shows the raw command used to generate the documentation. It also shows\nthe configuration file passed as a <code>jsduck</code> argument.</p>\n\n<p><code>--output</code></p>\n\n<p>This option expects an absolute path of the directory where the generated documentation\nshould be saved (overrrides the default <code>projectroot/docs/manual</code>).</p>\n\n<p><em>Example</em></p>\n\n<pre><code>ngn --create docs --output /path/to/another/place\n</code></pre>\n\n<h2 id='cli-section-3'>NOTES</h2>\n\n<p>The CLI should make life easy with as many utilities as possible.</p>\n\n<h3>Nice to Have</h3>\n\n<ul>\n<li>UML processing -> Create multiple stubs from UML/xmi doc.</li>\n<li>A wizard to create an NGN application configuration.</li>\n<li>Starting the app server as a daemon.</li>\n</ul>\n\n","title":"Command Line Tools"});