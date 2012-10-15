/** test
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
id: 'reverse_proxy',
    cache: cachepath // Optional
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
proxy: proxy
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
port: 80,
alias:	['www.mydomain.com'],
target:	['localhost:8901','localhost:8902'],
rules: {
GET: [
{'/test1/(.*)$':'/test/?v=1&fn=$1'},
{'/test2/(.*)$':'/test/?v=2&fn=$1'}
],
ALL: [
{'/(.*)$':'/test/$1'}
]
}
};

var client = new NGN.web.Client();
var root	= 'http://localhost:3000/proxy';

it('Starts up with no virtual hosts.',function(done){
client.GET(root+'/hosts',{json:true},function(err,res,body){
true.should.equal(body.length==0);
done();
})
});

// VIRTUALHOST: POST /host --- Should return 201
it('POST new virtual host)',function(done){
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
it('GET specific host',function(done){
client.GET(root+'/host/'+props.hostname+'/'+props.port,{json:true},function(err,res,body){
var domain = body;
true.should.equal(domain.hostname==props.hostname);
true.should.equal(domain.alias.length==props.alias.length);
true.should.equal(domain.port==props.port);
true.should.equal(Object.keys(domain.rules).length == Object.keys(props.rules).length);
done();
});
});

var smokin = 'www.smokin.com';

// ALIAS: POST /alias/<alias.com>/of/<domain.com>/<port>
it('POST an alias',function(done){
client.POST(root+'/alias/'+smokin+'/of/'+props.hostname+'/'+props.port,{json:true},function(err,res,body){
parseInt(res.statusCode).should.equal(201);
done();
});
});

// ALIAS: GET /host/<domain.com>/<port>/aliases
it('GET list of aliases',function(done){
client.GET(root+'/host/'+props.hostname+'/'+props.port+'/aliases',{json:true},function(err,res,body){
true.should.equal(props.alias[0]==body[0])
true.should.equal(smokin==body[1])
should.exist(body[1]);
should.not.exist(body[2]);
done();
})
});

// ALIAS: DELETE /alias/<alias.com>/of/<domain.com>/<port>
it('DELETE an alias',function(done){
client.DEL(root+'/alias/'+smokin+'/of/'+props.hostname+'/'+props.port, {json:true}, function(err,res,body){
parseInt(res.statusCode).should.equal(200);
})
client.GET(root+'/host/'+props.hostname+'/'+props.port+'/aliases',{json:true},function(err,res,body){
should.not.exist(body[1]);
})
done();
});

var target = 'www.ecorbiz.com';
var targetPort = '70';
it('POST a target',function(done){
client.POST(root+'/from/'+props.hostname+'/'+props.port+'/to/'+target+'/'+targetPort, {json:true}, function(err,res,body){
parseInt(res.statusCode).should.equal(201);
})

done();
});

// TARGET: GET /host/<domain.com>/<port>/targets
it('GET targets for a specific virtual host',function(done){
client.GET(root+'/host/'+props.hostname+'/'+props.port+'/targets',{json:true}, function(err,res,body){
var domain = body;
true.should.equal(props.target[0]==domain[0]);
true.should.equal(props.target[1]==domain[1]);
should.exist(domain[2]);
true.should.equal(domain[2]==target+':'+targetPort);
should.not.exist(domain[3]);

done();

});
});

// TARGET: DELETE /from/<domain.com>/<port>/to/<server.com>/<port>
it('DELETE a target',function(done){
client.DEL(root+'/from/'+props.hostname+'/'+props.port+'/to/'+target+'/'+targetPort, {json:true}, function(err,res,body){
parseInt(res.statusCode).should.equal(200);
})
client.GET(root+'/host/'+props.hostname+'/'+props.port+'/targets',{json:true}, function(err,res,body){
var domain = body;
should.not.exist(domain[2]);

});

done();
});

// REWRITE RULES: POST /host/<domain.com>/<port>/rule
it('POST a URL rewrite',function(done){

done();
});

// REWRITE RULES: GET /host/<domain.com>/<port>/rules
it('GET list of URL rewrites',function(done){
client.GET(root+'/host/'+props.hostname+'/'+props.port+'/rules',{json:true},function(err,res,body){
parseInt(res.statusCode).should.equal(200);
})
done();
});

// REWRITE RULES: DELETE /host/<domain.com>/<port>/rule/<method>/<index>
it('DELETE a specific rewrite',function(done){
client.DEL(root+'/host/'+props.hostname+'/'+props.port+'/rule/GET/1'), {json:true}, function(err,res,body){
parseInt(res.statusCode).should.equal(200);
}
done();
});

// REWRITE RULES: DELETE /host/<domain.com>/<port>/rules
it('DELETE all rewrite rules - purge',function(done){
client.DEL(root+'/host'+props.hostname+'/'+props.port+'/rules'), {json:true}, function(err,res,body){
parseInt(res.statusCode).should.equal(200);
}

done();
});

// VIRTUALHOST: DELETE /host/<domain.com>/<port>
it('DELETE virtual host',function(done){
client.DEL(root+'/host/'+props.hostname+'/'+props.port), {json:true}, function(err,res,body){
parseInt(res.statusCode).should.equal(200);
}

done();
});

});

// Cleanup cache.json file
try {
require('fs').unlink(cachepath);
} catch (e) {
}