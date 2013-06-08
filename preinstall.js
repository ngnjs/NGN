var os = require('os'),
    p = require('path'),
    exec = require('child_process').exec,
    pkg = '';

console.log('Installing background service utilities...');

switch (os.platform().toLowerCase()){
  case 'win32':
    pkg = 'node-windows';
    break;
  case 'darwin':
    pkg = 'node-mac';
    break;
  case 'linux':
    pkg = 'node-linux';
    break;
}

exec('npm install -g '+pkg,function(){});