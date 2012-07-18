require('../../');
require('colors');

var ds = new NGN.datasource.MongoDB({
	name: 'mongotest',
	autoConnect: false,
	host: 'ds035147.mongolab.com',
	port: 35147,
	database: 'ngn_demo',
	username: 'ngn',
	password: 'ngn1'
});

// Show that the DSN is available via NGN namespace
console.log('NGN knows "mongotest" is a '.yellow+NGN.getDatasource('mongotest').type.yellow.underline+' datasource.'.yellow);

// Output a notice when the client is connected.
ds.on('connect',function(){
	console.log('Client is connecting...'.green);
});

// Listen for errors
ds.on('error',function(e){
	console.log('Error Detected'.red,e);
});

// Once the connection is established, insert some data.
ds.on('connected',function(){
	
	var client = ds.getClient();
	
	// Visually indicate the connection has been established.
	console.log('Connected!'.magenta);
	
	// Insert data
	client.collection('test', function(err, collection) {
		var doc = {
			key: 1,
			name: 'myTest'
		};
		
		collection.insert(doc,function(err, result){
			console.log('Record Saved:'.green);
			console.log(result);
			
			collection.remove({key:1},function(err2,result2){
				console.log('Record removed successfully:'.green);
				console.log('TEST COMPLETE'.grey);
			});
		});
	});

});

// Connect to the datasource.
ds.connect();

/**
 * Alternatively, autoConnect can be set to true,
 * or simply ignore (defaults to true).
 */