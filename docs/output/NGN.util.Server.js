Ext.data.JsonP.NGN_util_Server({"component":false,"html_meta":{},"tagname":"class","extends":null,"alternateClassNames":[],"inheritdoc":null,"mixedInto":[],"singleton":false,"uses":[],"statics":{"css_mixin":[],"cfg":[],"method":[],"property":[],"event":[],"css_var":[]},"parentMixins":[],"mixins":[],"code_type":"assignment","inheritable":false,"meta":{},"members":{"css_mixin":[],"cfg":[{"tagname":"cfg","owner":"NGN.util.Server","meta":{},"name":"autoRegister","id":"cfg-autoRegister"},{"tagname":"cfg","owner":"NGN.util.Server","meta":{},"name":"logger","id":"cfg-logger"},{"tagname":"cfg","owner":"NGN.util.Server","meta":{},"name":"name","id":"cfg-name"},{"tagname":"cfg","owner":"NGN.util.Server","meta":{},"name":"purpose","id":"cfg-purpose"},{"tagname":"cfg","owner":"NGN.util.Server","meta":{},"name":"type","id":"cfg-type"}],"method":[{"tagname":"method","owner":"NGN.util.Server","meta":{},"name":"constructor","id":"method-constructor"},{"tagname":"method","owner":"NGN.util.Server","meta":{},"name":"register","id":"method-register"}],"event":[{"tagname":"event","owner":"NGN.util.Server","meta":{},"name":"start","id":"event-start"},{"tagname":"event","owner":"NGN.util.Server","meta":{},"name":"stop","id":"event-stop"}],"property":[{"tagname":"property","owner":"NGN.util.Server","meta":{"readonly":true},"name":"running","id":"property-running"}],"css_var":[]},"html":"<div><pre class=\"hierarchy\"><h4>Files</h4><div class='dependency'><a href='source/Server.html#NGN-util-Server' target='_blank'>Server.js</a></div></pre><div class='doc-contents'><p>A generic utility class representing a server in the application.\nThis class typically isn't invoked directly. It is designed as a base class\nfor different server types like <a href=\"#!/api/NGN.web.Server\" rel=\"NGN.web.Server\" class=\"docClass\">NGN.web.Server</a>, NGN.web.ApiServer, etc.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-cfg'>Config options</h3><div class='subsection'><div id='cfg-autoRegister' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-cfg-autoRegister' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.util.Server-cfg-autoRegister' class='name not-expandable'>autoRegister</a><span> : <a href=\"#!/api/Boolean\" rel=\"Boolean\" class=\"docClass\">Boolean</a></span></div><div class='description'><div class='short'><p>Automatically register a helper reference to the server (available via <a href=\"#!/api/NGN-method-getServer\" rel=\"NGN-method-getServer\" class=\"docClass\">NGN.getServer</a> or <a href=\"#!/api/Application-method-getServer\" rel=\"Application-method-getServer\" class=\"docClass\">Application.getServer</a>).</p>\n</div><div class='long'><p>Automatically register a helper reference to the server (available via <a href=\"#!/api/NGN-method-getServer\" rel=\"NGN-method-getServer\" class=\"docClass\">NGN.getServer</a> or <a href=\"#!/api/Application-method-getServer\" rel=\"Application-method-getServer\" class=\"docClass\">Application.getServer</a>).</p>\n</div></div></div><div id='cfg-logger' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-cfg-logger' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.util.Server-cfg-logger' class='name expandable'>logger</a><span> : <a href=\"#!/api/NGN.util.Logger\" rel=\"NGN.util.Logger\" class=\"docClass\">NGN.util.Logger</a></span></div><div class='description'><div class='short'>The logging utility to use with the server. ...</div><div class='long'><p>The logging utility to use with the server.</p>\n<p>Defaults to: <code>{NGN.util.Logger}</code></p></div></div></div><div id='cfg-name' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-cfg-name' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.util.Server-cfg-name' class='name expandable'>name</a><span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a></span></div><div class='description'><div class='short'>The accessor name of the server. ...</div><div class='long'><p>The accessor name of the server. This is registered in the #Application variable.</p>\n</div></div></div><div id='cfg-purpose' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-cfg-purpose' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.util.Server-cfg-purpose' class='name expandable'>purpose</a><span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a></span></div><div class='description'><div class='short'>The purpose of the server. ...</div><div class='long'><p>The purpose of the server. Typical values include:</p>\n\n<ul>\n<li>WWW</li>\n<li>REST</li>\n<li>API</li>\n<li>DATA</li>\n</ul>\n\n\n<p>Any value will work for this. This attribute acts as a \"tag\"\nto identify groups of servers that may serve similar purposes.</p>\n</div></div></div><div id='cfg-type' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-cfg-type' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.util.Server-cfg-type' class='name expandable'>type</a><span> : <a href=\"#!/api/String\" rel=\"String\" class=\"docClass\">String</a></span></div><div class='description'><div class='short'>The type of server. ...</div><div class='long'><p>The type of server. For example, <code>HTTP</code>, <code>DNS</code>, <code>FTP</code>, etc.</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-running' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-property-running' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.util.Server-property-running' class='name expandable'>running</a><span> : <a href=\"#!/api/Boolean\" rel=\"Boolean\" class=\"docClass\">Boolean</a></span><strong class='readonly signature'>readonly</strong></div><div class='description'><div class='short'>Indicates the server is currently running. ...</div><div class='long'><p>Indicates the server is currently running.</p>\n<p>Defaults to: <code>false</code></p></div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/NGN.util.Server-method-constructor' class='name expandable'>NGN.util.Server</a>( <span class='pre'><a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a> config</span> ) : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a></div><div class='description'><div class='short'>Create a new server. ...</div><div class='long'><p>Create a new server.\n@params {Object} config</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>config</span> : <a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a><div class='sub-desc'>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/Object\" rel=\"Object\" class=\"docClass\">Object</a></span><div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-register' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-method-register' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.util.Server-method-register' class='name expandable'>register</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Registers the server within the application scope by creating a pointer to it. ...</div><div class='long'><p>Registers the server within the application scope by creating a pointer to it.</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-event'>Events</h3><div class='subsection'><div id='event-start' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-event-start' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.util.Server-event-start' class='name expandable'>start</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Fired when the web server starts. ...</div><div class='long'><p>Fired when the web server starts.</p>\n</div></div></div><div id='event-stop' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='NGN.util.Server'>NGN.util.Server</span><br/><a href='source/Server.html#NGN-util-Server-event-stop' target='_blank' class='view-source'>view source</a></div><a href='#!/api/NGN.util.Server-event-stop' class='name expandable'>stop</a>( <span class='pre'></span> )</div><div class='description'><div class='short'>Fired when the server stops. ...</div><div class='long'><p>Fired when the server stops.</p>\n</div></div></div></div></div></div></div>","name":"NGN.util.Server","aliases":{},"superclasses":[],"requires":[],"id":"class-NGN.util.Server","subclasses":[],"files":[{"href":"Server.html#NGN-util-Server","filename":"Server.js"}]});