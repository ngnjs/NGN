var util = require('ngn-util'),
    cli = util.require('optimist',true),
    argv = cli
            .usage('Usage: ngn install <feature>')
            .describe('feature'.bold,'Specify a feature to install it. For example,\n'+'ngn install mechanic'.blue.bold+'.')
            .check(function(argv){
              if (argv.start === true){
                throw('Please specify a feature to install.');
              }
            })
            .argv;

switch (argv.install.trim().toLowerCase()){
  case 'mechanic':
    require('../installers/'+argv.install.trim().toLowerCase());
    break;
  default:
    cli.showHelp();
    break;
}