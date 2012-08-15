var Base = require('../../NGN.core');
/**
 * @class NGN.web.proxy.VirtualHost
 * A virtual host, including hostname, aliases, rewrites, and load balancing.
 * @extends NGN.core
 * @author Corey Butler
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new virtual host.
	 * @param {Object/String} config
	 * The configuration object or hostname.
	 */
    constructor: function(config) {
   	
    	if (typeof config === 'string')
			config = {hostname:config};
		else
			config = config || {};

		Class.super.constructor.call(this,config);

        Object.defineProperties(this,{
        	
        	/**
        	 * @cfg {String} hostname (required)
        	 * The hostname used to identify the virtual host. 
        	 */
        	hostname: {
        		value:		config.hostname,
        		enumerable:	true,
        		writable:	true,
        		configurable:true
        	},
        	
        	/**
        	 * @cfg {Number} port (required)
        	 * The port number the virtual host should be listenting on.
        	 */
        	port: {
        		value:		config.port,
        		enumerable:	true,
        		writable:	true,
        		configurable:true
        	},
        	
            /**
             * @property {Object}
             * The rewrite rules this virtual host uses.
             * @private
             * @readonly
             */
            rules: {
                value: 		{},
                enumerable: true,
                writable: 	true,
                configurable:true
            },
            
            /**
             * @property {Array} target
             * The server(s) where requests should be proxied to.
             * @readonly
             */
            /**
             * @cfg {String/Array}
             * A string or array of target servers where requests are proxied to.
             * 
             * *Example**
             * 		['localhost:81','localhost:82']
             */
            target: {
            	value:		config.target || [],
            	enumerable:	false,
            	writable:	true
            },
            
            /**
             * @property {Array} alias
             * The aliases associated with this virtual host.
             * @readonly
             */
            /**
             * @cfg {String/Array} alias
             * A string or array of strings containing the alias names.
			 * 
			 * **Example**
			 * 		vh.addAlias(['domain.com','www.domain.com']);
             */
            alias: {
            	value:		config.alias || [],
            	enumerable:	true,
            	writable:	true
            }

        });
        
        if (!Array.isArray(this.target))
        	this.target = [this.target];

    },

	/**
	 * @method
	 * Add an alias hostname to the virtual host.
	 * @param {String/Array} alias
	 * A string or array of strings containing the alias names.
	 * 
	 * **Example**
	 * 		vh.addAlias(['domain.com','www.domain.com']);
	 */
	addAlias: function(name){
		
		var old = __NGN.clone(this.alias,true);
		this.onBeforeChange({
			type: 'alias::create',
			was: old,
			change: name 
		});
		
		name = name || [];
		if (!Array.isArray(name))
			name = [name];
		this.alias = this.alias.concat(name);
		
		this.onChange({
			type: 'alias::create',
			was: old,
			is: this.alias
		});
	},
	
	/**
	 * @method
	 * Remove an alias or aliases.
	 * @param {String/Array} alias
	 * A string or array of strings containing the alias names.
	 */
	removeAlias: function(name){
		
		var old = __NGN.clone(this.alias,true);
		this.onBeforeChange({
			type: 'alias::delete',
			was: old,
			change: name 
		});
		
		name = name || [];
		if (!Array.isArray(name))
			name = [name];
		for (var i=0;i<name.length;i++) {
			while (this.alias.indexOf(name[i]) !== -1){
				this.alias.slice(this.alias.indexOf(name[i]),this.alias.indexOf(name[i])+1);
			}
		}
		
		this.onChange({
			type: 'alias::delete',
			was: old,
			is: this.alias
		});
	},
	
	/**
	 * @method
	 * Determine whether a host name is an alias of this virtual host.
	 */
	isAlias: function(alias) {
		return this.alias.indexOf(alias) >= 0;
	},
    
    /**
	 * @method
	 * Add target(s) server to the round-robin queue.
	 * @param {String/Array} dest
	 * The destination server(s). These servers are immediately
	 * included in the round-robin load balancing queue.
	 */
	addTarget: function(dest){
		
		var old = __NGN.clone(this.target,true);
		this.onBeforeChange({
			type: 'target::create',
			was: old,
			change: dest
		});
		
		dest = dest || [];
		if (!Array.isArray(dest))
			dest = [dest];
		this.target = this.target.concat(dest);
		
		this.onChange({
			type: 'target::create',
			was: old,
			is: this.target
		});
	},
	
	/**
	 * @method
	 * The destination server(s) to remove. These servers
	 * are immediately removed from the round-robin load balancing
	 * queue. Any existing connections to these servers will
	 * remain intact. This operation only prevents any new connections
	 * from being made to the destination server(s).
	 * @param {String/Array} dest
	 * The destination server(s).
	 */
	removeTarget: function(dest){
		
		var old = __NGN.clone(this.target,true);
		this.onBeforeChange({
			type: 'target::delete',
			was: old,
			change: dest
		});
		
		dest = dest || [];
		if (!Array.isArray(dest))
			dest = [dest];
		while (dest.length > 0){
			var lb = dest.shift();
			this.target.splice(this.target.indexOf(lb),this.target.indexOf(lb)+1);
		}
		
		if (this.target.length == 0)
			this.onWarn('Virtual Host '+this.hostname+':'+this.port+' has no target servers. Proxying on this host may be unstable or fail.');
		
		this.onChange({
			type: 'target::delete',
			was: old,
			is: this.target
		});
		
	},
	
	/**
	 * @method
	 * Get the destination target based on the incoming request.
	 * This processes the rewrite rules and rotates the load balancer.
	 * @returns {String}
	 * Returns the server the request is destined for.
	 */
	getTarget: function(req) {
		
		// 1. Rewrite URL
		var url = require('url').parse('http'+(this.ssl==undefined?'':'s')+'//'+req.headers.host+':'+this.port+req.url);
		
		var m = req.method.toUpperCase(),
			r = this.rules[m];
		
		// All non-generic methods	
		if (r){
			for(var i=0;i<r.length;i++){
				req.url = r[i].rewrite(req.url,m);
				if (r[i].last && r[i].rewritten)
					return server;
			}
		}
		
		// All generic methods
		r = this.rules['ALL'];
		if (r) {
			for(var i=0;i<r.length;i++){
				req.url = r[i].rewrite(req.url,m);
				if (r[i].last && r[i].rewritten)
					return server;
			}
		}
		
		// 2. Get Target Server
		if (this.target.length > 1) {		
			var server = this.target.shift();
			this.target.push(server);
		} else {
			var server = this.target[0];
		}
		
		// 3. Return the destination
		return server;
	},
	
	/**
	 * @method
	 * Add a rewrite rule to the virtual host.
	 * @param {String} method
	 * GET, PUT, POST, DELETE, HEAD, or TRACE
	 * @param {RegExp} pattern
	 * The pattern that triggers the rule to reqrite the URL.
	 * @param {String} substitute
	 * The substitution string, as seen in NGN.web.proxy.RewriteRule#substitute
	 * @param {Boolean} [last=false]
	 * If this is `true` and the rule matches, all further rules will be ignored.
	 * @param {Number} [position]
	 * Specify a priority for the rule. For example, if this should be the
	 * first rule to process, the position would be `1`. By default, rules
	 * are appended to the end of the priority queue. 
	 */
	addRewriteRule: function(method,pattern,substitute,last,position){
		
		var old = __NGN.clone(this.rules,true);
		this.onBeforeChange({
			type: 'rule::create',
			was: old,
			change: {method:method,pattern:pattern,substitute:substitute,last:last}
		});
		
		method = method.toUpperCase();

		var opt = {
			method: 	method,
			pattern:	pattern
		};
		
		opt.last = __NGN.coalesce(last,false);
		
		if (substitute.toString().substr(substitute.toString().length-5).trim().toLowerCase() == '-last'){
			opt.last = true;
			substitute = substitute.toString().substr(0,substitute.toString().length-5);
		}
		
		opt.substitute = substitute;
		
		this.rules[method] = this.rules[method] || [];
		
		// Make sure the rule doesn't exist yet
		var ruleAlreadyExists = false;
		for (var rule=0; rule < this.rules[method].length; rule++){
			if (this.rules[method][rule].pattern == pattern
				&& this.rules[method][rule].substitute == substitute
				&& this.rules[method][rule].last == last) {
				
				ruleAlreadyExists = true;
				break;
					
			}
		}

		if (!ruleAlreadyExists) {
			
			// Insert the rule at a specific position or append it to the end.
			if (position)
				this.rules[method].splice(position,0,new __NGN.web.proxy.RewriteRule(opt));
			else
				this.rules[method].push(new __NGN.web.proxy.RewriteRule(opt));
		
			this.onChange({
				type: 'rule::create',
				was: old,
				is: this.rules
			});
		} else
			this.onAbortChange('rule::create','already exists');

	},
	
	/**
	 * @method
	 * Remove a rewrite rule. This compares the method, pattern, substitute, and
	 * last attributes of NGN.web.proxy.RewriteRule to determine which rule to remove. 
	 * @param {String} method
	 * GET, PUT, POST, DELETE, HEAD, or TRACE
	 * @param {RegExp} pattern
	 * The pattern that triggers the rule to reqrite the URL.
	 * @param {String} substitute
	 * The substitution string, as seen in NGN.web.proxy.RewriteRule#substitute
	 * @param {Boolean} [last=false]
	 * If this is `true` and the rule matches, all further rules will be ignored.
	 */
	removeRewriteRule: function(method,pattern,substitute,last){
		
		var old = __NGN.clone(this.rules,true);
		this.onBeforeChange({
			type: 'rule::delete',
			was: old,
			change: {method:method,pattern:pattern,substitute:substitute,last:last}
		});
		
		method = method.toUpperCase();

		var opt = {
			method: 	method,
			pattern:	pattern
		};
		
		opt.last = __NGN.coalesce(last,false);
		
		if (substitute.toString().substr(substitute.toString().length-5).trim().toLowerCase() == '-last'){
			opt.last = true;
			substitute = substitute.toString().substr(0,substitute.toString().length-5);
		}
		
		opt.substitute = substitute;
		
		for (var rule=0; rule < this.rules[method].length; rule++){
			if (this.rules[method][rule].pattern == pattern
				&& this.rules[method][rule].substitute == substitute
				&& this.rules[method][rule].last == last) {
			
				this.rules[method].splice(rule,rule+1);
				break;
					
			}
		}
		
		this.rules[method].push(new __NGN.web.proxy.RewriteRule(opt));
		
		this.onChange({
			type: 'rule::delete',
			was: old,
			is: this.rules
		});
		
	},
	
	/**
	 * @method
	 * Removes a rewrite rule by index number.
	 * @param {String} method
	 * POST, PUT, GET, DELETE, HEAD, or TRACE
	 * @param {Number} [index=0]
	 */
    removeRewriteRuleAt: function(method,index) {
    	index = index || 0;
    	this.rules[method].splice(index,index+1);
    },
    
    /**
     * @event warn
     * Fired when a warning is detected.
	 * @param {String} msg
	 * The warning message.
     */
    onWarn: function(msg){
    	this.emit('warn',msg||'Unknown Warning');
    },
    
    onError: function(e) {
    	this.fireError(e);
    },
    
    /**
     * @event nomatch
     * Fired when there are no virtual hosts matching the #hostname & #port.
     * This is the result of no a null response from the #datasource (i.e. query returned no records).
     */
    onNoMatch: function(){
    	this.emit('nomatch');
    },
    
    /**
     * @event change
     * Fired when a configuration change is detected.
     * @param {Boolean} [cache]
     * Flush the changes to the local cache.
     */
    onChange: function(cache){
    	cache = __NGN.coalesce(cache,false);
    	this.emit('change');
    },
    
    /**
     * @event beforechange
     * Fired before a configuration change is implemented.
     * @param {Object} [change]
     * The change object.
     */
    onBeforeChange: function(change){
    	this.emit('beforechange',change);
    },
    
    /**
     * @event abortchange
     * Fired when a change is aborted before it completes.
     * @param {String} [reason]
     */
	onAbortChange: function(reason){
		this.emit('abortchange',reason);
	}
});

module.exports = Class;