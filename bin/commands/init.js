var cli = require('optimist'),
    exec= require('child_process').exec,
    path = require('path'),
    fs = require('fs');

require('colors');
fs.exists(path.join(process.cwd(),'node_modules','ngn'),function(exists){
  if (!exists){
    exec('npm link ngn',{cwd:process.cwd()},function(err){
      if (err){
        console.log('Error adding NGN support.'.bold.red);
      } else {
        console.log('Ready.'.green.bold);
      }
    });
  }
});