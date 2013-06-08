var os = require('os'),
    p = require('path'),
    exec = require('child_process').exec,
    pkg = '';

console.log('Linking background service utilities...');

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

exec('npm config get prefix',function(err,prefix){
  console.log(p.join(prefix,'node_modules',pkg)+' linked to '+p.join(prefix,'node_modules','ngn','node_modules',pkg));
  require('fs').symlink(p.join(prefix,'node_modules',pkg),p.join(prefix,'node_modules','ngn','node_modules',pkg),'dir',function(){
    console.log('Daemon functionality mapped to NGN.');
  });
});