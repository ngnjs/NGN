require('../../');

var web = new NGN.web.Server({
	port: 8181,
	routes: __dirname+'/routes'
});

require('colors');
web.on('xxx',function(www){
	console.log('Heard a status: '.green+www.code.toString().green.bold);
})
web.on('stop',function(){
	console.log('stopped'.red);
});
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

