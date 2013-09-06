var cli = require('optimist'),
    p = require('path'),
    u = require('util'),
    fs = require('fs');

var available = require(p.join(process.mainModule.paths[0],'..','..','package.json')).ngn;
      /*
      if (mods.indexOf(argv[cmd].trim().toLowerCase()) < 0){
              throw('"'+argv[cmd]+'" is not a valid NGN module. Available modules include:\n\n   - '+mods.sort().toString().replace(/,/g,"\n   - "));
            }*/


require('colors');

// Basic CLI
var argv = cli
		  .usage('Usage: ngn install <module or group>')
		  .argv,
		mod = argv._.filter(function(value){return value !== 'install'})[0];

// Check first for a module
if (available.modules[mod] !== undefined){
  console.log('Install '+mod);
} else if (available.groups[mod] !== undefined){
  console.log('Install '+mod+' group.');
} else {
  throw 'No module or group called \"'+mod+'\" is available.';
}

console.log('proceed');
