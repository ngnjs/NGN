var Base = require('../../web/Processor');

/**
 * @class NGNX.web.WebRequestHelper
 * A request processor that creates several additional attributes on a request object. This is designed for making
 * it easier to process routes.
 * 
 * Provides the following additions to the request scope:
 * 
 * * **form**: An form or pre-parsed JSON body found in a `POST`, `PUT`, or `DELETE` request.
 * * **qs**: Query string parameters passed in the URL.
 * * **cgi**: On object containing `path_info`, `user_agent`, `method`, & `http_accept`.
 * * **browser**: On object containing `name`, `version`, `family`, `major`, `minor`, `patch`, & `mobile`.
 * 
 * _Example route.js_
 * 
 * `POST http://localhost/:userid/token?resend=true`
 * 
 * `{"address":"jdoe@doe.com"}`
 * 
 * 		'/:user': {
 * 			post: function(req,res){
 * 				var usr = getUser(req.route.params.userid);
 * 				if (usr.email !== req.form.address)
 * 					throw Error();
 * 				else if (req.url.resend !== undefined){
 * 					if (req.url.resend)
 * 						usr.resendEmail();
 * 				}
 * 			}
 * 		}
 * 
 * This should be implemented as a NGN.web.Server#processor.
 * 
 * **Example**
 * 		var web = new NGN.web.Server({
 * 			port: 8181,
 * 			processor: new NGNX.web.WebRequestHelper()
 * 		});
 * @singleton
 * @extends NGN.web.Processor
 */

var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new RequestAid middleware method.
	 * @returns {Function}
	 */
	constructor: function(){
		
		Class.super.constructor.call(this,{
			fn: function(req,res,next){
				var ua = (req.headers['user-agent'] || '').toLowerCase();
				var uaParser = require('ua-parser');
				var b = uaParser.parse(ua);		
				
				req.form = 	req.method.trim().toUpperCase() == 'PUT' 
							|| req.method.trim().toUpperCase() == 'POST'
							|| req.method.trim().toUpperCase() == 'DELETE'
							? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body)
							: {};
				req.qs		= req.query || {};
				req.cgi		= {
								path_info: req.url,
								user_agent: ua,
								method: req.originalMethod || __req.method,
								'http_accept': req.headers.accept !== undefined ? req.headers.accept.split(',') : []
							};
				req.browser	= {
								name: b.toString(),
								version: b.toVersionString(),
								family:	b.family,
								major: b.major || null,
								minor: b.minor || null,
								patch: b.patch || null,
								mobile: __NGN.pattern.isMobileDevice(ua)	
							};

				// Specific to web server
				if (res.locals) {
					res.locals({
						url: 		req.url,
						browser: 	req.browser
					});

					if (global.application !== undefined)
						res.locals.application = global.application.toJson();

					if (req.form !== {})
						res.locals.form = req.form;
				}

				next();
			}
		});
		
	}
	
});

module.exports = Class;