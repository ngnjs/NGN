// Array prototype additions
Array.prototype.remove = function(from, to) {
	if(from.isString()){
  		while(this.indexOf(from) !== -1){
  			this.slice(this.indexOf(from),1);
  		}
  		return this;
  	} else {
  		var rest = this.slice((to || from) + 1 || this.length);
  		this.length = from < 0 ? this.length + from : from;
  		return this.push.apply(this, rest);
	}
};





var fs = require('fs');

// Loop through the library and require each of the modules
var namespace = {};
require('wrench').readdirSyncRecursive(__dirname).forEach(function( file ){
    if (__dirname+'/'+file !== __filename 
    	&& file !== 'NGN.Base.js' 
    	&& file !== 'NGN.js' 
    	&& file !== 'NGN.Application.js'
    	&& file !== 'NGN.Session.js' 
    	&& file !== 'BaseClass.js' 
    	&& file.indexOf('.js') >= 0) {
        var path    = file.replace(/\\/gi,'/').replace(/\/\//gi,'/').replace(/\.js/gi,'').split('/'),
            pkg     = namespace;
        
        for (var position=0; position<path.length; position++) {
            
            if (pkg[path[position]] == undefined)
                pkg[path[position]] = position == path.length-1 ? require(__dirname+'/'+file) : {};
            
            if (position !== path.length-1)
                pkg = pkg[path[position]];
        }   
    }
});


/**
 * @class NGN
 * @singleton 
 * For information about using the NGN namespace, please see the [NGN Namespace Guide](#!/guide/ngn_namespace).
 * @aside guide ngn_namespace
 * @aside guide global_features
 * @aside guide application_scope
 */
var NGN = require('./BaseClass').extend({

    constructor: function( config ) {
        
        NGN.super.constructor.call(this);
        
        var emitter = require('events').EventEmitter;
        
        Object.defineProperties(this,{
        	
        	version: {
            	value:		'0.0.1',
            	enumerable:	true,
            	writable:	false,
            	configurable:false
           },
        	
        	/**
             * @property {Object} [DSN=Object]
             * Store **data service names** associated with the application.
             * Each DSN key represents a database connection.
             * 
             * 		var userDB = NGN.getDatasource('users');
             * 
             * *OR*
             * 
             * 		var userDB = NGN.DSN['users'];
             */
            DSN: {
                value:      {},
                enumerable: true,
                writable:   true
            },
            
            /**
            * @property {EventEmitter}
            * This is an [EventEmitter](http://nodejs.org/docs/latest/api/events.html) made available as a common 
            * hook for bridging events bubbled up through the NGN API.
            * @uses events
            */
            BUS: {
                value:      new emitter(),
                enumerable: true,
                writable:   true
            },
            
            /**
             * @property {Object} [MAIL=Object]
             * Stores email server connections (SMTP, Web API) for the application.
             */
            MAIL: {
                value:      {},
                enumerable: true,
                writable:   true
            },
            
            /**
             * @property {Object} [SSN=Object]
             * Service source name. 
             */
            SSN: {
                value:      {},
                enumerable: true,
                writable:   true
            },
            
            /**
             * @property {Object} [CFG=Object]
             * Default configuration parameters. This is a key/value store containing
             * frequently or repetitively used values. 
             */
            CFG: {
                value:      {},
                enumerable: true,
                writable:   true
            },
            
            /**
             * @property {Object} [WEB=Object]
             * A convenience reference to web servers.
             */
            WEB: {
            	value:		{},
            	enumerable:	true,
            	writable:	true
            },
            
            /**
             * @property {Object} [WS=Object]
             * A convenience reference to socket servers.
             */
            WS: {
            	value:		{},
            	enumerable:	true,
            	writable:	true
            },
            
            /**
             * @property {Object} [WEB=Object]
             * A convenience reference to REST servers. NGN considers a REST
             * server to be similar to a web server, but dedicated to serving data.
             */
            REST: {
            	value:		{},
            	enumerable:	true,
            	writable:	true
            },
            
            /**
             * @property {Object} [FTP=Object]
             * A convenience reference to FTP servers.
             */
            FTP: {
            	value:		{},
            	enumerable:	true,
            	writable:	true
            },
            
            /**
             * @property {Array}
             * Stores the extension names. Primarily used for #getExtensions
             * @private
             * @protected 
             */
            _xtn: {
            	value:		[],
            	enumerable:	false,
            	writable:	true
            }
            
        });
        
        // Add each framework element to the NGN namespace  
        for (var ns in namespace) {
            Object.defineProperty(this,ns,{
                value:      namespace[ns],
                enumerable: true,
                writable:   true,
                configurable: false
            });
        }
        
        // Initialize common events
        var _events = [
        				'Error',
        				'ApplicationStart',
        				'ApplicationEnd',
        				'SessionStart',
        				'SessionEnd',
        				'RequestStart',
        				'RequestEnd'
        			];
        
        // Add event listeners for override.
        for (var i=0;i<_events.length;i++)
        	this.addEventListener(_events[i].toLowerCase(),this['on'+_events[i]]);
    },
    
    /**
     * @method
     * Add an application-wide event listener to the #BUS.
     * @param {String} eventName
     * The name of the event to listen for.
     * @param {Function} callback
     * The callback to execute when the event is fired.
     */
    addEventListener: function(eventName,callback) {
    	this.BUS.on(eventName,callback);
    },
    
    /**
     * @accessor
     * Get the custom extensions available to the application.
     * @returns {Array} 
     */
    getExtensions: function() {
    	return this._xtn;
    },
    
    
	/**
	 * @method
	 * A shortcut method for creating new classes.
	 * 		NGN.define('ORG.team.Member',{
	 * 			extend: 'NGN.user.Person',
	 * 			boss: 'CEO',
	 * 			division: 'Executive',
	 * 			paygrade: 2,
	 * 			
	 * 			getOfficialTitle: function(role){
	 * 				return role+', Office of the CEO'
	 * 			}
	 * 		});
	 * The example above would extend `NGN.user.Person` to create `ORG.team.Person`.
	 * If the `ORG.team` namespace does not exist, it will be created
	 * dynamically before creating the new class.
 	 * @param {String} target
 	 * The name of the new class.
 	 * @param {Object} config
 	 * The configuration/extended structure to apply to the object.
	 */
	define: function(target, config) {
		var ns = source.split('.');
		
		if (ns[0].trim().toUpperCase() == 'NGN' || ns[0].trim().toUpperCase() == '__NGN')
			throw Error('Cannot overwrite the NGN namespace.');
		
		if (global[ns[0].trim().toUpperCase()] == undefined) {
			global[ns[0].trim().toUpperCase()] =
			global[ns[0].trim().toLowerCase()] =
			global[ns[0].trim()] = {};
		}
		
		var pkg = global[ns[0].trim()];
		for (var i=1;i<ns.length-1;i++) {
			if (pkg[ns[i].trim()] = undefined)
				pkg[ns[i].trim()] = {};
			pkg = pkg[ns[i].trim()];
		}
		
		var target = config.extend || 'NGN.Base';
		var _cls = target.split('.'),
			_use = __NGN;
		for(var i=1;i<target.length;i++){
			_use = _use[target[i]];
		}
		
		if (config.constructor == undefined) {
			config.constructor = function(){
				Class.super.constructor.call(this,config);
			}
		} else {
			config.constructor = function(cfg) {
				Class.super.constructor.call(this,cfg);
				config.constructor(cfg);
			}
		}
		
		if (config.extend !== undefined)
			delete config.extend;
		
		var Class = _use.extend(config);
		
		module.exports = Class;
	},
    
    /**
     * @method
     * Fire an event on the #BUS
     * @param {String} eventName (required)
     * The name of the event
     * @param {Mixed} [metadata]
     * Optional metadata sent with the event.  
     */
    fireEvent: function( eventName, metadata ){
        this.BUS.emit(eventName,metadata || null);
    },
    
     /**
     * @method
     * Create and register a #DSN.
     * @param {String} name
     * The name by which the #DSN is referenced.
     * @param {NGN.datasource.Connection} connection
     * A connection to a specific database or data store.
     */
    createDatasource: function( name, connection ){
        this.onBeforeCreateDSN(name, connection);
        this.DSN[name] = connection;
        this.onCreateDSN(name, connection);
        
    },
    
    /**
     * This event is fired just prior to the creation of a #DSN. 
     * @event beforecreatedatasource
     * @param {String} name
     * The reference name of the new datasource.
     * @param {NGN.datasource.Connection} connection
     * The connection about to be created. 
     */
    onBeforeCreateDSN: function( name, connection ) {
        this.fireEvent('beforecreatedatasource', name, connection || null);
    },
    
    /**
     * This event is fired just after the creation of a #DSN.
     * @event createdatasource
     * @param {String} name
     * The reference name of the new datasource.
     * @param {NGN.datasource.Connection} connection 
     * The connection object just created. 
     */
    onCreateDSN: function( connection ) {
        this.fireEvent('createdatasource',connection);
    },
    
    /**
     * @method
     * Returns the specified datasource connection.
     * @param {String} name
     * The reference name of the #DSN to return.
     * @returns NGN.datasource.Connection 
     */
    getDatasource: function( name ){
        return this.DSN[name];
    },
    
    /**
     * @method
     * Shortcut. Equivalent to #getDatasource.
     * @param {String} name
     * The reference name of the #DSN to return.
     * @returns NGN.datasource.Connection 
     */
    getDSN: function( name ){
        return this.getDatasource(name);
    },
    
    /**
     * @method
     * Removes a datasource connection. 
     * @param {String} name
     * The reference name of the #DSN to remove.
     */
    removeDatasource: function( name ){
        this.onBeforeremoveDatasurce(name, this.DSN[name]);
        delete this.DSN[name];
        this.onremoveDatasource(name);
    },
    
    /**
     * @method
     * Shortcut. Equivalent to #removeDatasource.
     * @param {String} name
     * The reference name of the #DSN to remove.
     */
    removeDSN: function( name ){
    	this.removeDatasource(name);
    },
    
    /**
     * This event is fired just prior to removeing a #DSN. 
     * @event beforeremovedatasource
     * @param {String} name
     * The reference name of the datasource.
     * @param {NGN.datasource.Connection} connection
     * The connection object about to be removeed. 
     */
    onBeforeremoveDatasource: function( name ) {
        this.fireEvent('beforeremovedatasource', name, connection);
    },
    
    /**
     * This event is fired just after the destruction of a #DSN.
     * @event removedatasource
     * @param {String} name
     * The reference name of the new datasource.
     */
    onremoveDatasource: function( name ) {
        this.fireEvent('removedatasource',name);
    },
    
     /**
     * @method
     * Create and register a #SSN.
     * @param {String} name
     * The name by which the #SSN is referenced.
     * @param {NGN.service.Connection} connection
     * A connection to a specific service or module.
     */
    createService: function( name, connection ){
        this.SSN[name] = connection;
    },
    
    /**
     * @method
     * Returns the specified service source connection.
     * @param {String} name
     * The reference name of the #SSN to return.
     * @returns NGN.service.Connection 
     */
    getService: function( name ){
        return this.SSN[name];
    },
    
    /**
     * @method
     * Returns the entire #SSN object. 
     */
    getServices: function() {
        return this.SSN;
    },
    
    /**
     * @method
     * Removes a service or module connection. 
     * @param {String} name
     * The reference name of the #SSN to return.
     */
    removeService: function( name ){
        delete this.SSN[name];
    },
    
     /**
     * @method
     * Create and register a configuration property (key/value).
     * @param {String} name
     * The name by which the #CFG property is referenced.
     * @param {Mixed} value
     * A #String or #Object.
     */
    createConfigurationProperty: function( name, value ){
        this.CFG[name] = value;
    },
    
    /**
     * @method
     * Returns the specified configuration property..
     * @param {String} name
     * The reference name of the #CFG to return.
     * @returns {Mixed} 
     */
    getConfigurationProperty: function( name ){
        return this.CFG[name];
    },
    
    /**
     * @method
     * Removes a configuration property. 
     * @param {String} name
     * The reference name of the #CFG.
     */
    removeConfigurationProperty: function( name ){
        delete this.CFG[name];
    },
    
    /**
     * @method
     * Retrieves the entire configuration.
     * @returns {Object} 
     */
    getConfiguration: function() {
        return this.CFG;
    },
    
    /**
     * @method
     * Clears the entire configuration. 
     */
    clearConfiguration: function() {
        this.CFG = {};
    },
    
    /**
     * @method
     * Manually set the configuration (#CFG).
     * @param {Object} value 
     * A key/value object.
     */
    setConfiguration: function( value ) {
        if (typeof value !== 'object')
            throw Error('Configuration must be a key/value object.');
        this.CFG = value;
    },
    
    /**
     * @method
     * Recursively traverse a namespace and apply new configuration elements to classes.
     * @param {Object}
     * The namesapce object.
     * @param {Object}
     * The configuration to apply to the object.
     * @private   
     */
    traverse: function( obj, newConfig ) {
        var me = this;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if ( typeof obj[key] == "object"){
                    console.log(key.magenta+' is an object'.cyan);
                    me.traverse(obj[key]);
                } else if (typeof obj[key] == 'function'){
                    // This is where the classes exist
                    //obj[key].apply(newConfig);
                    console.log(key.yellow.bold+' is a class'.green);
                    console.log(obj[key]);
                }
            }
        }
    },
    
    /**
     * @method
     * Broadcast an event on the #BUS.
     * @param {String} eventName (required)
     * @param {Object} [metadata]
     */
    broadcast: function( eventName, metadata ) {
        this.BUS.emit(eventName, metadata || null);
    },
    
    /**
     * @method
     * Listens for an event on the #BUS and runs the callback when it is recognized.
     * @param {String} eventName
     * @param {Function} callback
     */
    on: function( eventName, callback ) {
        this.BUS.addListener(eventName, callback || function(){});
    },
    
    /**
     * @event applicationstart
     * Fired when the NGN application starts.
     */
    onApplicationStart: function(){},
    
    /**
     * @event applicationend
     * Fired when the application ends.
     */
    onApplicationEnd: function(){},
    
    /**
     * @event sessionstart
     * Fired when a user session starts. 
     */
    onSessionStart: function(){},
    
    /**
     * @event sessionend
     * Fired when a session ends.
     */
    onSessionEnd: function(){},
    
    /**
     * @event requeststart
     * Fired when a request starts.
     */
    onRequestStart: function(){},
    
    /**
     * @event requestend
     * Fired just before the request ends
     */
    onRequestEnd: function(){},
    
    /**
     * @event error
     * Fired whenever an error is detected 
     */
    onError: function(){}
});	


