require('colors');
var cli = require('optimist'),
    p = require('path'),
    u = require('util'),
    fs = require('fs'),
    exec = require('child_process').exec;

var available = require(p.join(process.mainModule.paths[0],'..','..','package.json')).ngn;

// Basic CLI
var argv = cli
		  .usage('Usage: ngn support <module or group>')
		  .argv,
		mod = argv._.filter(function(value){return value !== 'add'})[0];

// Global Package Installer
var install = function(ngnpkg){
  exec('npm install -g '+ngnpkg+' --json --loglevel=silent',function(err,stdout,stderr){
    try {
      // Handle edge case when gyp output screws up npm json format
      if (stdout.substr(0,1) !== '['){
        stdout = stdout.substr(stdout.indexOf('['),stdout.length);
      }
      var out = JSON.parse(stdout)[0];
      console.log((out.name.toString()+' v'+out.version+' support added.').green.bold);
    } catch (e) {
      console.log('Module installed, but may have errors:'.yellow.bold);
      console.log(e.message.toString().yellow);
    }
  });
};

// Check first for a module or group and install/warn accordingly
if (available.modules[mod] !== undefined){
  exec('npm install -g '+mod);
} else if (available.groups[mod] !== undefined){
  var cmd = [];
  console.log(('Adding '+available.groups[mod].length+' package'+(available.groups[mod].length==1?'':'s')+'...').cyan.bold);
  for (var i=0;i<available.groups[mod].length;i++){
    install(available.groups[mod][i]);
  };
} else if (['all','*'].indexOf(mod.toString().trim().toLowerCase()) >= 0){
  console.log('Installing every add-on...'.cyan.bold+' (this may take a few moments)');
  for (var ngnpkg in available.modules){
    install(ngnpkg);
  };
} else {
  throw 'No module or group called \"'+mod+'\" is available.';
}
