require('colors');
var exec = require('child_process').exec,
    execSync = require('exec-sync'),
    Seq = require('seq'),
    //npm = require('npm'),
    path = require('path');

var __root = null,
    getNpmGlobalRoot = function(){
      if(__root == null){
        __root = execSync("npm prefix -g");
      } 
      return __root;
    };

var installer = function(config,successFn){
  
  successFn = successFn || function(){};
  
  config.name = config.name || '';
  
  if (!config.hasOwnProperty('global')){
    config.global = false;
  }
  
  console.log(('\nInstalling '+config.name+'... ').cyan+'[Please wait - this may take a moment]'.blue.bold);
  
  exec("ngn config set strict-ssl false",function(___e,___o,___err){
    exec("npm --loglevel silent "+(config.registry.trim().length > 0 ? "--registry "+config.registry+" " : "")+"install "+config.package+(config.global == true ? " -g" : ""),function(error,out,err){
      if (error){
        console.log(('\nError installing '+config.name+':').red.bold);
        console.log(('('+error.code+') ').blue.bold+error.message);
        console.log(error);
      } else if (err.trim().length > 0){
        console.log(('\nError installing '+config.name+':').red.bold);
        console.log(err);
      } else {
        console.log('Complete.'.green);
        console.log(('\nLinking '+config.name+' to NGN...').cyan);
        if (!config.global){
          exec("npm --loglevel silent link",{cwd:path.join(__dirname,'..','..','..',config.package)},function(_error,_out,_err){
            if (_error){
              console.log(('\nError linking '+config.name+' to NGN:').red.bold);
              console.log(('('+_error.code+') ').blue.bold+_error.message,_error);
            } else {
              exec("npm --loglevel silent link "+config.package,{cwd:path.join(__dirname,'..','..')},function(__error,__out,__err){
                if (__error){
                  console.log(('\nError linking '+config.name+' to NGN:').red.bold);
                  console.log(('('+__error.code+') ').blue.bold+__error.message,__error);
                } else {
                  console.log('Link Created.\n'.green);
                  successFn(process.exit);
                }
              });
            }
          });
        } else {
          exec("npm --loglevel silent link "+config.package,{cwd:path.join(__dirname,'..','..')},function(__error,__out,__err){
            if (__error){
              console.log(('\nError linking '+config.name+' to NGN:').red.bold);
              console.log(('('+__error.code+') ').blue.bold+__error.message,__error);
            } else {
              console.log('Link Created.\n'.green);
              successFn(process.exit);
            }
          });
        }
      }
    });
  });
};

var globalLink = function(to,from,callback){
  exec("npm link "+from,{cwd:path.join(getNpmGlobalRoot(),'node_modules',to)},callback);
}

var out = {
  installer: installer,
  globalDirectory: getNpmGlobalRoot(),
  globalLink: globalLink
};
module.exports = out;