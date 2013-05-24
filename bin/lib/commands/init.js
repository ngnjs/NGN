var cli = require('optimist'),
    exec= require('child_process').exec,
    fs = require('fs'),
    path = require('path');

fs.exists(path.join(process.cwd(),'node_modules','ngn'),function(exists){
  if (!exists){
    exec('npm link ngn --no-bin-links',{cwd:process.cwd()},function(){
      console.log('NGN is ready.\n');
    });
  } else {
    console.log('NGN is ready.\n');
  }
});