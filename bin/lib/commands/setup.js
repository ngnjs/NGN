require('colors');
var Seq = require('seq'),
    read = require('read'),
    path = require('path'),
    OS = require('os'),
    isWin = OS.platform().toLowerCase().indexOf('win') !== -1,
    exists = false,
    npmg = path.join(process.env.APPDATA,'npm','node_modules'),
    libs = {
      "bcrypt":"Native strong encryption.",
      "seq":"Flow control.",
      "colors":"CLI color coding.",
      "optimist":"CLI utility.",
      "read":"CLI prompts.",
      "node-uuid":"UUID generation.",
      "wordwrap":"CLI text wrapping.",
      "log4js":"System logging (not apps)."
    },
    _libs = [];

try {
  var m = require(path.join(npmg,'ngn-mechanic'));
  exists = true;
} catch (e) {console.log(e)}
console.log(exists,path.join(npmg,'ngn-mechanic'));

// Check for Mechanic & offer to install it if it isn't already.
Seq()
  .seq(function(){
    
    console.log("\n--------------------------------------------".magenta.bold);
    console.log("|             Welcome to NGN               |".magenta.bold)
    console.log("--------------------------------------------\n".magenta.bold);

    console.log("You are about to setup NGN. This will setup");
    console.log("several global node modules used repeatedly");
    console.log("throughout NGN:\n");
    
    for (var item in libs){
      var title = item+':';
      for (var i=title.length;i<12;i++){
        title = title + ' ';
      }
      if(!require('fs').existsSync(path.join(npmg,item))){
        _libs.push(item.trim().toLowerCase());
        console.log(title.magenta.bold,libs[item]);
      } else {
        console.log(title.green,libs[item]+' (Installed)'.green);
      }
    };
    
    console.log("\nOnly the modules that are not already installed will be installed.");
    console.log("If you wish to use any of these in your projects, they can be installed");
    console.log("for a specific project using the "+"npm link <package>".bold.blue+" command in the project directory.\n");
    
    read({
      prompt:"Do you want to continue setting up NGN?",
      'default': "y"
    },this.into('proceed'));
  })
  .seq(function(){
    if (this.vars.proceed.trim().toLowerCase().substr(0,1) !== 'y'){
      process.exit();
    } else {
      if (_libs.length > 0){
        console.log('\nInstalling global modules...'.cyan);
        var exec = require("child_process").exec('npm install -g '+_libs.join().replace(/,/gi,' '),function(){
          console.log('Installation Complete.\n'.green.bold);
        });
      } else {
        console.log('\nGlobal modules already installed.\n'.blue);
      }
    }
  })
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
        global: true,
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