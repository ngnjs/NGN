var os = require('os'),
    p = require('path'),
    exec = require('child_process').exec,
    pkg = '';

console.log('Installing background service utilities...');

switch (os.platform().toLowerCase()){
  case 'win32':
    console.log('Installing node-windows service manager...');
    pkg = 'node-windows';
    break;
  case 'darwin':
    console.log('Installing node-mac daemon manager...');
    pkg = 'node-mac';
    break;
  case 'linux':
    console.log('Installing node-linux daemon manager...');
    pkg = 'node-linux';
    break;
}

exec('npm install -g '+pkg,function(){});