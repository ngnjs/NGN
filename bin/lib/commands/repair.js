require('colors');
var Seq = require('seq'),
    read = require('read'),
    path = require('path'),
    fs = require('fs'),
    exec = require("child_process").exec,
    execSync = require('exec-sync'),
    OS = require('os'),
    isWin = OS.platform().toLowerCase().indexOf('win') !== -1,
    exists = false,
    npmg = path.join(NGN.npm.globalDirectory,'node_modules'),
    libs = require('../modules.json'),
    _libs = [],
    unlinked = [],
    cfg = require(path.join(__dirname,'..','..','.config.json'));

exists = fs.existsSync(path.join(npmg,'ngn-mechanic'));

// Check for Mechanic & offer to install it if it isn't already.
Seq()
  .seq(function(){
    
    console.log("\n--------------------------------------------".blue.bold);
    console.log("|        NGN is repairing iteself.         |".blue.bold)
    console.log("--------------------------------------------\n".blue.bold);

    console.log('Checking NGN modules...');
    if (!fs.existsSync(path.join(npmg,'ngn-daemon'))){
      NGN.npm.installer({
        package:'ngn-daemon',
        name: 'NGN Daemon',
        global: true,
        registry: cfg.npmregistry
      },function(){
        exec('npm link ngn-daemon',path.join(npmg,'ngn'),function(){});
      });
    }

    console.log('Checking global modules...');    
    for (var item in libs){
      var title = item+':',
          linked = false;
      for (var i=title.length;i<12;i++){
        title = title + ' ';
      }
      if(!require('fs').existsSync(path.join(npmg,item))){
        _libs.push(item.trim().toLowerCase());
      } else {
        linked = ['optimist'].indexOf(item) < 0 
                  ? require('fs').existsSync(path.join(npmg,'ngn-mechanic','node_modules',item))
                  : require('fs').existsSync(path.join(npmg,'ngn','node_modules',item));
        if (!linked){
          unlinked.push(item);
        }
      }
    };

    this();
  })
  .seq(function(){
      if (_libs.length > 0){
        console.log('\nInstalling missing global modules...'.yellow);
        var currLib = null;
        try {
          _libs.forEach(function(lib){
            currLib = lib;
            console.log((' >> Installing '+lib.bold).yellow+' -> '+libs[lib]);
            execSync('npm --loglevel silent install -g '+lib);
          });
        } catch (execErr){
          console.log(('\nError: '.bold+'Could not build '+currLib.bold+'... ').red);
          console.log('\nPlease try a manual installation by typing:\n'+('npm install -g '+currLib).bold);
          console.log('\nOnce '+currLib+' is installed, run the repair again.');
          console.log('\n** Some packages may require elevated privileges. **');
          process.exit(1);
        }
      }
      console.log('Checking module mappings...');
      if (unlinked.length > 0){
        unlinked.forEach(function(lib){
            NGN.npm.globalLink('ngn',lib);
        });
      }
      this();
  })
  .seq(function(){
    if (unlinked.length > 0 || _libs.length > 0){
      console.log('\nNGN was successfully repaired.'.green.bold);
    } else {
      console.log('\nNo repair required.'.blue.bold);
    }
    if (!exists){
      console.log(("\nNGN Mechanic is not installed.".bold+' This is recommended, but not required.\n').cyan);
      read({
        prompt:'Do you want to setup NGN Mechanic Now?',
        'default':'y'
      },this.into('proceed'));
    } else {
      process.exit();
    }
  })
  .seq(function(){
    if (this.vars.proceed.trim().toLowerCase().substring(0,1) !== 'y'){
      process.exit();
    }
    NGN.npm.installer({
      package: 'ngn-mechanic',
      name: 'Mechanic',
      global: true,
      registry: cfg.npmregistry
    },function(next){
      console.log("Mapping NGN Mechanic modules.".cyan);
      exec('npm link bcrypt seq read colors',{cwd:path.join(npmg,'ngn-mechanic')},function(){
        console.log('Finished.'.green);
        require('./configure');
      });
    });
  });