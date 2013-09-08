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
    exec('npm install -g '+ngnpkg,function(){
      console.log(ngnpkg+' support added.'.green.bold);
    });
  };
} else if (['all','*'].indexOf(mod.toString().trim().toLowerCase()) >= 0){
  console.log('Installing everything...'.cyan.bold);
  for (var ngnpkg in available.modules){
    exec('npm install -g '+ngnpkg,function(){});
  };
} else {
  throw 'No module or group called \"'+mod+'\" is available.';
}
