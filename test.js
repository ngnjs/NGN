require('./');
/*var express = require('express');

var web = express();

web.get('/',function(req,res){
	res.end('Yo!');
});

web.listen(3000);
*/

var port = 8387;
	var web = new NGN.web.Server({
		port: port,
	routes: __dirname+'/examples/webserver/routes'
	});

var client = new NGN.web.Client();

client.GET('http://localhost:'+port+'/test',function(err,res,body){
console.log(body);
		});
