var http = require('http'),
    sockjs = require('sockjs'),
    fs = require('fs'),
    path = require('path');

// Create a log viewer
var ws = sockjs.createServer();
ws.on('connection', function(conn) {
  console.log('Connected?')
  conn.on('data', function(message) {
      conn.write(message);
  });
  conn.on('close', function() {
    console.log('Closed')
  });
});

var html = fs.readFileSync(path.join(__dirname,'index.html')),
    css = fs.readFileSync(path.join(__dirname,'main.css'));

// Web Server
var www = http.createServer(function (req, res) {
  console.log(req.url);
  switch(req.url.toLowerCase()){
    case '/main.css':
      res.writeHead(200, {'Content-Type': 'text/css'});
      res.end(css);
      return;
    default:
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
      return;
  }
});

www.addListener('upgrade', function(req,res){
  res.end();
});

ws.installHandlers(www, {prefix:'/logs'});
www.listen(8500, '0.0.0.0');