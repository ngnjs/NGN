var Base = require('../NGN.core');

/**
 * @class NGN.mail.Message
 * Represents an email message.
 * 
 * **Example**
 * 		var msg = new NGN.mail.Message({
 * 			service: new NGNX.mail.Gmail({username:'jdoe@gmail.com',password:'password1'})
 * 			from: 	'John Doe <jdoe@gmail.com>',
 * 			to:		'jane@jdoe.com',
 * 			subject:'Domain',
 * 			html:	'I am interested in purchasing jdoe.com. I will pay <b>cash money</b> for it!'
 * 		});
 * 		
 * 		msg.on('sent',function(id){
 * 			console.log('The inquiry was sent as message ID: '+id);
 * 		});
 * 		
 * 		msg.addAttachment(new NGN.mail.Attachment({
 * 			filepath: '/path/to/money.txt',
 * 			filename: 'BIG_Money.txt'
 * 		}));
 * 		
 * 		msg.send();
 * The code above would generate & send an email with both HTML and text versions (since #autoConvertHtml is `true` by default).
 * The local file at `path/to/money.txt` would be attached and named as `BIG_Money.txt`.
 * The console would display a notice of `The inquiry was set as message ID: <messageid>` once the operation is complete.
 * @uses NGN.core.MailTransport
 * @uses NGNX.mail.Common
 * @extends NGN.core
 */
