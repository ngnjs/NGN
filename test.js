require('./');

//var p = new NGNX.test();

//var p = new NGN.app.Person();

//console.log('done');

NGN.DNS.resolveTxt('perkpals.com',function(e,a){
	if(e) throw e;
	console.log(a);
});
