var pkg = require(require('path').join(__dirname,'..','..','..','package.json'));
require('colors');
console.log('NGN v'.bold+pkg.version.bold);