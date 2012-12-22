require('colors');
var Seq = require('seq'),
    read = require('read'),
    path = require('path'),
    exec = require("child_process").exec,
    execSync = require('exec-sync'),
    OS = require('os'),
    isWin = OS.platform().toLowerCase().indexOf('win') !== -1,
    exists = false,
    npmg = path.join(NGN.npm.globalDirectory,'node_modules'),
    libs = {
      "bcrypt":"Native strong encryption.",
      "log4js":"System logging (not apps).",
      "seq":"Flow control.",
      "colors":"CLI color coding.",
      "read":"CLI prompts.",
      "optimist":"CLI utility.",
      "node-uuid":"UUID generation.",
      "wordwrap":"CLI text wrapping.",
      "forever":"Daemon Utility."
    },
    _libs = [],
    unlinked = [];

try {
  var m = require(path.join(npmg,'ngn-mechanic'));
  exists = true;
} catch (e) {}
console.log(exists,path.join(npmg,'ngn-mechanic'));

// Check for Mechanic & offer to install it if it isn't already.
Seq()
  .seq(function(){
    
    console.log("\n--------------------------------------------".blue.bold);
    console.log("|             Welcome to NGN               |".blue.bold)
    console.log("--------------------------------------------\n".blue.bold);

    console.log("You are about to setup NGN. This will setup");
    console.log("several global node modules used repeatedly");
    console.log("throughout NGN:\n");
    
    for (var item in libs){
      var title = item+':',
          linked = false;
      for (var i=title.length;i<12;i++){
        title = title + ' ';
      }
      if(!require('fs').existsSync(path.join(npmg,item))){
        _libs.push(item.trim().toLowerCase());
        console.log(' > '+title.magenta.bold,libs[item]);
      } else {
        linked = [].indexOf(item) < 0 
                  ? require('fs').existsSync(path.join(npmg,'ngn-mechanic','node_modules',item))
                  : require('fs').existsSync(path.join(npmg,'ngn','node_modules',item));
        if (!linked){
          unlinked.push(item);
        }
        console.log(' > '+title.green,libs[item]+' -> '+(linked == true ? 'Installed'.green: 'Not Linked!'.red.bold));
      }
    };
    
    console.log("\nOnly the modules that are not already installed will be installed.");
    console.log("If you wish to use any of these in your projects, they can be installed");
    console.log("for a specific project using the "+"npm link <package>".bold.blue+" command in the project directory.\n");
    
    read({
      prompt:"Do you want to continue setting up or updating NGN?",
      'default': "y"
    },this.into('proceedsetup'));
  })
  .seq(function(){
    if (this.vars.proceedsetup.trim().toLowerCase().substr(0,1) !== 'y'){
      process.exit();
    } else {
      if (_libs.length > 0){
        console.log('\nGlobal Module Setup'.cyan.underline);
        var currLib = null;
        try {
          _libs.forEach(function(lib){
            currLib = lib;
            console.log((' >> Installing '+lib.bold).cyan);
            execSync('npm --loglevel silent install -g '+lib);
          });
          console.log('\nModule Installation Complete.\n'.green.bold);
        } catch (execErr){
          console.log(('\nError: '.bold+'Could not build '+currLib.bold+'... ').red);
          console.log('\nPlease try a manual installation by typing:\n'+('npm install -g '+currLib).bold);
          console.log('\nOnce '+currLib+' is installed, run the setup again.');
          console.log('\n** Some packages may require elevated privileges. **');
          //console.log(execErr.message);
          process.exit(1);
        }
      } else {
        console.log('\nAll global modules are installed.\n'.blue.bold);
      }
      if (unlinked.length > 0){
        unlinked.forEach(function(lib){
          if (lib == 'forever' && exists){
            NGN.npm.globalLink('ngn-mechanic',lib);
          } else {
            NGN.npm.globalLink('ngn',lib);
          }
        });
        console.log('Setup found & fixed the following unlinked modules:'.yellow.bold);
        console.log('  >> '+unlinked.join().replace(/,/gi,', ').bold,'\n');
      }
      this();
    }
  })
  .seq(function(){
    if (!exists){
      console.log("You are about to setup NGN Mechanic, the NGN server agent.".cyan.bold);
      console.log('This should only take a few minutes.\n'.cyan);
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
      var cfg = require(path.join(__dirname,'..','..','.config.json'));
      NGN.npm.installer({
        package: 'ngn-mechanic',
        name: 'Mechanic',
        global: true,
        registry: cfg.npmregistry
      },function(next){
        console.log("Mapping NGN Mechanic modules.".cyan);
        exec('npm link bcrypt colors seq read forever ngn',{cwd:path.join(npmg,'ngn-mechanic')},function(){
          console.log('Finished.'.green);
          require('./configure');
        });
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