require('colors');
var Seq = require('seq'),
  read = require('read'),
  exec = require('child_process').exec,
  p = require('path');

new Seq()
  .seq(function () {
    console.log('You are about to uninstall NGN.'.bold.red);
    console.log('This will remove all features, configurations, and saved data.'.bold.red);
    console.log('\nThis will '.yellow + 'NOT'.bold.yellow + ' remove your applications,'.yellow);
    console.log('but they '.bold.yellow + 'may no longer run'.bold.yellow + '.');
    console.log('\nTHIS CANNOT BE UNDONE!!'.bold.magenta.underline + '\n');
    read({
      prompt: 'Do you want to continue uninstalling NGN?',
      'default': 'n'
    }, this.into('uninstall'));
  })
  .seq(function () {
    if (this.vars.uninstall.trim().substr(0, 1).toLowerCase() !== 'y') {
      console.log('Uninstall aborted.'.cyan);
    } else {
      var mods = require(p.join(__dirname, '..', '..', 'package.json')).ngn.modules;
      for (var mod in mods) {
        if (mods.hasOwnProperty(mod){
          exec('npm uninstall -g ' + mod, function (err) {
            if (err) { throw err; }
          });
        }
      }
      console.log('NGN is removing everything. However; you must manually remove');
      console.log('the main executable using the following command:\n');
      console.log('npm uninstall -g ngn'.yellow.bold);
    }
  });
