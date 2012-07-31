require('../../');

var web = new NGN.web.Server({
	port: 8181,
	routes: './routes'
});

require('colors');

// Display a message on any status code.
web.on('xxx',function(www){
	console.log('Heard a status: '.green+www.code.toString().green.bold);
})

// Show the server stopped.
web.on('stop',function(){
	console.log('stopped'.red);
});

// Show the server started 
web.on('start',function(){
	console.log('started'.magenta);
	//web.stop();

	var c = new NGN.web.Client();

	c.on('beforeget',function(){
		console.log('before get'.magenta);
	});
	
	c.GET('http://localhost:'+web.port,function(a,b,c){
		console.log(c);
	});

});

