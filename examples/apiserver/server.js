require('../../');
require('colors');

var eyes 	= require('eyes');
var api 	= new NGN.web.API({
				port: 8181,
				routes: __dirname+'/routes'
			});

// Alert when the API stops
api.on('stop',function(){
	console.log('API Stopped'.red);
});

// Alert whenever a request is processed
api.on('xxx',function(code){
	console.log('Got a response: '.green.underline,code.code.toString().trim().green.bold.underline);
});

// When the server starts, get data from the root.
api.on('start',function(){
	console.log('API Started'.yellow);
	
	var c = new NGN.web.Client();

	c.GET('http://localhost:'+api.port,function(err,res,body){
		eyes.inspect(JSON.parse(body));
	});

});

