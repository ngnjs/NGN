require('colors');
var cli = require('optimist'),
    p = require('path'),
    u = require('util'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Seq = require('seq'),
    read = require('read');

var available = require(p.join(process.mainModule.paths[0],'..','..','package.json')).ngn;

// Basic CLI
var argv = cli
		  .usage('Usage: ngn remove <module or group>')
		  .argv,
		mod = argv._.filter(function(value){return value !== 'remove'})[0];

// Global Package Installer
var uninstall = function(ngnpkg){
  exec('npm uninstall -g '+ngnpkg+' --json --loglevel=silent',function(err,stdout,stderr){
    try {
      // Handle edge case when gyp output screws up npm json format
      if (stdout.substr(0,1) !== '['){
        stdout = stdout.substr(stdout.indexOf('['),stdout.length);
      }
      var out = stdout.replace(/unbuild/gi,'').replace(/\s/).split('@');
      console.log((out[0].toString()+' support removed --> '+' v'+out[1].toString()).red.bold);
    } catch (e) {
      console.log('Module removed, but there were errors:'.yellow.bold);
      console.log(e.message.toString().yellow);
    }
  });
};

// Check first for a module or group and install/warn accordingly
if (available.modules[mod] !== undefined){
  uninstall(mod);
} else if (available.groups[mod] !== undefined){
  available.groups[mod].forEach(function(m){
    uninstall(m);
  });
} else if (['all','*'].indexOf(mod.toString().trim().toLowerCase()) >= 0){
  console.log(('Removing every add-on ('+Object.keys(available.modules).length.toString()+' total). This may take a few moments.').cyan.bold);
  for (var m in available.modules){
    uninstall(m);
  };
} else {
  throw 'No module or group called \"'+mod+'\" is available.';
}
