var p = require('path'),
  pkg = require(p.join(__dirname,'..','..','package.json')),
  fs = require('fs'),
  exec = require('child_process').exec,
  events = require('events'),
  evt = new events.EventEmitter(),
  semver = require('semver'),
  installer = require('../lib/installer');
require('colors');

evt.on('updatemods',function(core){
  if (core.updated){
    delete require.cache[p.join(__dirname,'..','..','package.json')];
    pkg = require(p.join(__dirname,'..','..','package.json'));
    console.log(('NGN updated to version '+pkg.version).green.bold);
  }

  console.log('Checking for updates...');

  // Loop through modules and update accordingly.
  for (var m in pkg.ngn.modules){
    installer.update(m,function(updated){
      if (updated){
        console.log((m+' updated successfully.').green.bold);
      } else {
        console.log((m+' does not require an update..').green);
      }
    });
  }
  if (fs.existsSync(p.join(__dirname,'../../../ngn-dev'))){
    installer.update('ngn-dev',function(updated){
      if (updated){
        console.log(('ngn-dev updated successfully.').green.bold);
      } else {
        console.log(('ngn-dev does not require an update..').green);
      }
    });
  }
});

// Check for core update
exec('npm show ngn version --silent',function(e,stdout,stderr){
  if (e) throw e;
  if (semver.lt(pkg.version,stdout)){
    console.log('Updating NGN Core...'.yellow.bold);
    installer.update('ngn',function(){
      evt.emit('updatemods',{updated: true});
    });
  } else {
    console.log(('The latest version of NGN, v'+pkg.version+', is already installed.').green.bold);
    evt.emit('updatemods',{updated: false});
  }
});