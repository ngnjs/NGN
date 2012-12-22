var cli = require('optimist'),
    wrapwidth = 60,
    wrap = require('wordwrap')(wrapwidth);
require('colors');

var argv = cli
    .usage('Usage: ngn stop <feature>')
    .describe('feature'.bold,'Specify a running feature to stop it. For example,\n'+'ngn stop mechanic'.blue.bold+'.')
    .check(function(argv){
      if (argv.start === true){
        throw('Please specify a feature to stop.');
      }
    })
    .argv;

switch (argv.start.trim().toLowerCase()){
  case 'mechanic':
    break;
  default:
    console.log(argv.start.bold+' is not a valid feature.');
    process.exit(1);
    break;
}

console.log('TODO: STOP'.cyan);

console.log(argv);
