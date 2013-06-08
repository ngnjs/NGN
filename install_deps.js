var os = require('os'),
    p = require('path'),
    exec = require('child_process').exec,
    pkg = '';

console.log('Installing background service utilities...');

var link = function(){

};

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

exec('npm install -g '+pkg,function(){
  exec('npm config get prefix',function(err,prefix){
    require('fs').symlink(p.join(out,'node_modules',pkg),p.join(out,'node_modules','ngn','node_modules',pkg,'dir',function(){
      console.log('Daemon functionality mapped to NGN.');
    }));
  });
});