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

// Check first for a module
if (available.modules[mod] !== undefined){
  exec('npm install -g '+mod);
} else if (available.groups[mod] !== undefined){
  var cmd = [];
  console.log(('Adding '+available.groups[mod].length+' packages...').cyan.bold);
  available.groups[mod].forEach(function(ngnpkg){
    exec('npm install -g '+ngnpkg,function(){
      console.log(ngnpkg+' support added.'.green.bold);
    });
  });
} else if (mod.toString().trim().toLowerCase() === 'all'){
  console.log('Installing everything...'.cyan.bold);
  available.modules.forEach(function(ngnpkg){
    exec('npm install -g '+ngnpkg,function(){
      console.log(ngnpkg+' support added.'.green.bold);
    });
  });
} else {
  throw 'No module or group called \"'+mod+'\" is available.';
}
