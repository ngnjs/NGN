var p = require('path'),
  pkg = require(p.join(__dirname,'..','..','package.json')),
  fs = require('fs'),
  exec = require('child_process').exec,
  events = require('events'),
  evt = new events.EventEmitter(),
  semver = require('semver'),
  installer = require('../lib/installer');
require('colors');

evt.on('updatemods',function(coreupdated){
  if (coreupdated){
    delete require.cache[p.join(__dirname,'..','..','package.json')];
    pkg = require(p.join(__dirname,'..','..','package.json'));
  }

  console.log(('NGN updated to version '+pkg.version).green.bold);
  console.log('Checking for updates...');

  // Loop through modules and update accordingly.
  for (var m in pkg.ngn.modules){
    installer.update(m);
  }
  if (fs.existsSync(p.join(__dirname,'../../../ngn-dev'))){
    installer.update('ngn-dev');
  }
});

// Check for core update
exec('npm show ngn version --silent',function(e,stdout,stderr){
  if (e) throw e;
  if (semver.lt(pkg.version,stdout)){
    console.log('Updating NGN Core...'.yellow.bold);
    installer.update('ngn',function(){
      evt.emit('updatemods',true);
    });
  } else {
    console.log(('The latest version of NGN, v'+pkg.version+', is already installed.').green.bold);
    evt.emit('updatemods',false);
  }
});