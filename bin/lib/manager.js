var forever = require('forever-monitor'),
	path	= require('path'),
	cfg		= require(path.resolve('./.config/manager.json')),
	npm		= require('npm'),
	logs	= require('log4js');

// Setup Logging
logs.configure({
	appenders:[
		{type: 'console'},
		{
			type: 'file',
			filename: 'logs/ngn-manager.log',
			category: 'ngn-manager',
			maxLogSize: 20480,
        backups: 10
		}
	]
});

var log = logs.getLogger('ngn-manager');

// Create the child process for the manager
var child = new forever.Monitor('core.js',{
	sourceDir: path.join(__dirname,'manager'),
	options: ['--harmony'],
	uid: 'ngn-manager'
});

// Handle Restart
child.on('restart',function(){
	log.warn('Restarted');
});

// Handle Exit
child.on('exit',function(){
	log.info('NGN Manager Exited');
});

// Handle Error
child.on('error',function(err){
	console.log(err);
	log.error(err.message);
});

// Standard out/err
child.on('stdout',function(data){
	log.trace(data.toString());
});
child.on('stderr',function(data){
	log.error(data.toString());
});

// Handle Stop
child.on('stop',function(){
	log.info('Stopped');
});

// Startup the process
log.info('Starting Process');
child.on('start',function(data,proc){
	log.info('Started as "'+proc.uid+'": pid#'+proc.pid+', forever pid#'+proc.foreverPid);
});
child.start();
