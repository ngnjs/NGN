module.exports = {
'/test': {
'/more': {
get: function(req,res){
res.write(url.toString());
res.write('Testing more nested routes');
res.end();
}
},
'/redirect':{
get: function(req,res){
res.redirect('http://www.google.com');
}
},
get: function(req,res){
res.write('Basic Test');
res.end();
}
},
'/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/': {
get: function(req,res){
res.end('Yo!');
}
},
'/': {
get: function(req,res){
res.end('Hello. I am root.');
}
}
}