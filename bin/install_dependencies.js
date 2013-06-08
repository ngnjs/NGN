var os = require('os'),
    p = require('path'),
    exec = require('child_process').exec;

console.log('Installing background service utilities...');
exec('npm config get prefix',function(err,out){
  var path = out,
      opts = {cwd:p.join(out,'node_modules','ngn')};
  switch (os.platform().toLowerCase()){
    case 'win32':
      exec('npm install node-windows',opts,function(){});
      break;
    case 'darwin':
      exec('npm install node-mac',opts,function(){});
      break;
    case 'linux':
      exec('npm install node-linux',opts,function(){});
      break;
  }
});