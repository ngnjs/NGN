var cli = require('optimist'),
    exec= require('child_process').exec,
    fs = require('fs');

fs.exists(path.join(process.cwd(),'node_modules','ngn'),function(exists){
  if (!exists){
    exec('npm link ngn',{cwd:process.cwd()});
  }
});