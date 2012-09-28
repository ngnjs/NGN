// Utilize Should.js
var should = require('should');
var client = new NGN.web.Client();	

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