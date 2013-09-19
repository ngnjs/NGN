var events = require('events'),
  exec = require('child_process').exec,
  p = require('path'),
  fs = require('fs'),
  semver = require('semver');

var install = function(pkg,term){
  term = term || 'added';
  exec('npm install -g '+pkg+' --json --loglevel=silent',function(err,stdout,stderr){
    try {
      // Handle edge case when gyp output screws up npm json format
      if (stdout.substr(0,1) !== '['){
        stdout = stdout.substr(stdout.indexOf('['),stdout.length);
      }
      var out = JSON.parse(stdout)[0];
      console.log((out.name.toString()+' support '+term+' --> '+' v'+out.version).green.bold);
    } catch (e) {
      console.log('Module installed, but may have errors:'.yellow.bold);
      console.log(e.message.toString().yellow);
    }
  });
};

var getVersion = function(pkg,callback){
  exec('npm show '+pkg+' version --silent',function(err,stdo,stde){
    if (err) throw err;
    callback(stdo);
  });
};

var obj = {

  // Global Package Installer
  install: function(ngnpkg){
    var evt = new events.EventEmitter();

    evt.on('install',install);

    if (fs.existsSync(p.join(__dirname,'..','..','..',ngnpkg))){
      var currv = require(p.join(__dirname,'..','..','..',ngnpkg,'package.json')).version;

      console.log((ngnpkg+' version '+currv+' is already installed.\n').yellow+('Checking for updates...').yellow.bold);

      getVersion(ngnpkg,function(stdo){
        if (semver.lt(currv,stdo)){
          console.log((('A new version ('+stdo.toString().trim()).green.bold+') is available. Update in progress...'.green.bold));
          evt.emit('install',ngnpkg);
        } else {
          console.log(currv.toString().yellow.bold+' is the latest version.'.yellow);
          return;
        }
      });
    } else {
      evt.emit('install',ngnpkg);
    }
  },

  // Global Package Uninstaller
  uninstall: function(ngnpkg,callback){
    exec('npm uninstall -g '+ngnpkg,function(err,out,serr){
      callback && callback();
    });
  },

  // Global package updater
  update: function(ngnpkg){
    var path = p.join(__dirname,'..','..','..',ngnpkg);
    if (fs.existsSync(path)){
      var currv = require(p.join(path,'package.json')).version;
      getVersion(ngnpkg,function(stdo){
        if (err) throw err;
        obj.uninstall(ngnpkg,function(){
          obj.install(ngnpkg,'updated');
        });
      });
    } else {
      console.log((ngnpkg+' is not installed.').red.bold);
    }
  }
};

module.exports = obj;
