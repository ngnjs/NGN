var pkg = require(require('path').join(__dirname,'..','..','..','package.json'));
require('ngn-util').require('colors',true);
console.log('NGN v'.bold+pkg.version.bold);