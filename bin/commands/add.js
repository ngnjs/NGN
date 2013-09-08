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
  console.log(('Adding '+available.groups[mod].length+' package'+(available.groups[mod].length==1?'':'s')+'...').cyan.bold);
  for (var i=0;i<available.groups[mod].length;i++){
    var ngnpkg = available.groups[mod][i];
    exec('npm install -g '+ngnpkg,function(err,stdout,stderr){
      try {
        var out = JSON.parse(stdout)[0];
        console.log((out.name.toString()+' v'+out.version+' support added.').green.bold);
      } catch (e) {
        console.log('Module installed, but may have errors:'.yellow.bold);
        console.log(e.message.toString().yellow);
      }
    });
  };
} else if (['all','*'].indexOf(mod.toString().trim().toLowerCase()) >= 0){
  console.log('Installing every add on...'.cyan.bold);
  for (var ngnpkg in available.modules){
    exec('npm install -g '+ngnpkg+' --json --loglevel=silent',function(err,stdout,stderr){
      try {
        var out = JSON.parse(stdout)[0];
        console.log((out.name.toString()+' v'+out.version+' support added.').green.bold);
      } catch (e) {
        console.log('Module installed, but may have errors:'.yellow.bold);
        console.log(e.message.toString().yellow);
      }
    });
  };
} else {
  throw 'No module or group called \"'+mod+'\" is available.';
}