var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new message.
	 * @param {Object} config
	 */
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {NGN.core.Transport} connection (required)
			 * Accepts any mail transport or any NGNX.mail.service connection.
			 * 
			 * **Example**
			 * 		new NGNX.mail.Gmail({username:'jdoe@gmail.com',password:'mypwd'});
			 */
			transport: {
				value:		config.connection || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [autoConvertHtml=true]
			 * When only HTML is specified for the message content, attempt to
			 * convert it to text for consumption by text-only email clients.
			 * If #text is provided, this is ignored.
			 */
			autoConvertHtml: {
				value:		__NGN.coalesce(config.autoConvertHtml,true),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} from (required)
			 * Accepts `Sender Name <sender@domain.com>` syntax, or the basic `sender@domain.com` email address.
			 */
			/**
			 * @property {String} from
			 * The sender email address.
			 */
			_from: {
				value:		null,
				enumerable:	false,
				writable:	true
			},
			
			from: {
				enumerable:	true,
				get:		function(){ return this._from; },
				set:		function(value) {
								//TODO: If a null value is passed, attempt to use the default from the application configuration (if applicable).
								this.validateAddressSyntax(value);
								this._from = value;
							}
			},
			
			/**
			 * @cfg {Boolean} [warnOnInvalidAddress=false]
			 * Fire a #warn event if an email address is invalid. Validity is determined by #validityPattern.
			 */
			warnOnInvalidAddress: {
				value:		__NGN.coalesce(config.warnOnInvalidAddress,false),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [errorOnInvalidAddress=true]
			 * Fire an error if an email address is invalid. Validity is determined by #validityPattern.
			 */
			errorOnInvalidAddress: {
				value:		__NGN.coalesce(config.warnOnInvalidAddress,true),
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {RegExp}
			 * The pattern used to determine a valid email address syntax. 
			 * 
			 * Uses the NGN.Pattern#email by default.
			 * @private
			 */
			validityPattern: {
				value:		config.mask || __NGN.pattern.email,
				enumerable:	true,
				writable:	true,
				configurable:true
			},
			
			/**
			 * @cfg {String/Array} to (required)
			 * Destination email address. Comma delimited list or array.
			 */
			/**
			 * @property {Array} to
			 * An array of destination email addresses.
			 */
			_to: {
				value:		null,
				enumerable:	false,
				writable:	true
			},
			
			to: {
				enumerable:	true,
				get:		function(){ return this._to; },
				set:		function(value){
								if (!Array.isArray(value))
									value = [value];
									
								for(var i=0;i<value.length;i++){
									this.validateAddressSyntax(value[i]);
								}
								
								this._to = value;
							}
			},
			
			/**
			 * @cfg {String/Array} cc
			 * CC cestination email address. Comma delimited list or array.
			 */
			/**
			 * @property {Array} cc
			 * An array of CC destination email addresses.
			 */
			_cc: {
				value:		null,
				enumerable:	true,
				writable:	true
			},
			
			cc: {
				enumerable:	true,
				get:		function(){ return this._cc; },
				set:		function(value){
								if (!Array.isArray(value))
									value = [value];
									
								for(var i=0;i<value.length;i++){
									this.validateAddressSyntax(value[i]);
								}
								
								this._cc = value;
							}
			},
			
			/**
			 * @cfg {String/Array} bcc
			 * BCC cestination email address. Comma delimited list or array.
			 */
			/**
			 * @property {Array} bcc
			 * An array of BCC destination email addresses.
			 */
			_bcc: {
				value:		null,
				enumerable:	true,
				writable:	true
			},
			
			bcc: {
				enumerable:	true,
				get:		function(){ return this._bcc; },
				set:		function(value){
								if (!Array.isArray(value))
									value = [value];
									
								for(var i=0;i<value.length;i++){
									this.validateAddressSyntax(value[i]);
								}
								
								this._bcc = value;
							}
			},
			
			/**
			 * @cfg {String}
			 * An email address that will be used for the `Reply-To` header.
			 * By default, this uses the value of #from.
			 */
			replyTo: {
				value:		config.replyTo || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [inReplyTo=null]
			 * The Message-ID this email is in reply to.
			 */
			inReplyTo: {
				value:		config.inReplyTo || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * Comma delimited list of Message-ID's associated with this email messages.
			 */
			references: {
				value:		config.references || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The subject of the message.
			 */
			subject: {
				value:		config.subject || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The plaintext version of the message.
			 */
			text: {
				value:		config.text || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The HTML version of the message. This can be automatically converted to text using #autoConvertHtml. 
			 */
			html: {
				value:		config.html || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Object} [headers=null]
			 * An object of additional header fields, such as `{"X-Key-Name": "key value"}` 
			 * **Notice:** Values are passed as is, you should do your own encoding to 7 bit (ascii) if needed.
			 */
			headers: {
				value:		config.headers || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String/Array} [attachments=[]]
			 * An Array of attachments.
			 * 
			 * The array can contain any of the following: NGN.mail.Attachment objects, filepaths, or stream source (ex: `fs.createReadStream('file.txt')`). 
			 * Any filepath or stream source will be automatically converted to a NGN.mail.Attachment object.
			 */
			_attachments: {
				value:		[],
				enumerable:	false,
				writable:	true
			},
			
			/**
			 * @property {Array}
			 * An array of NGN.mail.Attachment objects associated with the message.
			 */
			attachments: {
				enumerable:	true,
				get:		function(){ return this._attachments; },
				set:		function(value){
								if (value !== null){
									var a = value, b=[];
									if (!Array.isArray(a))
										a = [a];
									
									for(var i=0;i<a.length;a++){
										if (typeof a[i] === 'function') // Means this is an NGN object
											b.push(a[i]);
										else if (['object','string'].indexOf(typeof a[i]) >=0) // Means this is a stream source or filepath
											b.push(this.createAttachmentObject(a[i]));
									}
								} else
									this._attachments = [];
							}
			},
			
			/**
			 * @cfg {Object}
			 * Optionally specify the message envelope if the auto-prepared one is not suitable.
			 */
			envelope: {
				value:		config.envelope || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String/Boolean}
			 * Optional message-ID. A random ID is generated if this is not set. Set to false to omit
			 * the Message-ID in the message header. 
			 */
			messageId: {
				value:		config.messageId || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [encoding=quoted-printable]
			 * Optional transfer encoding.
			 */
			encoding: {
				value:		config.encoding || 'quoted-printable',
				enumerable:	true,
				writable:	true
			}
			
		});
		
		var me = this;
		
		if (typeof this.transport == 'string')
			this.transport = __NGN.getServer(this.transport);
	
		if (!this.transport)
			this.fireError('No mail transport/service specified.');
		
		
		this.transport.on('sent',function(id){
			me.onSent(id);
		});
		
		if (config.from)
			this.from = config.from;

		if (this._from == null && this.transport.auth !== undefined){
			if (this.transport.auth.username !== undefined) {
				if (__NGN.pattern.isEmail(this.transport.auth.username)){
					this.from = this.transport.auth.username;
				}
			}
		}
		
		if (!this.replyTo)
			this.replyTo = this.from;
			
		this.to = config.to;
			
		// Support attachments
		if (config.attachments){
			var a = config.attachments, b=[];
			if (!Array.isArray(a))
				a = [a];
			
			for(var i=0;i<a.length;a++){
				if (typeof a[i] === 'function') // Means this is an NGN object
					b.push(a[i]);
				else if (['object','string'].indexOf(typeof a[i]) >=0) // Means this is a stream source or filepath
					b.push(this.createAttachmentObject(a[i]));
			}
		}
	},
	
	/**
	 * @method
	 * Send the message using the specified #service.
	 * @param {Function} [callback]
	 */
	send: function(callback){
		
		// Make sure there is message content
		if (!this.html && !this.text)
			this.fireError('No message content.');
		
		// Assemble the message configuration.
		var o = {
			from: this._from,
			to: this._to.join(','),
			subject: this.subject || 'No Subject'
		};
		
		if (this.subject)
			o.subject = this.subject;
		if(this._cc)
			o.cc = this._cc.join(',');
		if(this._bcc)
			o.bcc = this._bcc.join(',');
		if(this.html)
			o.html = this.html;
		if(this.text)
			o.text = this.text;
		if(this.replyTo)
			o.replyTo = this.replyTo;
		if(this.inReplyTo)
			o.inReplyTo = this.inReplyTo;
		if(this.references)
			o.references = this.references;
		if(this.headers)
			o.headers = this.headers;
		if(this.envelope)
			o.envelope = this.envelope;
		if(this.messageId)
			o.messageId = this.messageId;
		if(this.encoding)
			o.encoding = this.encoding;
			
		// Support attachments
		for(var i=0;i<this.attachments.length;i++){
			if (o.attachments === undefined)
				o.attachments = [];
			var a = {};
			
			if(this.attachments[i].filename)
				a.filename = this.attachments[i].filename;
			if(this.attachments[i].filepath)
				a.filepath = this.attachments[i].filepath;
			if(this.attachments[i].content)
				a.contents = this.attachments[i].content;
			if(this.attachments[i].cid)
				a.cid = this.attachments[i].cid;
			if(typeof this.attachments[i].stream)
				a.streamSource = this.attachments[i].stream;
			if(this.attachments[i].contentType)
				a.contentType = this.attachments[i].contentType;
			if(this.attachments[i].contentDisposition)
				a.contentDisposition = this.attachments[i].contentDisposition;
			o.attachments.push(a);
		}
			
		// Configure message body parts (HTML/Text)
		o.generateTextFromHtml = (this.html && !this.text && this.autoConvertHtml);
		
		// Send Message
		this.transport.send(o,callback||__NGN.emptyFn);
	},
	
	/**
	 * @method
	 * Create an NGN.mail.Attachment object from a filepath or stream source
	 * @param {String/ReadableStream}
	 * @private
	 */
	createAttachmentObject: function(source,name){
		
		var nameSpecified = (name == null);
		name = name || __NGN.uuid.v1().replace('-','').substr(0,15)+'.txt';
		
		switch (typeof source){
			case 'object':
				return new __NGN.mail.Attachment({
					stream: source,
					filename: name
				});
				break;
			case 'string':
				var obj = {
					filepath: source
				};
				
				if (nameSpecified)
					obj.filename = name;
				return new __NGN.mail.Attachment(obj);
				break;
		}
	},
	
	/**
	 * @method
	 * Add an attachment to #attachments.
	 * @param {String/Array/NGN.mail.Attachment}
	 * A string or array of attachments.
	 * 
	 * The array can contain any of the following: NGN.mail.Attachment objects, filepaths, or stream source (ex: `fs.createReadStream('file.txt')`). 
	 * Any filepath or stream source will be automatically converted to a NGN.mail.Attachment object.
	 */
	addAttachment: function(value){
		if (!Array.isArray(value))
			value = [value];
			
		for(var i=0;i<value.length;a++){
				if (typeof value[i] === 'function') // Means this is an NGN object
					this._attachmnets.push(value[i]);
				else if (['object','string'].indexOf(typeof value[i]) >=0) // Means this is a stream source or filepath
					this._attachments.push(this.createAttachmentObject(value[i]));
			}
	},

	/**
	 * @method
	 * Remove an attachment
	 * @param {Number} index
	 * The 0-based number of the attachment to remove.
	 */
	removeAttachment: function(index) {
		this._attachments.splice(index,1);
	},
	
	/**
	 * @method
	 * Get the attachments.
	 * @return {Array}
	 */
	getAttachments: function() {
		return this._attachments;
	},
	
	/**
	 * @method
	 * Convenience method for clearing the attachments.
	 */
	clearAttachments: function(){
		this._attachments = [];
	},
	
	/**
	 * @method
	 * Validate the email address syntax.
	 * @param {String} addr
	 * The email address. This may be in standard format or `First Last <person@domain.com>` format.
	 * @param {Boolean} [sender=false]
	 * Indicates the address is associated with the sender.
	 * @private
	 */
	validateAddressSyntax: function(addr,sender){
		sender = sender || false;
		var valid = this.validityPattern.test(addr.replace(/^.*<|>.*$/,'').trim());
		
		if (this.warnOnInvalidAddress||this.errorOnInvalidAddress){
			if (!valid){
				if (this.errorOnInvalidAddress)
					this.fireError({message:'Invalid email address syntax',address:addr,sender:sender});
				if (this.warnOnInvalidAddress)
					this.onWarn({message:'Invalid email address syntax',address:addr,sender:sender});
			}
		}
		
		return valid;
	},
	
	/**
	 * @method
	 * Add a recipient to #to.
	 * @param {String/Array}
	 * The email address to add to #to as a recipient.
	 */
	addTo: function(address){
		if (!Array.isArray(address))
			address = [address];
		for(var i=0;i<address.length;i++){
			this.validateAddressSyntax(address[i]);
			this._to.push(address[i]);
		}
	},
	
	/**
	 * @method
	 * Remove a recipient from #to.
	 * @param {String/Array}
	 * The email address to remove from #to. Accepts multiple addresses via an array.
	 */
	removeTo: function(address){
		if (!Array.isArray(address))
			address = [address];
		for(var i=0;i<address.length;i++)
			this._to.splice(this._to.indexOf(address));
	},
	
	/**
	 * @method
	 * Add a #cc recipient.
	 * @param {String/Array}
	 * The email address to add as a #cc recipient.
	 */
	addCc: function(address){
		if (!Array.isArray(address))
			address = [address];
		for(var i=0;i<address.length;i++){
			this.validateAddressSyntax(address[i]);
			this._cc.push(address[i]);
		}
	},
	
	/**
	 * @method
	 * Remove a #cc recipient.
	 * @param {String/Array}
	 * The email address to remove from #cc list. Accepts multiple addresses via an array.
	 */
	removeCc: function(address){
		if (!Array.isArray(address))
			address = [address];
		for(var i=0;i<address.length;i++)
			this._cc.splice(this._to.indexOf(address));
	},
	
	/**
	 * @method
	 * Add a #bcc recipient.
	 * @param {String/Array}
	 * The email address to add as a #bcc recipient.
	 */
	addBcc: function(address){
		if (!Array.isArray(address))
			address = [address];
		for(var i=0;i<address.length;i++){
			this.validateAddressSyntax(address[i]);
			this._bcc.push(address[i]);
		}
	},
	
	/**
	 * @method
	 * Remove a #bcc recipient.
	 * @param {String/Array}
	 * The email address to remove from #bcc list. Accepts multiple addresses via an array.
	 */
	removeBcc: function(address){
		if (!Array.isArray(address))
			address = [address];
		for(var i=0;i<address.length;i++)
			this._bcc.splice(this._to.indexOf(address));
	},
	
	/**
	 * @event warn
	 * Fired when a warning is detected, such as invalid email address syntax.
	 * @param {Object} value
	 */
	onWarn: function(value){
		this.emit('warn',value);
	},
	
	/**
	 * @event sent
	 * Fired when the message has been successfully sent.
	 * @returns {Number} MessageId
	 */
	onSent: function(id){
		this.emit('sent',id||null);
	}
	
});

module.exports = Class;