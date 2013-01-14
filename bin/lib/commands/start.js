var cli = require('optimist'),
    wrapwidth = 60,
    path = require('path'),
    npmg = path.join(process.env.APPDATA,'npm','node_modules'),
    wrap = require('wordwrap')(wrapwidth);
require('colors');

var argv = cli
    .usage('Usage: ngn start <feature>')
    .describe('feature'.bold,'Specify a feature to start it. For example,\n'+'ngn start mechanic'.blue.bold+'.')
    .check(function(argv){
      if (argv.start === true){
        throw('Please specify a feature to start.');
      }
    })
    .argv;

switch (argv.start.trim().toLowerCase()){
  case 'mechanic':
    var mechanic = require(path.join(npmg,'ngn-mechanic'));
    mechanic.service.start();
    break;
  default:
    process.exit(1);
    break;
}