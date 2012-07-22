module.exports = {
	'/test': {
		'/more': {
			get: function(){
				res.write(url.toString());
				res.write('Testing more nested routes');
				/*for (var i in req){
					if (typeof req[i] !== 'function')
					res.write(i+'<hr>'+req[i].toString());
				}*/
				//console.log(req);
				//res.write(req.toString());
				res.end();
			}
		},
		'/more2':{
			get: function(){
				res.redirect('http://www.google.com');
			}
		},
		get: function(req,res){
			res.write('Basic Test');
			res.end();
		}
	},
	'/': {
		get: function(){
			res.end('Hello. I am root.');
		}
	},
	'/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/': {
		get: function(){
			res.end('Yo!');
		}
	}
}
