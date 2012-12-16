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
  'help':'View help for a specific command.',
  'mechanic': 'Open the NGN Mechanic shell.'
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
	if (cmd == null){
		throw('');
	}
	throw('"'+cmd+'" is not a valid option.');
};

// Make sure the command option has the appropriate parameters which 
// are required to run.
var validOption = function(argv){
	switch (cmd.trim().toLowerCase()){
		// Make sure an installation/uninstall is using valid modules
		case 'uninstall':
		case 'install':
			if (mods.indexOf(argv[cmd].trim().toLowerCase()) < 0){
				throw('"'+argv[cmd]+'" is not a valid NGN module. Available modules include:\n\n   - '+mods.sort().toString().replace(/,/g,"\n   - "));
			}
			break;
		
		// Make sure something is identified which needs to start/stop.
		case 'start':
		case 'stop':
			if (argv[cmd] === true){
				throw('Must specify the manager or a specific process.');
			}
			break;
			
		// Make sure the CLI knows what it needs to create
		case 'create':
			if (argv[cmd] === true || ['class','docs','api'].indexOf(argv[cmd].trim().toLowerCase()) < 0){
				throw('"'+(argv[cmd] === true ? 'Blank' : argv[cmd])+'" is not a valid "create" option. Valid options are:\n  - class\n  - api');
			}
			break;
		
		case 'setup':
		  return true;
      	
		// All other options do not require additional parameters, or they
		// are not valid.
		default:
			// If the command options object contains the command, it is
			// recognized and processing continues.
			if (opts.hasOwnProperty(cmd)) {
				return true;
      }

			// If the command is not recognized, the list of valid commands
			// is described and the usage/error is displayed.
			optimist.describe(opts);
			throw('"'+cmd+'" is not a valid option.');
	}
	return true;
};

// ARGUMENTS
var argv = optimist
			.alias('config','configuration')
			.usage('Usage: ngn <option>')
			.wrap(80)
			.check(minOptions)
			.check(validOption)
			.argv,
  p    = require('path'),
  cwd  = process.cwd(),
	root = p.dirname(process.mainModule.filename);

console.log(''); // Visual spacer

// Include the appropriate command
require(require('path').join(__dirname,'lib','commands',cmd));
return;