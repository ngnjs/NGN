var util = require('ngn-util'),
    Seq = require('seq'),
    read = require('read'),
    path = require('path'),
    exec = require("child_process").exec,
    OS = require('os'),
    isWin = OS.platform().toLowerCase().indexOf('win') !== -1,
    exists = false,
    npmg = util.npm.globalDirectory,
    libs = require('../modules.json'),
    _libs = [],
    cfg = {};
require('colors');

// Check for Mechanic & offer to install it if it isn't already.
Seq()
  .seq(function(){
    console.log("\n--------------------------------------------".blue.bold);
    console.log("|              NGN Mechanic                |".blue.bold)
    console.log("--------------------------------------------\n".blue.bold);

    console.log("Mechanic is the server agent for NGN. This");
    console.log("wizard will install several global node");
    console.log("modules used repeatedly within NGN and\nMechanic, including:\n");
    
    var uninstalled = 0;
    for (var item in libs){
      var title = item+':',
          linked = false;
      for (var i=title.length;i<12;i++){
        title = title + ' ';
      }
      if(!util.npm.installed(item).global){
        _libs.push(item.trim().toLowerCase());
        uninstalled += 1;
        console.log(' > '+title.magenta.bold,libs[item]);
      } else {
        console.log(' > '+title.green,'Installed  '.green+' -> '+libs[item]);
      }
    };
    
    if (uninstalled > 0){
      console.log('');
      read({
        prompt:"Install Modules?",
        'default': "y"
      },this.into('proceedsetup'));
    } else {
      this.vars.proceedsetup = 'y';
      this();
    }    
  })
  .seq(function(){
    if (this.vars.proceedsetup.trim().toLowerCase().substr(0,1) !== 'y'){
      process.exit();
    } else {
      if (_libs.length > 0){
        console.log('\nGlobal Module Setup:'.blue.bold);
        var currLib = null;
        for (var i=0;i<_libs.length;i++){
          var lib = _libs[i];
          try {
            currLib = lib;
            console.log((' >> Installing '+lib.bold).cyan);
            util.npm.installSync({package:lib,global:true,hideoutput:true});
          } catch (execErr){
            console.log(execErr);
            console.log(('\nProblem: '.bold+'Could not install '+currLib.bold+'... ').red);
            console.log('Please try a manual installation by issuing:\n\n  '+('npm install -g '+currLib).bold);
            console.log('\nOnce '+currLib+' is installed, run the installer again.');
            console.log('\n** Some packages may require elevated privileges. **'.yellow);
            process.exit(1);
            break;
          }
        };
        console.log('\nModule Installation Complete.'.green.bold);
      } else {
        console.log('\nAll required global modules are installed.'.green.bold);
      }
      console.log("\nIf you wish to use any of these in your projects,")
      console.log("they can be used by issuing "+"npm link <module>".bold.blue);
      console.log("from the command line within your project\ndirectory.");
      console.log("\n--------------------------------------------\n".blue.bold);
      
      this.vars.minstalled = util.npm.installed('ngn-mechanic').global;
      
      if (this.vars.minstalled == false){
        read({
          prompt: 'Continue?',
          'default': "y"
        },this.into('proceed'));
      } else {
        console.log('NGN Mechanic is already installed.'.blue.bold);
        console.log('Enter the number of the action to perform:\n'.blue.bold);
        console.log('1) '.blue.bold+'Reinstall'.yellow.bold);
        console.log('2) '.blue.bold+'Reconfigure'.yellow.bold);
        console.log('3) '.blue.bold+'Quit'.cyan.bold+'\n');
        var me = this;
        read({
          prompt: 'Action?',
          'default': "1"
        },function(err,value){
          switch(value){
            case '1':
              me.vars.proceed = 'y';
              me.next();
              break;
            case '2':
              require('./configure');
              return;
            default:
              process.exit();
          }
          process.exit();
        });
      }
    }
  })
  .seq(function(){
    // Make sure the proper libraries are available
    if (this.vars.minstalled){
      this.vars.deps = require(require('path').join(util.npm.globalDirectory,'node_modules','ngn-mechanic','package.json')).ngnDependencies;
      this.vars.deps.forEach(function(mod){
        if (!util.npm.installed(mod).global){
          console.log('Module Missing: '.bold.yellow+mod.bold)
          util.npm.installSync({
            package: mod,
            global: true
          });
        }
      });
    }
    if (this.vars.proceed.trim().toLowerCase().substring(0,1) == 'y'){
      //cfg = require(require('path').join(util.npm.globalDirectory,'node_modules','ngn','bin','.config.json')) || {};
      if (this.vars.minstalled){
        util.npm.removeSync('ngn-mechanic',true);
      }
      util.npm.installSync({
        package: 'ngn-mechanic',
        //registry: cfg.npmregistry || null,
        global: true
      });
      //this.vars.deps = require(require('path').join(util.npm.globalDirectory,'node_modules','ngn-mechanic','package.json')).ngnDependencies;
      this.vars.pth = path.join(util.npm.globalDirectory,'node_modules','ngn-mechanic');
      this.next();
    } else {
      process.exit();
    }
  })
  .seq(function(){
    exec('npm link ngn-util',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    exec('npm link ngn-daemon',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    exec('npm link bcrypt',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    exec('npm link shell',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    exec('npm link easy-table',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    exec('npm link seq',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    exec('npm link read',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    exec('npm link json-socket',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    exec('npm link colors',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    exec('npm link node-uuid',{cwd:this.vars.pth},this.next);
  })
  .seq(function(){
    console.log('sddfsfsafasfd'.red)
    /*this.vars.deps.forEach(function(module){
      console.log('Installing/linking '+module);
      util.npm.linkToGlobal(module);
    });*/
    //exec('npm link '+)    
    /*var efn = function(mods,callback){
      callback = callback || function(){};
      if (mods.length > 0){
        var mod = mods.pop();
        util.npm.globalLink('ngn-mechanic',mod,false,function(){
          console.log('huh?')
          efn(mods,callback);
        });        
      } else {
        console.log('mods are 0')
        callback();
      }
    }
    console.log(this.stack_)
    efn(mods)*/
   
  })
  .seq(function(){
    console.log('DONE'.bold.green);
    console.log('','\nngn start mechanic'.bold+' to launch Mechanic.');
  });
// Configure Mechanic if installed