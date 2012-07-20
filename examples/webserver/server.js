require('../../');

var web = new NGN.http.Server({
	port: 8181,
	routes: __dirname+'/routes'
});

require('colors');
web.on('xxx',function(www){
	console.log('Heard a status:'.green+www.code);
})
web.on('stop',function(){
	console.log('stopped'.red);
});
web.on('start',function(){
	console.log('started'.magenta);
	//web.stop();
});
