var p = require('path'),
  pkg = require(p.join(__dirname,'..','..','package.json')),
  fs = require('fs');
require('colors');

console.log((' + NGN v'+pkg.version).bold);

// Module Display Logic
var display = function(mod,hideIfNotExists){
  hideIfNotExists = hideIfNotExists || false;
  var path = p.join(__dirname,'../../../',mod);
  if (fs.existsSync(path)){
    var mpkg = require(p.join(path,'package.json'));
    console.log((' + '+mod.cyan+' v'+mpkg.version));
  } else {
    if (!hideIfNotExists){
      console.log(' - '+mod+' (Not Installed)'.red);
    }
  }
};

// Loop through modules and display them.
for (var m in pkg.ngn.modules){
  display(m);
}

// Display dev tools if they're installed, hide if they're not.
display('ngn-dev',true);
