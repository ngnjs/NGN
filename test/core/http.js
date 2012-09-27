// Include NGN (locally)

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
	routes: __dirname+'/../routes'
});
var client = new NGN.web.Client();	
	
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

var port3 = 8389;
var web3 = new NGN.web.Static({
	port: port3,
	root: __dirname+'/../routes/static',
	maxAssetAge: 8000
});

describe('Static Web Server',function(){
	
	it('NGN.web.Static should exist.',function(done){
		should.exist(web3);
		done();
	});
	
	it('Server responds with basic content provided by static directory.',function(done){
		client.GET('http://localhost:'+port3,function(err,res,body){
			body.should.include('Basic Test');
			res.should.have.status(200);
			res.should.be.html;
			res.headers.should.have.property('etag');
			res.headers.should.have.property('cache-control');
			res.headers.should.have.property('content-length');
			require('fs').readFile(__dirname+'/../routes/static/index.html','utf8',function(_err,data){
				parseInt(res.headers['content-length']).should.equal(data.length);
				done();
			});
		});
	});
});
	
	/**/
