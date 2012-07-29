var Base = require('../NGN.core'),
	fs	 = require('fs');

/**
 * @class NGN.mail.Attachment
 * Represents an email attachment and provides convenience methods for managing it's attributes.
 * 
 * **Filepath Example**
 * 		var file = new NGN.mail.Attachment({
 * 			filepath: '/path/to/file.txt',
 * 			filename: 'profile.txt'
 * 		});
 * 
 * **URL Example**
 * 		var file = new NGN.mail.Attachment({
 * 			filepath: 'https://raw.github.com/andris9/Nodemailer/master/LICENSE',
 * 			filename: 'license.txt'
 * 		});
 * 
 * **Stream Example**
 * 		var file = new NGN.mail.Attachment({
 * 			stream: require('fs').createReadStream('/path/to/file.txt'),
 * 			filename: 'profile.txt'
 * 		});
 * 
 * This class is designed to be used with a NGN.mail.Message object.
 * @extends NGN.core
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		Class.super.constructor.call(this,config);
		
		Object.defineProperties(this,{
			
			/**
			 * @cfg {String}
			 * The filename to be reported as the name of the attached file. Unicode is supported on most (but not all)
			 * mail servers. 
			 * 
			 * If this is not specified, the filename of the #filepath will be used instead. If no filepath is provided
			 * & the attachment is a stream source, a random filename will be assigned with an assumed `.txt` extension. 
			 */
			filename: {
				value:		config.filename || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The filepath or URL of the attachment.
			 * 
			 * **Note:** A URL is streamed. This is a good alternative for larger attachments.
			 */
			filepath: {
				value:		config.filepath || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * An optional content ID for using inline images in HTML message sources.
			 */
			cid: {
				value:		config.cid || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String/Buffer}
			 * A string or buffer to be used as the file content.
			 */
			content: {
				value:		config.content || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String}
			 * The file content type. By default, this will be set to whatever type is specified in #filename
			 */
			contentType: {
				value:		config.contentType || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {String} [contentDisposition=attachment]
			 * Optionally change the content disposition type.
			 */
			contentDisposition: {
				value:		config.contentDisposition || 'attachment',
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {ReadableStream}
			 * Use a readable stream, such as `require('fs').createCreadStream('file.txt')` as the attachment source.
			 */
			stream: {
				value:		config.stream || null,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [warnOnMissingSource=true]
			 * Emit a #warn event if the attachment source is missing or not found.
			 */
			warnOnMissingFile: {
				value:		config.warnOnMissingSource || true,
				enumerable:	true,
				writable:	true
			},
			
			/**
			 * @cfg {Boolean} [errorOnMissingSource=true]
			 * Fire an error if the attachment source is missing or not found.
			 */
			errorOnMissingFile: {
				value:		config.errorOnMissingSource || true,
				enumerable:	true,
				writable:	true
			}
			
		});
	
		// Check to make sure a filepath exists
		if (this.warnOnMissingSource || this.errorOnMissingSource){
			// Make sure filepath exists
			if (this.filepath && this.filepath.indexOf('http') < 0){
				if (!fs.existsSync(this.filepath)){
					this.onWarn(this.filepath+' does not exist or cannot be found.');
					if (this.errorOnMissingSource)
						this.fireError(this.filepath+' does not exist or cannot be found.');
				} else
					this.content = null;
			} else if (this.filepath && this.filepath.indexOf('http') >= 0) {
				// If the filepath is a URL, don't check it.
				var c = new __NGN.web.Client(), me = this;
				
				c.HEAD(this.filepath,function(err,res,body){
					if (err){
						var msg = me.filepath+' does not exist or cannot be contacted. Please verify the URL and any authorization required to access it. This module only supports basic auth at this time.';
						me.onWarn(msg);
						if (me.errorOnMissingSource)
							me.fireError(msg);
					} else
						me.content = null
				});
			} else if (this.content) {
				if (typeof this.content !== 'object'){
					this.onWarn('Problem reading file stream or buffer.');
					if (this.errorOnMissingSource)
						this.fireError('Problem reading file stream or buffer.');
				}
			} else {
				this.fireError('No attachment provided. One of the following attributes must be defined in the NGN.mail.Attachment configuration: filepath, content.');
			}
		}
	},
	
	/**
	 * @event warn
	 * Fired when a warning is raised.
	 * @param {Object} meta
	 */
	onWarn: function(meta){
		if(this.onMissingSource)
			this.emit('warn',meta||null);
	}
	
});

module.exports = Class;
