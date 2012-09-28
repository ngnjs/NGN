// Utilize Should.js
var should = require('should');
var client = new NGN.web.Client();	


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
	routes: __dirname+'/../routes'
});
	
describe('Dynamic Web Server',function(){
	
	it('NGN.web.Server should exist.',function(){
		should.exist(web);
		should.exist(client);
		web.start();
	});
	
	it('Server is running',function(done){
		web.running.should.equal(true);
		done();
	});
	
	it('Server responds with basic content provided by a route.',function(done){
		client.GET('http://localhost:'+port2+'/test',function(err,res,body){
			body.should.equal('Basic Test');
			done();
		});
	});
	
});