Ext.data.JsonP.NGN_core_Server({"tagname":"class","name":"NGN.core.Server","extends":"NGN.core","mixins":[],"alternateClassNames":[],"aliases":{},"singleton":false,"requires":[],"uses":[],"enum":null,"override":null,"inheritable":null,"inheritdoc":null,"meta":{"private":true},"private":true,"id":"class-NGN.core.Server","members":{"cfg":[{"name":"autoRegister","tagname":"cfg","owner":"NGN.core.Server","meta":{},"id":"cfg-autoRegister"},{"name":"autoStart","tagname":"cfg","owner":"NGN.core.Server","meta":{},"id":"cfg-autoStart"},{"name":"id","tagname":"cfg","owner":"NGN.core.Server","meta":{},"id":"cfg-id"},{"name":"port","tagname":"cfg","owner":"NGN.core.Server","meta":{},"id":"cfg-port"},{"name":"purpose","tagname":"cfg","owner":"NGN.core.Server","meta":{},"id":"cfg-purpose"},{"name":"syslog","tagname":"cfg","owner":"NGN.core.Server","meta":{},"id":"cfg-syslog"},{"name":"type","tagname":"cfg","owner":"NGN.core.Server","meta":{},"id":"cfg-type"}],"property":[{"name":"_emitter","tagname":"property","owner":"NGN.core","meta":{"protected":true},"id":"property-_emitter"},{"name":"prototype","tagname":"property","owner":"Class","meta":{"protected":true},"id":"property-prototype"},{"name":"running","tagname":"property","owner":"NGN.core.Server","meta":{"readonly":true},"id":"property-running"},{"name":"starting","tagname":"property","owner":"NGN.core.Server","meta":{},"id":"property-starting"},{"name":"super","tagname":"property","owner":"Class","meta":{"protected":true},"id":"property-super"}],"method":[{"name":"constructor","tagname":"method","owner":"NGN.core.Server","meta":{},"id":"method-constructor"},{"name":"addEventListeners","tagname":"method","owner":"NGN.core","meta":{},"id":"method-addEventListeners"},{"name":"emit","tagname":"method","owner":"NGN.core","meta":{},"id":"method-emit"},{"name":"extend","tagname":"method","owner":"Class","meta":{},"id":"method-extend"},{"name":"fireError","tagname":"method","owner":"NGN.core","meta":{},"id":"method-fireError"},{"name":"fireEvent","tagname":"method","owner":"NGN.core","meta":{},"id":"method-fireEvent"},{"name":"fireWarning","tagname":"method","owner":"NGN.core","meta":{"preventable":true},"id":"method-fireWarning"},{"name":"merge","tagname":"method","owner":"Class","meta":{"private":true},"id":"method-merge"},{"name":"on","tagname":"method","owner":"NGN.core","meta":{},"id":"method-on"},{"name":"register","tagname":"method","owner":"NGN.core.Server","meta":{},"id":"method-register"},{"name":"start","tagname":"method","owner":"NGN.core.Server","meta":{},"id":"method-start"},{"name":"stop","tagname":"method","owner":"NGN.core.Server","meta":{},"id":"method-stop"},{"name":"unRegister","tagname":"method","owner":"NGN.core.Server","meta":{},"id":"method-unRegister"}],"event":[{"name":"error","tagname":"event","owner":"NGN.core","meta":{},"id":"event-error"},{"name":"ready","tagname":"event","owner":"NGN.core.Server","meta":{},"id":"event-ready"},{"name":"start","tagname":"event","owner":"NGN.core.Server","meta":{},"id":"event-start"},{"name":"stop","tagname":"event","owner":"NGN.core.Server","meta":{},"id":"event-stop"}],"css_var":[],"css_mixin":[]},"linenr":3,"files":[{"filename":"Server.js","href":"Server2.html#NGN-core-Server"}],"html_meta":{"private":null},"statics":{"cfg":[],"property":[],"method":[],"event":[],"css_var":[],"css_mixin":[]},"component":false,"superclasses":["Class","NGN.core"],"subclasses":["NGN.web.Proxy","NGN.core.RemoteServer","NGN.core.HttpServer"],"mixedInto":[],"parentMixins":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'><a href='#!/api/Class' rel='Class' class='docClass'>Class</a><div class='subclass '><a href='#!/api/NGN.core' rel='NGN.core' class='docClass'>NGN.core</a><div class='subclass '><strong>NGN.core.Server</strong></div></div></div><h4>Subclasses</h4><div class='dependency'><a href='#!/api/NGN.core.HttpServer' rel='NGN.core.HttpServer' class='docClass'>NGN.core.HttpServer</a></div><div class='dependency'><a href='#!/api/NGN.core.RemoteServer' rel='NGN.core.RemoteServer' class='docClass'>NGN.core.RemoteServer</a></div><div class='dependency'><a href='#!/api/NGN.web.Proxy' rel='NGN.web.Proxy' class='docClass'>NGN.web.Proxy</a></div><h4>Files</h4><div class='dependency'><a href='source/Server2.html#NGN-core-Server' target='_blank'>Server.js</a></div></pre><div class='doc-contents'><p class='private'><strong>NOTE</strong> This is a private utility class for internal use by the framework. Don't rely on its existence.</p><p>A generic utility class representing a server in the application.\nThis class typically isn't invoked directly. It is designed as a base class\nfor different server types like <a href=\"#!/api/NGN.web.Server\" rel=\"NGN.web.Server\" class=\"docClass\">NGN.web.Server</a>, NGN.web.RESTServer, etc.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-cfg'>Config options</h3><div class='subsection'><div id='cfg-autoRegister' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-cfg-autoRegister' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-cfg-autoRegister' class='name not-expandable'>autoRegister</a><span> : <a href=\"#!/api/Boolean\" rel=\"Boolean\" class=\"docClass\">Boolean</a></span></div><div class='description'><div class='short'><p>Automatically register a helper reference to the server (available via NGN#getServer or NGN#getServers).</p>\n</div><div class='long'><p>Automatically register a helper reference to the server (available via NGN#getServer or NGN#getServers).</p>\n</div></div></div><div id='cfg-autoStart' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-cfg-autoStart' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-cfg-autoStart' class='name expandable'>autoStart</a><span> : <a href=\"#!/api/Boolean\" rel=\"Boolean\" class=\"docClass\">Boolean</a></span></div><div class='description'><div class='short'>Automatically start the server. ...</div><div class='long'><p>Automatically start the server. If this is set to <code>false</code>, the\nserver will need to be running explicitly using the <a href=\"#!/api/NGN.core.Server-method-start\" rel=\"NGN.core.Server-method-start\" class=\"docClass\">start</a> method.</p>\n<p>Defaults to: <code>true</code></p></div></div></div><div id='cfg-id' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-cfg-id' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-cfg-id' class='name expandable'>id</a><span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a></span></div><div class='description'><div class='short'>The name of the server. ...</div><div class='long'><p>The name of the server. This can be referenced via <a href=\"#!/api/NGN.app.Application\" rel=\"NGN.app.Application\" class=\"docClass\">NGN.app.Application</a> (if used) or NGN#getServer.</p>\n</div></div></div><div id='cfg-port' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-cfg-port' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-cfg-port' class='name not-expandable'>port</a><span> : <a href=\"#!/api/Number\" rel=\"Number\" class=\"docClass\">Number</a></span></div><div class='description'><div class='short'><p>The port on which the server will listen/connect.</p>\n</div><div class='long'><p>The port on which the server will listen/connect.</p>\n</div></div></div><div id='cfg-purpose' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-cfg-purpose' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-cfg-purpose' class='name expandable'>purpose</a><span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a></span></div><div class='description'><div class='short'>The purpose of the server. ...</div><div class='long'><p>The purpose of the server. Typical values include:</p>\n\n<ul>\n<li>WWW</li>\n<li>REST</li>\n<li>API</li>\n<li>DATA</li>\n</ul>\n\n\n<p>Any value will work for this. This attribute acts as a \"tag\"\nto identify groups of servers that may serve similar purposes.</p>\n</div></div></div><div id='cfg-syslog' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-cfg-syslog' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-cfg-syslog' class='name not-expandable'>syslog</a><span> : <a href=\"#!/api/NGN.util.Logger\" rel=\"NGN.util.Logger\" class=\"docClass\">NGN.util.Logger</a></span></div><div class='description'><div class='short'><p>Specify a logging utility to log server activity.</p>\n</div><div class='long'><p>Specify a logging utility to log server activity.</p>\n</div></div></div><div id='cfg-type' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-cfg-type' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-cfg-type' class='name expandable'>type</a><span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a></span></div><div class='description'><div class='short'>The type of server. ...</div><div class='long'><p>The type of server. For example, <code>HTTP</code>, <code>DNS</code>, <code>FTP</code>, etc.</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-_emitter' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/NGN.core' rel='NGN.core' class='defined-in docClass'>NGN.core</a><br/><a href='source/NGN.core.html#NGN-core-property-_emitter' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core-property-_emitter' class='name expandable'>_emitter</a><span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a></span><strong class='protected signature' >protected</strong></div><div class='description'><div class='short'>An event emitter for the class. ...</div><div class='long'><p>An event emitter for the class. Used internally.</p>\n</div></div></div><div id='property-prototype' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Class' rel='Class' class='defined-in docClass'>Class</a><br/><a href='source/BaseClass.html#Class-property-prototype' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Class-property-prototype' class='name not-expandable'>prototype</a><span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a></span><strong class='protected signature' >protected</strong></div><div class='description'><div class='short'>\n</div><div class='long'>\n</div></div></div><div id='property-running' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-property-running' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-property-running' class='name expandable'>running</a><span> : <a href=\"#!/api/Boolean\" rel=\"Boolean\" class=\"docClass\">Boolean</a></span><strong class='readonly signature' >readonly</strong></div><div class='description'><div class='short'>Indicates the server is currently running. ...</div><div class='long'><p>Indicates the server is currently running.</p>\n<p>Defaults to: <code>false</code></p></div></div></div><div id='property-starting' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-property-starting' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-property-starting' class='name expandable'>starting</a><span> : <a href=\"#!/api/Boolean\" rel=\"Boolean\" class=\"docClass\">Boolean</a></span></div><div class='description'><div class='short'>Indicates whether the server is in the process of starting. ...</div><div class='long'><p>Indicates whether the server is in the process of starting.</p>\n<p>Defaults to: <code>{value: false, enumerable: true, writable: true, configurable: true}</code></p></div></div></div><div id='property-super' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Class' rel='Class' class='defined-in docClass'>Class</a><br/><a href='source/BaseClass.html#Class-property-super' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Class-property-super' class='name not-expandable'>super</a><span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a></span><strong class='protected signature' >protected</strong></div><div class='description'><div class='short'><p>Refers to the parent class.</p>\n</div><div class='long'><p>Refers to the parent class.</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/NGN.core.Server-method-constructor' class='name expandable'>NGN.core.Server</a>( <span class='pre'>config</span> ) : <a href=\"#!/api/NGN.core.Server\" rel=\"NGN.core.Server\" class=\"docClass\">NGN.core.Server</a></div><div class='description'><div class='short'>Create a new server. ...</div><div class='long'><p>Create a new server.\n@params {Object} config</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>config</span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a><div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/NGN.core.Server\" rel=\"NGN.core.Server\" class=\"docClass\">NGN.core.Server</a></span><div class='sub-desc'>\n</div></li></ul><p>Overrides: <a href='#!/api/NGN.core-method-constructor' rel='NGN.core-method-constructor' class='docClass'>NGN.core.constructor</a></p></div></div></div><div id='method-addEventListeners' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/NGN.core' rel='NGN.core' class='defined-in docClass'>NGN.core</a><br/><a href='source/NGN.core.html#NGN-core-method-addEventListeners' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core-method-addEventListeners' class='name expandable'>addEventListeners</a>( <span class='pre'>evt</span> )</div><div class='description'><div class='short'>Adds multiple event listeners ...</div><div class='long'><p>Adds multiple event listeners</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>evt</span> : <a href=\"#!/api/Array\" rel=\"Array\" class=\"docClass\">Array</a><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-emit' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/NGN.core' rel='NGN.core' class='defined-in docClass'>NGN.core</a><br/><a href='source/NGN.core.html#NGN-core-method-emit' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core-method-emit' class='name expandable'>emit</a>( <span class='pre'>eventName, [metadata]</span> )</div><div class='description'><div class='short'>Emits an event respective of the object context (i.e. ...</div><div class='long'><p>Emits an event respective of the object context (i.e. not bubbled to a global level event)</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>eventName</span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a><div class='sub-desc'>\n</div></li><li><span class='pre'>metadata</span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a> (optional)<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-extend' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Class' rel='Class' class='defined-in docClass'>Class</a><br/><a href='source/BaseClass.html#Class-method-extend' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Class-method-extend' class='name expandable'>extend</a>( <span class='pre'>obj</span> ) : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a></div><div class='description'><div class='short'>The properties of the object being extended. ...</div><div class='long'><p>The properties of the object being extended.\n   // Subclass</p>\n\n<pre><code>var Car = Vehicle.extend({\n    constructor: function (doors) {\n         Car.super.constructor.call(this, 'car');\n\n         Object.defineProperty(this,'doors',{\n             value:      doors || 4,\n             writable:   true,\n             enumerable: true\n         });\n    },\n    accelerate: function () {\n        console.log('The '+this.doors+'-door '+ Car.super.accelerate.call(this));\n    }\n});\n</code></pre>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>obj</span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a><div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-fireError' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/NGN.core' rel='NGN.core' class='defined-in docClass'>NGN.core</a><br/><a href='source/NGN.core.html#NGN-core-method-fireError' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core-method-fireError' class='name expandable'>fireError</a>( <span class='pre'>[error]</span> )</div><div class='description'><div class='short'>Fires the specified error. ...</div><div class='long'><p>Fires the specified error.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>error</span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a>/Error (optional)<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-fireEvent' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/NGN.core' rel='NGN.core' class='defined-in docClass'>NGN.core</a><br/><a href='source/NGN.core.html#NGN-core-method-fireEvent' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core-method-fireEvent' class='name expandable'>fireEvent</a>( <span class='pre'>eventName, [metadata]</span> )</div><div class='description'><div class='short'>Fires the specified event. ...</div><div class='long'><p>Fires the specified event. Unlike <a href=\"#!/api/NGN.core-method-emit\" rel=\"NGN.core-method-emit\" class=\"docClass\">emit</a>, this event is bubbled to the NGN#BUS.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>eventName</span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a><div class='sub-desc'>\n</div></li><li><span class='pre'>metadata</span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a> (optional)<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-fireWarning' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/NGN.core' rel='NGN.core' class='defined-in docClass'>NGN.core</a><br/><a href='source/NGN.core.html#NGN-core-method-fireWarning' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core-method-fireWarning' class='name expandable'>fireWarning</a>( <span class='pre'>warning, callback</span> )<strong class='preventable signature' >preventable</strong></div><div class='description'><div class='short'>Fires a warning event. ...</div><div class='long'><p>Fires a warning event.</p>\n        <div class='signature-box preventable'>\n        <p>This action following this event is <b>preventable</b>.\n        When any of the listeners returns false, the action is cancelled.</p>\n        </div>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>warning</span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a><div class='sub-desc'><p>The warning message.</p>\n</div></li><li><span class='pre'>callback</span> : <a href=\"#!/api/Function\" rel=\"Function\" class=\"docClass\">Function</a><div class='sub-desc'><p>If the callback returns false, the event is prevented.</p>\n</div></li></ul></div></div></div><div id='method-merge' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/Class' rel='Class' class='defined-in docClass'>Class</a><br/><a href='source/BaseClass.html#Class-method-merge' target='_blank' class='view-source'>view source</a></div><a href='#!/api/Class-method-merge' class='name expandable'>merge</a>( <span class='pre'>[source], target, [force]</span> ) : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a><strong class='private signature' >private</strong></div><div class='description'><div class='short'>Merges the source to target ...</div><div class='long'><p>Merges the source to target</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>source</span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a> (optional)<div class='sub-desc'><p>Original object.</p>\n</div></li><li><span class='pre'>target</span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a><div class='sub-desc'><p>New object (this).</p>\n</div></li><li><span class='pre'>force</span> : <a href=\"#!/api/Boolean\" rel=\"Boolean\" class=\"docClass\">Boolean</a> (optional)<div class='sub-desc'>\n<p>Defaults to: <code>false</code></p></div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-on' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/NGN.core' rel='NGN.core' class='defined-in docClass'>NGN.core</a><br/><a href='source/NGN.core.html#NGN-core-method-on' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core-method-on' class='name expandable'>on</a>( <span class='pre'>eventName, callback</span> )</div><div class='description'><div class='short'>Listens for an event name and runs the callback when it is recognized. ...</div><div class='long'><p>Listens for an event name and runs the callback when it is recognized.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>eventName</span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a><div class='sub-desc'>\n</div></li><li><span class='pre'>callback</span> : <a href=\"#!/api/Function\" rel=\"Function\" class=\"docClass\">Function</a><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-register' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-method-register' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-method-register' class='name expandable'>register</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Registers the server within the application scope by creating a pointer to it. ...</div><div class='long'><p>Registers the server within the application scope by creating a pointer to it.</p>\n</div></div></div><div id='method-start' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-method-start' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-method-start' class='name expandable'>start</a>( <span class='pre'></span> )</div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-stop' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-method-stop' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-method-stop' class='name expandable'>stop</a>( <span class='pre'></span> )</div><div class='description'><div class='short'> ...</div><div class='long'>\n</div></div></div><div id='method-unRegister' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-method-unRegister' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-method-unRegister' class='name expandable'>unRegister</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Unregisters the server from the application. ...</div><div class='long'><p>Unregisters the server from the application.</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-event'>Events</h3><div class='subsection'><div id='event-error' class='member first-child inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/NGN.core' rel='NGN.core' class='defined-in docClass'>NGN.core</a><br/><a href='source/NGN.core.html#NGN-core-event-error' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core-event-error' class='name expandable'>error</a>( <span class='pre'>e</span> )</div><div class='description'><div class='short'>Fired when an error occurs ...</div><div class='long'><p>Fired when an error occurs</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>e</span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='event-ready' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-event-ready' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-event-ready' class='name expandable'>ready</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Fired when the web server is ready to process reuests. ...</div><div class='long'><p>Fired when the web server is ready to process reuests.</p>\n</div></div></div><div id='event-start' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-event-start' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-event-start' class='name expandable'>start</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Fired when the web server begins the startup process. ...</div><div class='long'><p>Fired when the web server begins the startup process.</p>\n</div></div></div><div id='event-stop' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.core.Server'>NGN.core.Server</span><br/><a href='source/Server2.html#NGN-core-Server-event-stop' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.core.Server-event-stop' class='name expandable'>stop</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Fired when the server stops. ...</div><div class='long'><p>Fired when the server stops.</p>\n</div></div></div></div></div></div></div>"});