// Export the module as a global variable
global.__NGN = global.NGN = new NGN();

// Include the application scope
require('./NGN.Application');

// Include any API extensions (../api)
var ng          = {};
function extendAPI(dir) {
	
	var newglobals = fs.readdirSync(dir);

	// Add custom extension libraries
	for (var i=0; i<newglobals.length; i++){
	    if (    newglobals[i].indexOf('.js') < 0 
	        &&  newglobals[i].indexOf('.md') < 0 
	        &&  newglobals[i].indexOf('.json') < 0
	        // Add more?
	    ) {
	        // New global variables
	        ng[newglobals[i]] = {};
	        require('wrench').readdirSyncRecursive(dir+'/'+newglobals[i]).forEach(function( file ){
	            if (__dirname+'/'+file !== __filename && file.indexOf('.js') >= 0) {
	                var path    = file.replace(/\\/gi,'/').replace(/\/\//gi,'/').replace(/\.js/gi,'').split('/'),
	                    pkg     = ng[newglobals[i]];
	              
	                for (var position=0; position<path.length; position++) {
	                    
	                    if (pkg[path[position]] == undefined)
	                        pkg[path[position]] = position == path.length-1 ? require(dir+'/'+newglobals[i]+'/'+file) : {};
	                    
	                    if (position !== path.length-1)
	                        pkg = pkg[path[position]];
	                }   
	            }
	        });
	        global[newglobals[i].toUpperCase()] =
	        global[newglobals[i].toLowerCase()] =
	        global[newglobals[i]] = ng[newglobals[i]];
	        
	        global.__NGN._xtn.push(newglobals[i]);
	    }
	}
}

/*
 * Process the configuration
 * Look for a configuration file called ngn.config.json 
 */
var root = process.mainModule.filename.replace(/\\/gi,'/');
root = root.replace('/'+root.split('/')[root.split('/').length-1],'');
if (fs.existsSync(root+'/ngn.config.json')) {
	var _cfg = require(__dirname+'/../ngn.config.json');
	for (var item in _cfg){
		if (_cfg.hasOwnProperty(item)){
			switch (item.trim().toLowerCase()) {
				case 'extensions':
					if (this.isArray(_cfg[item])) {
						for (var i=0;i<_cfg[item].length;i++){
							if (!fs.existsSync(_cfg[item][i]))
								throw Error('Unable to instantiate API at '+_cfg['configuration'][i]);
							else
								extendAPI(_cfg[item][i].replace(/\\/gi,'/'));
						}
					}
					break;
				case 'application':
					for(var appItem in _cfg['application']){
						if(_cfg['application'].hasOwnProperty(appItem)){
							global.application[appItem] = _cfg['application'][appItem]; 
						}
					}
					break;
				default:
					currentEnv = (process.env.NODE_ENV||'default').toString().trim().toLowerCase();
					if (currentEnv == item.trim().toLowerCase()){
						for(var prop in _cfg[item]){
							if (_cfg[item].hasOwnProperty(prop)){
								global.__NGN.createConfigurationProperty(prop,_cfg[item][prop]);
							}
						}
					}
					break;
			}
		}
	}
}

// Export as module
module.exports = exports = function( config ) {
    
    var scope = typeof config == 'string' ? config : null; 
    
    config = config || {};
    
    scope = scope !== null ? scope : (config.scope == 'application' ? 'NGN' : config.scope || 'NGN');
    
    if (scope !== 'NGN')
        delete global.NGN;
    
    if ( typeof config === 'object' ) {
        if (config.scope !== undefined)
            delete config.scope;
        global.__NGN = new NGN(config);
    }
    
    global[scope.toUpperCase()] =
    global[scope.toLowerCase()] =
    global[scope] = global.__NGN;

};