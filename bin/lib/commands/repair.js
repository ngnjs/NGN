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
    console.log("|        NGN is repairing iteself.         |".blue.bold)
    console.log("--------------------------------------------\n".blue.bold);

    console.log('Checking Global Modules...\n');    
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
        linked = ['optimist','node-uuid','wordwrap'].indexOf(item) < 0 
                  ? require('fs').existsSync(path.join(npmg,'ngn-mechanic','node_modules',item))
                  : require('fs').existsSync(path.join(npmg,'ngn','node_modules',item));
        if (!linked){
          unlinked.push(item);
        }
        console.log(' > '+title.green,(linked == true ? 'Installed  '.green: 'Not Linked!'.red.bold)+' -> '+libs[item]);
      }
    };

    if(!require('fs').existsSync(path.join(npmg,'ngn-mechanic','node_modules','ngn')) && exists){
      NGN.npm.globalLink('ngn-mechanic','ngn');
      console.log('\nRepair detected an invalid or missing link between'.bold.yellow);
      console.log('NGN and Mechanic.'.bold.yellow);
      console.log('Link Auto-corrected!\n'.bold.green);
    }
    this();
  })
  .seq(function(){
      if (_libs.length > 0){
        console.log('\nAdding missing global modules...'.cyan.underline);
        var currLib = null;
        try {
          _libs.forEach(function(lib){
            currLib = lib;
            console.log((' >> Installing '+lib.bold).yellow);
            execSync('npm --loglevel silent install -g '+lib);
          });
          console.log('\nModule Installation Complete.\n'.green.bold);
        } catch (execErr){
          console.log(('\nError: '.bold+'Could not build '+currLib.bold+'... ').red);
          console.log('\nPlease try a manual installation by typing:\n'+('npm install -g '+currLib).bold);
          console.log('\nOnce '+currLib+' is installed, run the repair again.');
          console.log('\n** Some packages may require elevated privileges. **');
          process.exit(1);
        }
      } else {
        console.log('\nAll global modules are installed.\n'.blue.bold);
      }
      if (unlinked.length > 0){
        unlinked.forEach(function(lib){
          if (['forever','ngn'].indexOf(lib) < 0 && exists){
            NGN.npm.globalLink('ngn-mechanic',lib);
          } else {
            NGN.npm.globalLink('ngn',lib);
          }
        });
        console.log('Setup found & fixed the following unlinked modules:'.yellow.bold);
        console.log('  >> '+unlinked.join().replace(/,/gi,', ').bold,'\n');
      }
      this();
  })
  .seq(function(){
    console.log('NGN was successfully repaired.'.green.bold);
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
    var cfg = require(path.join(__dirname,'..','..','.config.json'));
    NGN.npm.installer({
      package: 'ngn-mechanic',
      name: 'Mechanic',
      global: true,
      registry: cfg.npmregistry
    },function(next){
      console.log("Mapping NGN Mechanic modules.".cyan);
      exec('npm link bcrypt seq read colors forever ngn',{cwd:path.join(npmg,'ngn-mechanic')},function(){
        console.log('Finished.'.green);
        require('./configure');
      });
    });
  });