require('colors');
var exec = require('child_process').exec,
    //npm = require('npm'),
    path = require('path');
        
var installer = function(config,successFn){
  
  successFn = successFn || function(){};
  
  config.name = config.name || '';
  
  if (!config.hasOwnProperty('global')){
    config.global = false;
  }
  
  console.log(('\nInstalling '+config.name+'... ').cyan+'[Please wait - this may take a moment]'.blue.bold);
  
  /*try {
    require(config.package);
    console.log('Already installed')
  } catch(e) {*/
    exec("npm --loglevel silent --registry "+config.registry+" install "+config.package+(config.global == true ? " -g" : ""),function(error,out,err){
      if (error){
        console.log('\nError installing '+config.name+':'.red.bold);
        console.log(('('+error.code+') ').blue.bold+error.message);
      } else if (err.trim().length > 0){
        console.log('\nError installing '+config.name+':'.red.bold);
        console.log(err);
      } else {
        console.log('Complete.'.green);
        console.log(('\nLinking '+config.name+' to NGN...').cyan);
        exec("npm --loglevel silent link",{cwd:path.join(__dirname,'..','..','..',config.package)},function(_error,_out,_err){
          if (_error){
            console.log(('\nError linking '+config.name+' to NGN:').red.bold);
            console.log(('('+_error.code+') ').blue.bold+_error.message);
          } else {
            exec("npm --loglevel silent link "+config.package,{cwd:path.join(__dirname,'..','..')},function(__error,__out,__err){
              if (__error){
                console.log(('\nError linking '+config.name+' to NGN:').red.bold);
                console.log(('('+__error.code+') ').blue.bold+__error.message);
              } else {
                console.log('Link Created.\n'.green);
                successFn(process.exit);
              }
            });
          }
        });
      }
    });
  //}
};

module.exports = {
  installer: installer
};