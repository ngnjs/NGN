#!/usr/bin/env node

var path = require('path'),
    fs = require('fs'),
    optimist = require('optimist'),
    exec = require('child_process').exec,
    pkg = require(path.join(process.mainModule.paths[0],'..','..','package.json'));

// AVAILABLE CLI OPTIONS
var base = {
  'init': 'Initialize a project directory for use with NGN.',
  'add': 'Add an NGN feature.',
  'remove': 'Remove an NGN feature.',
  'uninstall': 'Remove NGN completely.',
  /*
  'start': 'Start the NGN manager or a process.',
  'stop': 'Stop the manager or a process.',
  'create': 'Create a custom class, API, process, or documentation.',
  */
  'version':'List the version of NGN installed on the system.',
  'help':'View help for a specific command.'
  //'mechanic': 'Open the NGN Mechanic shell.',
  //'repair': 'Repair an existing NGN installation.',
};

var shortcuts = {
  'v': 'version',
  'h': 'help'
};

var opts = {};
for(var o in base){
  opts[o] = base[o];
}

// Optional CLI Options
var opt = {
  'ngn-dev': {
    'develop': 'Auto-restart processes when the file changes. (Dev Tool)',
  }
}

// Add optional CLI options if they're installed.
for (var mod in opt){
  if (fs.existsSync(path.join(__dirname,'..','..','ngn-dev'))){
    for (var m in opt[mod]){
      opts[m] = opt[mod][m];
    }
  }
}

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

	if (cmd in shortcuts){
	  cmd = shortcuts[cmd];
	  return true;
	}

	throw('"'+cmd+'" is not a valid option.');
};

// Make sure the command option has the appropriate parameters which
// are required to run.
var validOption = function(argv){
	switch (cmd.trim().toLowerCase()){
		case 'uninstall':
		  return true;
		case 'unsupport':
		case 'support':
      if (typeof argv[cmd] == 'boolean'){
        argv[cmd] = '';
      }
			break;

		// Make sure the CLI knows what it needs to create
		case 'create':
			if (argv[cmd] === true || ['class','docs','api'].indexOf(argv[cmd].trim().toLowerCase()) < 0){
				throw('"'+(argv[cmd] === true ? 'Blank' : argv[cmd])+'" is not a valid "create" option. Valid options are:\n  - class\n  - api');
			}
			break;

    case 'start':
    case 'stop':
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
			.usage('Usage: ngn <option>')
			.wrap(80)
			.check(minOptions)
			.check(validOption)
			.argv,
  p    = require('path'),
  cwd  = process.cwd(),
	root = p.dirname(process.mainModule.filename);

// Include the appropriate command
if (cmd in base){
  require(require('path').join(__dirname,'commands',cmd));
} else {
  for (var pkg in opt){
    if (opt[pkg][cmd] !== undefined){
      require(require('path').join(__dirname,'..','..',pkg))[cmd]();
      break;
    }
  }
}
return;