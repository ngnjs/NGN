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
  exec('npm link',{cwd:p.join(prefix,'node_modules',pkg)},function(){
    exec('npm link '+pkg,{cwd:p.join(prefix,'node_modules','ngn')},function(){
      console.log('Daemon functionality mapped to NGN.');
    });
  });
});