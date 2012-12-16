require('colors');
var Seq = require('seq'),
    read = require('read'),
    path = require('path'),
    OS = require('os'),
    isWin = OS.platform().toLowerCase().indexOf('win') !== -1,
    exists = false;

try {
  var m = require('ngn-mechanic');
  exists = true;
} catch (e) {}

// Check for Mechanic & offer to install it if it isn't already.
Seq()
  .seq(function(){
    if (!exists){
      console.log("You are about to setup NGN Mechanic, the NGN server agent.".cyan.bold);
      console.log('This should only take a few minutes.'.cyan);
      read({
        prompt:'Do you want to setup NGN Mechanic Now?',
        'default':'y'
      },this.into('proceed'));
    } else {
      console.log('NGN Mechanic is already installed.'.cyan.bold);
      read({
        prompt: 'Reinstall?',
        'default': 'n'
      },this.into('reinstall'));
    }
  })
  .seq(function(){
    if (this.vars.hasOwnProperty('reinstall')){
      if (this.vars.reinstall.trim().toLowerCase() == 'y'){
        this.vars.proceed = 'y';
      } else {
        this.vars.proceed = 'n';
      }
    }
    if (this.vars.proceed.trim().toLowerCase() !== 'y' && this.vars.proceed.trim().toLowerCase() !== 'yes' && !this.vars.hasOwnProperty('reinstall')){
      process.exit();
    }
    if (this.vars.proceed == 'y'){
      var npm = require(path.join(__dirname,'..','cli-utils')),
          cfg = require(path.join(__dirname,'..','..','.config.json'));
      npm.installer({
        package: 'ngn-mechanic',
        name: 'Mechanic',
        registry: cfg.npmregistry
      },function(next){
        require('./configure');
      });
    } else {
      read({
        prompt: 'Do you want to reconfigure NGN Mechanic?',
        'default': 'y'
      },this.into('reconfig'));
    }
  })
  .seq(function(){
    if (this.vars.hasOwnProperty('reconfig')){
      if (this.vars.reconfig.trim().toLowerCase() == 'y' || this.vars.reconfig.trim().toLowerCase() == 'yes'){
        require('./configure');
      } else {
        process.exit();
      }
    } else {
      console.log('Done!'.green.bold);
    }
  });

// Configure Mechanic if installed