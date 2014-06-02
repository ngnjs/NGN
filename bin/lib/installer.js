var events = require('events'),
  exec = require('child_process').exec,
  p = require('path'),
  fs = require('fs'),
  semver = require('semver');

var install = function (pkg, term) {
  term = term || 'added';
  exec('npm install -g ' + pkg + ' --json --loglevel=silent', function (err, stdout) {
    try {
      // Handle edge case when gyp output screws up npm json format
      if (stdout.substr(0, 1) !== '[') {
        stdout = stdout.substr(stdout.indexOf('['), stdout.length);
      }
      var out = JSON.parse(stdout)[0];
      console.log((out.name.toString() + ' support ' + term + ' --> ' + ' v' + out.version).green.bold);
    } catch (e) {
      console.log('Module installed, but may have errors:'.yellow.bold);
      console.log(e.message.toString().yellow);
    }
  });
};

var getVersion = function (pkg, callback) {
  exec('npm show ' + pkg + ' version --silent', function (err, stdo) {
    if (err) {
      throw err;
    }
    callback(stdo);
  });
};

var obj = {

  // Global Package Installer
  install: function (ngnpkg) {
    var evt = new events.EventEmitter();

    evt.on('install', install);

    if (fs.existsSync(p.join(__dirname, '..', '..', '..', ngnpkg))) {
      var currv = require(p.join(__dirname, '..', '..', '..', ngnpkg, 'package.json')).version;

      console.log((ngnpkg + ' version ' + currv + ' is already installed.').yellow);

      getVersion(ngnpkg, function (stdo) {
        if (semver.lt(currv, stdo)) {
          console.log((('A new version (' + stdo.toString().trim()).green.bold + ') of ' + ngnpkg + ' is available. Updating...'.green.bold));
          obj.update(ngnpkg, function (updated, _pkg) {
            if (updated) {
              console.log((_pkg + ' updated successfully.').green.bold);
            } else {
              console.log((_pkg + ' could not be updated.').red);
            }
          });
        } else {
          return;
        }
      });
    } else {
      evt.emit('install', ngnpkg);
    }
  },

  // Global Package Uninstaller
  uninstall: function (ngnpkg, callback) {
    exec('npm uninstall -g ' + ngnpkg, function() {
      callback && callback(ngnpkg);
    });
  },

  // Global package updater
  update: function (ngnpkg, callback) {
    var path = p.join(__dirname, '..', '..', '..', ngnpkg);
    if (fs.existsSync(path)) {
      var currv = require(p.join(path, 'package.json')).version;
      getVersion(ngnpkg, function (stdo) {
        if (semver.lt(currv, stdo)) {
          obj.uninstall(ngnpkg, function () {
            obj.install(ngnpkg, 'updated');
            callback && callback(true, ngnpkg);
          });
        } else {
          callback && callback(false, ngnpkg);
        }
      });
    } else {
      console.log((ngnpkg + ' is not installed.').red.bold);
    }
  }
};

module.exports = obj;
