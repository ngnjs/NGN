require('../../');
require('colors');

var ds = new NGN.datasource.Redis({
	name: 'redistest',
	autoConnect: false
});

// Show that the DSN is available via NGN namespace
console.log('NGN knows "redistest" is a '.yellow+NGN.getDatasource('redistest').type.yellow.underline+' datasource.'.yellow);

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
	client.set('___test','testvalue');
	
	// Read the data and output to the console.
	client.get('___test',function(err,value){
		
		// Display the value
		console.log('The value is: '+value);
		
		// Cleanup by removing the record.
		client.del('___test',function(e){
			if (e)
				throw e;
		});
	});

});

// Connect to the datasource.
ds.connect();

/**
 * Alternatively, autoConnect can be set to true,
 * or simply ignore (defaults to true).
 */