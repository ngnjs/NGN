#!/usr/bin/env node
var optimist = require('optimist');

// AVAILABLE CLI OPTIONS
var opts = {
  'configure': 'Create or update the NGN configuration.',
  'init': 'Initialize a project directory for use with NGN.',
  'install': 'Install a NGN feature.',
  'uninstall': 'Remove a NGN feature.',
  'start': 'Start the NGN manager or a process.',
  'stop': 'Stop the manager or a process.',
  'create': 'Create a custom class, API, process, or documentation.',
  'version':'List the version of NGN installed on the system.',
  'help':'View help for a specific command.'
};

// AVAILABLE NGN MODULES			
var mods = [
  'manager','core','extensions','functions','examples','admin',
  'websockets','rest','web','static','logs',
  'deployer', 'dns'	//FUTURE ADDITIONS?
];

// Placeholder for the selected command
var cmd = null;

// CLI REQUIREMENTS
// Make sure at least one command option is selected.
var minOptions = function(argv){
	if (argv._.length > 0){
		cmd = argv._[0];
		argv[cmd] = argv._[1] || true;
		return true;
	}
	for (var term in opts){
		if (argv.hasOwnProperty(term)){
			cmd = term;
			return true;
		}
	}
	for (var _term in argv){
		if (_term !== '_' && _term !== '$0'){
			cmd = _term;
			break;
		}
	}
	optimist.describe(opts);
	if (cmd == null)
		throw('');
	throw('"'+cmd+'" is not a valid option.');
}

// Make sure the command option has the appropriate parameters which 
// are required to run.
var validOption = function(argv){
	switch (cmd.trim().toLowerCase()){
		// Make sure an installation/uninstall is using valid modules
		case 'uninstall':
		case 'install':
			if (mods.indexOf(argv[cmd].trim().toLowerCase()) < 0)
				throw('"'+argv[cmd]+'" is not a valid NGN module. Available modules include:\n\n   - '+mods.sort().toString().replace(/,/g,"\n   - "));
			break;
		
		// Make sure something is identified which needs to start/stop.
		case 'start':
		case 'stop':
			if (argv[cmd] === true)
				throw('Must specify the manager or a specific process.');
			break;
			
		// Make sure the CLI knows what it needs to create
		case 'create':
			if (argv[cmd] === true || ['class','docs','api'].indexOf(argv[cmd].trim().toLowerCase()) < 0)
				throw('"'+(argv[cmd] === true ? 'Blank' : argv[cmd])+'" is not a valid "create" option. Valid options are:\n  - class\n  - api');
			break;
			
		// All other options do not require additional parameters, or they
		// are not valid.
		default:
			// If the command options object contains the command, it is
			// recognized and processing continues.
			if (opts.hasOwnProperty(cmd))
				return true;
				
			// If the command is not recognized, the list of valid commands
			// is described and the usage/error is displayed.
			optimist.describe(opts);
			throw('"'+cmd+'" is not a valid option.')
	}
	return true;
}

// ARGUMENTS
var argv = optimist
			.alias('config','configuration')
			.usage('Usage: ngn <option>')
			.wrap(80)
			.check(minOptions)
			.check(validOption)
			.argv,
	p 	 = require('path'),
	cwd	 = process.cwd(),
	root = p.dirname(process.mainModule.filename);

// Include the appropriate command
require(require('path').join(process.cwd(),'bin','lib','commands',cmd));
return;

/**
 * Statics 
 */
var CREATE 			= argv['create'] || null,
	PUBLISH			= argv['publish'] || null,
	VERSION			= argv['version'] || argv['v'] || null,
	CFG				= argv['configuration'] || p.join(process.cwd(),'ngn.config.json'),
	OUT_DIR			= argv['output'] || p.join(cwd,'docs','manual'),
	HELP			= argv['help'] || argv['h'] || null,
	RUN				= argv._[0] || null;

// Version Request
if (VERSION) {
	pkg = require(require('path').resolve('./package.json'));
	console.log('NGN v'.bold+pkg.version.bold);
}

// Create things
if (CREATE) {
	RUN = null;
	switch(CREATE.toLowerCase()) {
		case null:
			break;
		case 'docs':
		case 'doc':
		case 'documentation':
			console.log('Documentation Generator'.cyan.underline);
			var dg = require('./lib/docBuilder')
			dg.build(argv);
			break;
		case 'class':
			console.log('Class Creation Wizard'.cyan.underline);
			var cls = require('./lib/classBuilder');
			cls.wizard();
			break;
		case 'api':
			console.log('Custom API Creation Wizard.'.cyan.underline);
			var api = require('./lib/apiBuilder');
			api.wizard();
			break;
		default:
			console.log(CREATE+' not recognized.');
	}
}

// Publish to an npm registry
if (PUBLISH){
	
	RUN = null;

	try {
		var cfg			= require('./config.json');
	} catch(e) {
		var cfg 		= {};
	}
	console.log('Publishing to npm Registry'.green);
	console.log(' >> Packaging...'.grey);
	
	var publicRegistry = ''//'http://registry.npmjs.org';
	var registry = cfg.npmregistry || publicRegistry;
	
	var pkg = require('../package.json');
	var v   = pkg.version || '0.0.0';
		
	var cmd = 'npm --registry '+registry+' publish';
	var cmd2= 'npm --registry '+registry+' tag '+pkg.name+'@'+v+' latest';

	console.log(' >> Publishing...'.grey);
	console.log('    + '.grey+cmd.blue);
	exec(cmd,{cwd:__dirname+'/../'},function(error, stdout, stderr){
		console.log(' >> Tagging Release...'.grey);
		console.log('    + '.grey+cmd2.blue);
		exec(cmd2,{cwd:__dirname+'/../'},function(e,so,se){
			console.log('Published as '.green.bold+pkg.name.green.bold.underline+' v'.green.underline+v.green.bold.underline);
		});
	});
}

if (RUN) {
	var exec = require('child_process').spawn;
	console.log(('Launching '+RUN+' with limited ES6 support...').grey);
	var shell = exec("node",['--harmony_proxies',RUN],{ 
			cwd: process.cwd,
			stdio: ['pipe', 'pipe', process.stdout]
		});
	
	/*shell.stderr.on('data',function(data){
		console.log(data);
	});*/
	
	//shell.stdout.on('')
}