var net = require('net'),
	path= require('path'),
	cfg = require(path.resolve('./.config/manager.json'));

// Establish a TCP Socket Server
net.createServer(function(channel){
	
	channel.setEncoding('utf8');
		
	// When a new channel is created
	channel.on('connection',function(connection){
		console.log('CHANNEL OPENED: '.cyan,connection);
		channel.write('Hello!');
	});
	
	channel.on('data',function(data){
		channel.write('Data: '+data);
	});
	
	// Server Disconnected
	channel.on('end',function(){
		console.log('Server Disconnected'.red);
	});
	
	// Close the channel
	channel.on('close',function(data){
		console.log('CHANNEL CLOSED: '.red,channel.remoteAddress+':'+channel.remotePort);
	});
	
}).listen(cfg.port,function(){
	console.log('NGN Manager running on port '+cfg.port.toString());
});