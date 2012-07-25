// Include NGN (locally)
require('../'); 

// Utilize Should.js
var should = require('should');


/**
 * Make sure web server can be created & used by a client.
 */
var port = 8387;
var web = new NGN.web.Server({
	port: port,
	autoStart: false
});

var port2 = 8388;
var web2 = new NGN.web.Server({
	port: port2,
	routes: __dirname+'/routes'
});
var client = new NGN.web.Client();	
	
describe('new NGN.web.Server()',function(){
	
	it('should exist.',function(){
		should.exist(web);
		should.exist(client);
		web.start();
	});
	
});

	
describe('NGN.web.Server',function(){
	
	it('should be running',function(done){
		web.running.should.equal(true);
		done();
	});
});

describe('Configured NGN.web.Server',function(){
	it('should respond with basic content provided by a route.',function(done){
		
		client.GET('http://localhost:'+port2+'/test',function(err,res,body){
			body.should.equal('Basic Test');
			done();
		});
		
	});
});
	
	/**/
