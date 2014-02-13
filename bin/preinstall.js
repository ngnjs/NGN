var os = require('os'),
    p = require('path'),
    exec = require('child_process').exec,
    pkg = '';

console.log('Exiting gracefully');
process.exit(0);

switch (os.platform().toLowerCase()){
  case 'win32':
    console.log('Installing Windows service manager...');
    pkg = 'node-windows';
    break;
  case 'darwin':
    console.log('Installing Mac daemon manager...');
    pkg = 'node-mac';
    break;
  case 'linux':
    console.log('Installing Linux daemon manager...');
    pkg = 'node-linux';
    break;
}

// Installs a native driver
exec('npm install '+pkg,{cwd:__dirname},function(){});