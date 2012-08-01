var Base = require('../../web/Processor');

/**
 * @class NGNX.web.ApiRequestHelper
 * A request processor that creates several additional attributes on a request object. This is designed for making
 * it easier to write routes.
 * 
 * Provides the following additions to the request scope:
 * 
 * * **form**: An form or pre-parsed JSON body found in a `POST`, `PUT`, or `DELETE` request.
 * * **url**: Query string parameters passed in the URL.
 * * **route**: Any route variables available via route regex.
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
 * 					}
 * 			}
 * 		}
 * 
 * This should be implemented as a NGN.web.API#processor.
 * 
 * **Example**
 * 		var web = new NGN.web.API({
 * 			port: 8182,
 * 			processor: new NGNX.web.ApiRequestHelper()
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
			fn: function(req,res,cont){
				
				req.form = 	req.body !== undefined
							? (req.method.trim().toUpperCase() == 'PUT' 
								|| req.method.trim().toUpperCase() == 'POST'
								|| req.method.trim().toUpperCase() == 'DELETE'
								? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body)
								: {})
							: {};
				req.url		= req.query || {};
				req.route	= req.params || {};
				
				for(var el in req.route){
					if (req.form.hasOwnProperty(el))
						delete req.route[el];
					if (req.url.hasOwnProperty(el))
						delete req.route[el];

				}
				
				cont();
			}
		});
		
	}
	
});

module.exports = Class;