// Include NGN (locally)
require('../'); 

// Utilize Should.js
var should = require('should');


/**
 * Make sure datasource connections can be created.
 */
describe('NGN.http.Server',function(){
	
	var port = 8387;
	var web = new NGN.http.Server({
		port: port
	});
	
	var client = new NGN.http.Client();
	
	it('should respond with generic view when no route is provided.',function(done){
		client.GET('http://localhost:'+port,function(err,res,body){
			body.should.equal('The web server works, but no routes have been configured.');
			done();
		});
	});
	
	web.stop();
	web.routes = __dirname+'/../examples/webserver/routes';
	web.start();
	
	it('should respond to the view.',function(done){
		client.GET('http://localhost:'+port,function(err,res,body){
			body.should.equal('Basic Test');
			done();
		})
	})
	
});

