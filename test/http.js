// Include NGN (locally)
require('../'); 

// Utilize Should.js
var should = require('should');


/**
 * Make sure web server can be created & used by a client.
 */
describe('NGN.web.Server',function(){
	
	var port = 8387;
	var web = new NGN.web.Server({
		port: port
	});
	
	var d = null;
	
	web.on('beforeget',function(){
		require('colors');
		console.log('Heard a GET'.green);
	});
	
	web.on('stop',function(done){
		web.routes = __dirname+'/../examples/webserver/routes';			
		web.start();
		d();
	});
	
	var client = new NGN.web.Client();
	
	
	it('should respond with generic view when no route is provided.',function(done){
		client.GET('http://localhost:'+port,function(err,res,body){
			body.should.equal('The web server works, but no routes have been configured.');
			d = done;
			web.stop();
		});
	});
	
	it('should respond with basic content provided by a route.',function(done){
		
		client.GET('http://localhost:'+port+'/test',function(err,res,body){
			console.log(err);
			body.should.equal('Basic Test');
			done();
		});
		
	});

});