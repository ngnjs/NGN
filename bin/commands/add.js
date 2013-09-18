require('colors');
var cli = require('optimist'),
    p = require('path'),
    u = require('util'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Seq = require('seq'),
    read = require('read'),
    events = require('events');

var available = require(p.join(process.mainModule.paths[0],'..','..','package.json')).ngn;

// Basic CLI
var argv = cli
		  .usage('Usage: ngn add <module or group>')
		  .argv,
		mod = argv._.filter(function(value){return value !== 'add';})[0];

// Global Package Installer
var install = function(ngnpkg){
  var evt = new events.EventEmitter();

  evt.on('install',function(pkg){
    exec('npm install -g '+pkg+' --json --loglevel=silent',function(err,stdout,stderr){
      try {
        // Handle edge case when gyp output screws up npm json format
        if (stdout.substr(0,1) !== '['){
          stdout = stdout.substr(stdout.indexOf('['),stdout.length);
        }
        var out = JSON.parse(stdout)[0];
        console.log((out.name.toString()+' support added --> '+' v'+out.version).green.bold);
      } catch (e) {
        console.log('Module installed, but may have errors:'.yellow.bold);
        console.log(e.message.toString().yellow);
      }
    });
  });

  if (fs.existsSync(p.join(__dirname,'..','..','..',ngnpkg))){
    var semver = require('semver'),
      currv = require(p.join(__dirname,'..','..','..',ngnpkg,'package.json')).version;

    console.log((ngnpkg+' version '+currv+' is already installed.\n').yellow+('Checking for updates...').yellow.bold);
    exec('npm show '+ngnpkg+' version --silent',function(err,stdo,stde){
      if (err) throw err;
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
};

// Check first for a module or group and install/warn accordingly
if (available.modules[mod] !== undefined){
  install(mod);
} else if (available.groups[mod] !== undefined){
  available.groups[mod].forEach(function(m){
    install(m);
  });
} else if (['all'/*,'*'*/].indexOf(mod.toString().trim().toLowerCase()) >= 0){
  console.log(('Installing every add-on ('+Object.keys(available.modules).length.toString()+' total). This may take a few moments.').cyan.bold);
  for (var m in available.modules){
    install(m);
  };
} else {
  console.log(('No module or group called \"'+mod+'\" is available.').red.bold);
}
