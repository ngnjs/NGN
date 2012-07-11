require('./');

NGN.createDatasource('test',new NGN.datasource.Redis({
    host:       'webteammate.com',
    password:   'W3bT34mm4te'
}));

var client = new NGN.http.Client()

NGN.on('beforeget',function(){
	console.log('I heard a GET');
})

client.on('beforeget',function(){
	console.log('dealio?')
});

client.GET('http://www.google.com',function(e,d){
	//console.log(e,d)
});

//console.log('client:',client);
