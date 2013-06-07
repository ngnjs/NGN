var os = require('os'),
    exec = require('child_process').exec;

switch (os.platform().toLowerCase()){
  case 'win32':
    exec('npm install node-windows',function(){});
    break;
  case 'darwin':
    exec('npm install node-mac',function(){});
    break;
  case 'linux':
    exec('npm install node-linux',function(){});
    break;
}