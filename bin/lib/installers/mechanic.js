var exec = require("child_process").exec,
    path = require('path'),
    fs = require('fs'),
    isWin = require('os').platform().toLowerCase().indexOf('win') !== -1,
    util = require('ngn-util'),
    Seq = util.require('seq',true),
    read = util.require('read',true),
    exists = false,
    npmg = util.npm.globalDir,
    libs = require('../mechanic.modules.json'),
    _libs = [],
    cfg = {};
    
util.require('colors',true);

// Check for Mechanic & offer to install it if it isn't already.
Seq()
  .seq(function(){
    console.log("\n--------------------------------------------".blue.bold);
    console.log("|              NGN Mechanic                |".blue.bold)
    console.log("--------------------------------------------\n".blue.bold);

    console.log("Mechanic is the server agent for NGN. This");
    console.log("wizard will install several global node");
    console.log("modules used by Mechanic, including:\n");
    
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
        console.log(' > '+title.green,'Already Installed.  '.green+' -> '+libs[item]);
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
          'default': "3"
        },function(err,value){
          switch(value){
            case '1':
              me.vars.proceed = 'y';
              me.next();
              break;
            case '2':
              require('./configure-mechanic');
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
      this.vars.deps = require(require('path').join(util.npm.globalDir,'node_modules','ngn-mechanic','package.json')).ngnDependencies;
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
      //cfg = require(require('path').join(util.npm.globalDir,'node_modules','ngn','bin','.config.json')) || {};
      if (this.vars.minstalled){
        util.npm.removeSync('ngn-mechanic',true);
      }
      util.npm.installSync({
        package: 'ngn-mechanic',
        //registry: cfg.npmregistry || null,
        global: true
      });
      this.vars.deps = require(require('path').join(util.npm.globalDir,'node_modules','ngn-mechanic','package.json')).ngnDependencies;
      if (this.vars.deps.inedxOf('ngn-util') < 0){
        this.vars.deps.push('ngn-util');
      }
      //this.vars.pth = path.join(util.npm.globalDir,'node_modules','ngn-mechanic');
      //console.log('dfgdsfgdsfgdsfg'.magenta);
      this.next();
    } else {
      process.exit();
    }
  })
  .seq(function(){

    console.log('\nValidating installation...'.blue.bold);    
    this.vars.deps.forEach(function(module){
      var src = path.join(util.npm.globalDir,'node_modules',module),
          dst = path.join(util.npm.globalDir,'node_modules','ngn-mechanic','node_modules',module);
          
      if (!fs.existsSync(src)){
        util.npm.installSync({
          package: module,
          hideoutput: true,
          global: true
        });
      }
      fs.symlinkSync(src,dst,'dir');
    });

    this.next();
    
  })
  .seq(function(){
    console.log('DONE'.bold.green);
    //console.log('','\nngn start mechanic'.bold+' to launch Mechanic.');
  });
// Configure Mechanic if installed