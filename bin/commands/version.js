var p = require('path'),
  pkg = require(p.join(__dirname,'..','..','package.json')),
  fs = require('fs');
require('colors');

console.log((' + NGN v'+pkg.version).bold);
for (var mod in pkg.ngn.modules){
  var path = p.join(__dirname,'../../../',mod);
  if (fs.existsSync(path)){
    var mpkg = require(p.join(path,'package.json'));
    console.log((' + '+mod.cyan+' v'+mpkg.version).bold);
  } else {
    console.log(' - '+mod+' (Not Installed)'.red);
  }
}
