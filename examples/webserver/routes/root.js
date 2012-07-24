module.exports = {
	'/test': {
		'/more': {
			get: function(){
				res.write(url.toString());
				res.write('Testing more nested routes');
				res.end();
			}
		},
		'/redirect':{
			get: function(){
				res.redirect('http://www.google.com');
			}
		},
		get: function(req,res){
			res.write('Basic Test');
			res.end();
		}
	},
	'/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/': {
		get: function(){
			res.end('Yo!');
		}
	},
	'/': {
		get: function(){
			res.end('Hello. I am root.');
		}
	}
}
