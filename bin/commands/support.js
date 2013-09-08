require('colors');
var cli = require('optimist'),
    p = require('path'),
    u = require('util'),
    fs = require('fs');

var available = require(p.join(process.mainModule.paths[0],'..','..','package.json')).ngn;

// Basic CLI
var argv = cli
		  .usage('Usage: ngn support <module or group>')
		  .argv,
		mod = argv._.filter(function(value){return value !== 'support'})[0];

// Check first for a module
if (available.modules[mod] !== undefined){
  exec('npm install -g '+mod);
} else if (available.groups[mod] !== undefined){
  console.log('Install '+mod+' group.');
  var cmd = [];
  available.groups[mod].forEach(function(ngnpkg){
    exec('npm install -g '+ngnpkg,function(){
      console.log(ngnpkg+' support added.');
    });
  });
} else {
  throw 'No module or group called \"'+mod+'\" is available.';
}

console.log('proceed');
