/**
 * Make sure the NGN global namespace is available.
 */
var should = require('should');

var cachepath = 'test/data/proxy/cache.json';

try {
	require('fs').unlink(cachepath);
	console.log('Cleaned up test file: '.grey.italic+cachepath.grey.italic);
} catch (e) {
}

var proxy = new NGNX.web.Proxy({
	id: 		'reverse_proxy',
    cache: 		cachepath // Optional
});

describe('Extended Proxy Controller', function(){
	
	it('In Ready State',function(done){
		proxy.on('ready',function(){
			Object.keys(proxy.vhost).length.should.equal(0);
			done();
		})
		proxy.start();
	});
	
	it('Create controller',function(done){
		var controller = new NGNX.web.ProxyController({
	        autoStart: false,
	        proxy:  proxy
	    });

    	controller.on('ready',function(){
			done();
	    });

	    controller.start();
	});
	
});

// REST Tests
describe('Proxy REST Endpoints',function(){

	var props	= {
					hostname:	'mydomain.com',
					port: 		80,
					alias:		['www.mydomain.com'],
					target:		['localhost:8901','localhost:8902'],
					rules: 		{
				                    GET: [
				                        {'/test1/(.*)$':'/test/?v=1&fn=$1'},
				                        {'/test2/(.*)$':'/test/?v=2&fn=$1'}
				                    ],
				                    ALL: [
				                        {'/(.*)$':'/test/$1'}
				                    ]
				                }
				};

	var client 	= new NGN.web.Client();
	var root	= 'http://localhost:3000/proxy';
	
	it('Starts up with no virtual hosts.',function(done){
		client.GET(root+'/hosts',{json:true},function(err,res,body){
			true.should.equal(body.length==0);
			done();
		})
	});
	
	// VIRTUALHOST: POST /host --- Should return 201
	it('POST /host (create new virtual host)',function(done){
		client.POST(
			root+'/host',
			{json: props},
			function(err,res,body){
				// Make sure the return status code is 201
				parseInt(res.statusCode).should.equal(201);
				done();
			}
		);
	});
	
	// ALL VIRTUALHOSTs: GET /hosts --- Should return a single virtual host
	it('GET /hosts (verify new host properties)',function(done){
		// Make sure the proxy controller responds with the new proxy config.
		client.GET(root+'/hosts',{json:true},function(_err,_res,_body){
			var domain = _body[0][props.hostname];
			true.should.equal(_body.length==1);
			true.should.equal(domain.hostname==props.hostname);
			true.should.equal(domain.alias.length==props.alias.length);
			true.should.equal(domain.port==props.port);
			true.should.equal(Object.keys(domain.rules).length == Object.keys(props.rules).length);
			done();
		});
	});
	
	// VIRTUALHOST: GET /host/<domain>/<port> --- Should return a specific host
	it('GET /host/<domain>/<port> (get specific host)',function(done){
		client.GET(root+'/host/'+props.hostname+'/'+props.port,{json:true},function(err,res,body){
			var domain = body;
			true.should.equal(domain.hostname==props.hostname);
			true.should.equal(domain.alias.length==props.alias.length);
			true.should.equal(domain.port==props.port);
			true.should.equal(Object.keys(domain.rules).length == Object.keys(props.rules).length);
			done();
		});
	});
	
	// ALIAS: POST /alias/<alias.com>/of/<domain.com>/<port>
	it('POST /alias/<alias.com>/of/<domain.com>/<port> (create an alias)',function(done){
		done();
	});
	
	// ALIAS: GET /host/<domain.com>/<port>/aliases
	it('GET /host/<domain.com>/<port>/aliases (list aliases)',function(done){
		done();
	});
	
	// ALIAS: DELETE /alias/<alias.com>/of/<domain.com>/<port>
	it('DELETE /alias/<alias.com>/of/<domain.com>/<port> (delete an alias)',function(done){
		done();
	});
	
	// TARGET: POST /from/<domain.com>/<port>/to/<server.com>/<port>
	it('POST /from/<domain.com>/<port>/to/<server.com>/<port> (create a target)',function(done){
		done();
	});
	
	// TARGET: GET /host/<domain.com>/<port>/targets
	it('GET /host/<domain.com>/<port>/targets (list targets for a specific virtual host)',function(done){
		done();
	});
	
	// TARGET: DELETE /from/<domain.com>/<port>/to/<server.com>/<port>
	it('DELETE /from/<domain.com>/<port>/to/<server.com>/<port> (delete a target)',function(done){
		done();
	});
	
	// REWRITE RULES: POST /host/<domain.com>/<port>/rule
	it('POST /host/<domain.com>/<port>/rule (create a rewrite)',function(done){
		done();
	});
	
	// REWRITE RULES: GET /host/<domain.com>/<port>/rules
	it('GET /host/<domain.com>/<port>/rules (list rewrites)',function(done){
		done();
	});
	
	// REWRITE RULES: DELETE /host/<domain.com>/<port>/rule/<method>/<index>
	it('DELETE /host/<domain.com>/<port>/rule/<method>/<index> (delete a specific rewrite)',function(done){
		done();
	});
	
	// REWRITE RULES: DELETE /host/<domain.com>/<port>/rules
	it('DELETE /host/<domain.com>/<port>/rules (delete all rewrite rules - purge)',function(done){
		done();
	});
	
	// VIRTUALHOST: DELETE /host/<domain.com>/<port>
	it('DELETE /host/<domain.com>/<port> (delete a virtual host)',function(done){
		done();
	});
	
	
});

// Cleanup cache.json file
try {
	require('fs').unlink(cachepath);
} catch (e) {
}