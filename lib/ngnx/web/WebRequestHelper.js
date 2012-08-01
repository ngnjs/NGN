var Base = require('../../web/RequestProcessor');

/**
 * @class NGNX.web.WebRequestHelper
 * A request processor that creates several additional attributes on a request object. This is designed for making
 * it easier to write routes.
 * 
 * Provides the following additions to the request scope:
 * 
 * * **form**: An form or pre-parsed JSON body found in a `POST`, `PUT`, or `DELETE` request.
 * * **url**: Query string parameters passed in the URL.
 * * **route**: Any route variables available via route regex.
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
 * 				var usr = getUser(req.route.userid);
 * 				if (usr.email !== req.form.address)
 * 					throw Error();
 * 				else if (req.url.resend !== undefined){
 * 					if (req.url.resend)
 * 						usr.resendEmail();
 * 				}
 * 			}
 * 		}
 * 
 * This should be implemented as a NGN.web.Server#requestProcessor.
 * 
 * **Example**
 * 		var web = new NGN.web.Server({
 * 			port: 8181,
 * 			requestProcessor: new NGNX.web.WebRequestHelper()
 * 		});
 * @singleton
 * @extends NGN.web.RequestProcessor
 */

var Class = Base.extend({
	
	/**
	 * @constructor
	 * Create a new RequestAid middleware method.
	 * @returns {Function}
	 */
	constructor: function(){
		
		Class.super.constructor.call(this,{
			fn: function(req,res,cont){
				var ua = (req.headers['user-agent'] || '').toLowerCase();
				var uaParser = require('ua-parser');
				var b = uaParser.parse(ua);		
				
				req.form = 	req.method.trim().toUpperCase() == 'PUT' 
							|| req.method.trim().toUpperCase() == 'POST'
							|| req.method.trim().toUpperCase() == 'DELETE'
							? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body)
							: {};
				req.url		= req.query || {};
				req.route	= req.params || {};
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
								major: b.major,
								minor: b.minor,
								patch: b.patch,
								mobile: __NGN.pattern.isMobileDevice(ua)	
							};

				for(var el in req.route){
					if (req.form.hasOwnProperty(el))
						delete req.route[el];
					if (req.url.hasOwnProperty(el))
						delete req.route[el];

				}

				// Specific to web server
				if (res.locals) {
					res.locals({
						url: 		req.url,
						browser: 	req.browser
					});

					//if (global.application !== undefined)
					//	res.locals.application = global.application.toJson();

					if (req.form !== {})
						res.locals.form = req.form;
				}

				console.log('NGNX.WebRequestHelper is listening'.magenta);
				cont();
			}
		});
		
	}
	
});

module.exports = Class;