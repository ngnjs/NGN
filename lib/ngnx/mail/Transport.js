var Base = require('../../core/RemoteServer'),
	nodemailer = require('nodemailer');
/**
 * @class NGNX.mail.Transport
 * This is a wrapper around [nodemailer module](https://github.com/andris9/Nodemailer/) transports, 
 * which provide a wide set of features for interacting with different kinds of mail servers.
 * @extends NGN.core.RemoteServer
 * @private
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new mail server.
	 * @param {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
		
		/**
		 * @cfg {String} type
		 * Automatically set to MAIL.
		 * @readonly
		 * @static
		 * @private
		 */
		config.type = 'MAIL';
		config.purpose = 'Transport';
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String} [service=null]
			 * The type of transport/server to create. Using this will ignore
			 * the #host and #port configuration properties.
			 * 
			 * Several well-known mail services are supported. The
			 * [list of supported services](https://github.com/andris9/Nodemailer/#well-known-services-for-smtp)
			 * may change from time to time, but should only grow unless a service is discontinued.
			 * @private
			 */
			_service: {
				value:		config.service || null,
				enumerable:	false,
				writable:	true,
				configurable:true
			},
			
			service: {
				enumerable:	true,
				get:		function(){return this._service;}
			},
			
			_mailtype: {
				value:		config.serverType || 'SMTP',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [serverType=SMTP]
			 * The type of mail server to use. Valid types include:
			 * 
			 * * SMTP
			 * * SES (Amazon)
			 * * Sendmail (local)
			 * 
			 */
			serverType: {
				enumerable:	true,
				get:		function(){ return this._mailtype; },
				set:		function(value){
								switch(value.toString().trim().toLowerCase()){
									case 'smtp':
									case 'ses':
										this._mailtype = value.trim().toUpperCase();	
										break;
									case 'sendmail':
										this._mailtype = value.trim().toLowerCase();	
										break;
									default:
										throw Error(value+' is not a valid Mail Transport. Only SMTP, SES, and Sendmail are supported.');
										break;
								}
							}
			},
			
			/**
			 * @cfg {String} [host=localhost]
			 * Hostname or IP address of the server. This can be an SMTP server or a URL (ex: Amazon SES endpoint).
			 * Unnecessary if #_service is defined.
			 */
			
			/**
			 * @cfg {Number} [port=25]
			 * The port of the host server.
			 * Unnecessary if #service is defined.
			 */
			port: {
				value:		config.port || 25,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [secureConnection=false]
			 * Use SSL. If #port is configured to `587`, this is ignored and forced to `false`.
			 * SMTP connections established on port 587 start in insecure plain text mode and 
			 * are later upgraded with STARTTLS.
			 */
			secureConnection: {
				value:		this.port !== 587 ? config.secureConnection || false : false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [name=<machine_name>]
			 * The name of the client server.
			 */
			name: {
				value:		config.name || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Object} [auth=null]
			 * An object like:
			 * 
			 * 		{
			 * 			user: 'jdoe',
			 * 			pass: 'pwd1'
			 * 		}
			 * Alternatively, #XOAuth supports XOAuth tokens.
			 */
			auth: {
				value:		config.auth || null,
				enumerable:	true,
				writable:	true
			},
			
			_xoauth: {
				value:		{XOAuthToken:config.XOAuth || null},
				enumerable:	true,
				writable:	true
			},
			
			XOAuth: {
				enumerable:	true,
				get:		function(){return this._xoauth.XOAuthToken;},
				set:		function(value){
								this._xoauth.XOAuthToken = value;
							}
			},
			
			/**
			 * @cfg {Boolean} [ignoreTLS=false]
			 * Ignore server support for STARTTLS.
			 */
			ignoreTLS: {
				value:		config.ignoreTLS || false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [debug=false]
			 * Output client and server messages to the console.
			 */
			debug: {
				value:		config.debug || false,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Number} [maxConnections=5]
			 * The number of connections to keep in the pool.
			 */
			maxConnections: {
				value:		config.maxConnections || 5,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * AWS Access Key.
			 * Required when #type is `SES`.
			 */
			awsAccessKey: {
				value:		config.AWSAccessKey || null,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {String}
			 * AWS Secret Key.
			 * Required when #type is `SES`.
			 */
			awsSecret: {
				value:		config.AWSSecret || null,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {String} [path=sendmail]
			 * Path to the `sendmail` command. Only used when #type is `Sendmail`.
			 */
			path: {
				value:		config.path || 'sendmail',
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {Array} [args=[]]
			 * An optional array of extra command line options to pass the #path. Only used when #type is `Sendmail`.
			 * 
			 * **Example:** `["-f sender@example.com"]`
			 */
			args: {
				value:		config.args || [],
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {String}
			 * The domain name used for signing.
			 * Required when using DKIM.
			 */
			dkimDomainName: {
				value:		config.dkimDomainName || null,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {String}
			 * If you have set up a TXT record with DKIM public key at **zzz**._domainkey.example.com then `zzz` is the selector.
			 * If this is left blank, NGN will attempt to lookup the record using #dkimDomainName.
			 * Required when using DKIM.
			 */
			dkimKeySelector: {
				value:		config.dkimKeySelector || null,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {String}
			 * The path to the private key.
			 * 
			 * For example, `/path/to/key.pem`.
			 * 
			 * Required when using DKIM.
			 */
			dkimPrivateKey: {
				value:		config.dkimPrivateKey || null,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {String}
			 * Optional colon separated list of header fields to sign.
			 * By default all fields suggested by RFC4871 #5.5 are used.
			 */
			dkimHeaderFieldNames: {
				value:		config.dkimHeaderFieldNames || null,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {String} 
			 * The X_MAILER_NAME attribute.
			 * Defaults to the nodemailer author.
			 */
			mailerName: {
				value:		config.mailerName || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The X_MAILER_HOMEPAGE attribute.
			 * Defaults to the nodemailer author's website.
			 */
			mailerUrl: {
				value:		config.mailerUrl || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @property {Object}
			 * The raw transport object that is created when the object is constructed.
			 * @private
			 */
			_transport: {
				value:		null,
				enumerable:	true,
				writable:	true
			}
			
		});
		
	},
	
	/**
	 * @method
	 * Create the transport object & connect to the appropriate mail server.
	 * @private
	 */
	init: function(){
		var options = {};
		
		switch (this.serverType.toUpperCase()){
			case 'SMTP':
				// Configure Service-based Transport Options
				if (this._service !== null){
					options.service = this._service;
					if (this.auth !== null)
						options.auth = this.auth;
					else if (this._xoauth !== null)
						options.auth = this._xoauth;
				} else {
					options.host = this.host;
					options.port = this.port;
					options.secureConnection = this.secureConnection;
					options.ignoreTLS = this.ignoreTLS;
					options.debug = this.debug;
					options.maxConnections = this.maxConnections;
					
					if (this.name !== null)
						options.name = this.name;
						
					if (this.auth !== null)
						options.auth = this.auth;
					else if (this._xoauth !== null)
						options.auth = this._xoauth;
						
				}
				break;
			case 'SES':
				options.AWSAccessKeyID = this.awsAccessKey;
				options.AWSSecretKey = this.awsSecret;
				if (this.host !== 'localhost')
					options.ServiceUrl = this.host;
				break;
			case 'SENDMAIL':
				options.path = this.path;
				if (this.args.length > 0)
					options.args = this.args;
				break;
		}
		
		this._transport = nodemailer.createTransport(this.serverType,options);
		
		// Support DKIM
		if (this.dkimDomainName !== null){
			
			if (this.dkimKeySelector !== null){
				__NGN.DNS.resolveTxt(this.dkimKeySelector+'._domainkey.'+this.dkimDomainName,function(err, addresses){
					if (err) this.fireError(err);
					if (addresses.length == 0)
						this.fireError('Could not resolve DKIM key at '+this.dkimKeySelector+'._domainkey.'+this.dkimDomainName);
					this.useDKIM();
				});
			} else {
				console.log('DKIM lookup has not been implemented yet. Bug the author on Github to add it if you need it. Suggest the ndns module.');
				this.useDKIM();
			}
			
		}
		
		this.running = true;
	},
	
	/**
	 * @method
	 * Enable DKIM signing.
	 * @private
	 */
	useDKIM: function(){
		
		var opt = {
			domainName: this.dkimDomainName,
			keySelector: this.dkimKeySelector,
			privateKey: require('fs').readFileSync(this.dkimPrivateKey) //TODO: Make it possible to use a relative path.
		};
		
		if (this.dkimHeaderFieldNames !== null)
			opt.headerFieldNames = this.dkimHeaderFieldNames;
		this._transport.useDKIM(opt);
	},
	
	/**
	 * @method
	 * Generate an XOAuth token.
	 * 
	 * **Gmail Example** (Other options commented out)
	 * 
	 * 		{
	 *	        user: "test.nodemailer@gmail.com",
	 *	        // requestUrl: "https://oauth.access.point",
	 *	        // consumerKey: "anonymous",
	 *	        // consumerSecret: "anonymous",
	 *	        token: "1/O_HgoO4h2uOUfpus0V--7mygICXrQQ0ZajB3ZH52KqM",
	 *	        tokenSecret: "_mUBkIwNPnfQBUIWrJrpXJ0c"
	 *	    }
	 * 
	 * @param {Object} config
	 */
	generateXOAuthToken: function(config){
		config = config || {};
		return nodemailer.createXOAuthGenerator(config);
	},
	
	/**
	 * @method
	 * Terminate pooled connections. Only used when #mailtype is `SMTP`.
	 */
	close: function(){
		if (this.running && this.serverType == 'SMTP') {
			this._transport.close();
		}
	},
	
	/**
	 * @method
	 * Send an email message
	 * @param {NGN.mail.Message/Object} message
	 * This can be a valid NGN.mail.Message or a direct JSON object.
	 */
	send: function(message){
		var me = this;
		this._transport.sendMail(message,function(error, response){
			//TODO: Wrap this in a proper logger.
		    if(error){
		        me.emit('error',error);
		    }else{
		        console.log("Message sent: " + response.message);
		    }
		});
	}
});

module.exports = Class;
