require('colors');
var cli = require('optimist'),
  p = require('path'),
  installer = require('../lib/installer'),
  available = require(p.join(process.mainModule.paths[0],'..','..','package.json')).ngn;

// Basic CLI
var argv = cli
		  .usage('Usage: ngn add <module or group>')
		  .argv,
		mod = argv._.filter(function(value){return value !== 'add';})[0];

// Check first for a module or group and install/warn accordingly
if (available.modules[mod] !== undefined){
  install(mod);
} else if (available.groups[mod] !== undefined){
  available.groups[mod].forEach(function(m){
    installer.install(m);
  });
} else if (['all'/*,'*'*/].indexOf(mod.toString().trim().toLowerCase()) >= 0){
  console.log(('Installing every add-on ('+Object.keys(available.modules).length.toString()+' total). This may take a few moments.').cyan.bold);
  for (var m in available.modules){
    installer.install(m);
  };
} else {
  console.log(('No module or group called \"'+mod+'\" is available.').red.bold);
}
