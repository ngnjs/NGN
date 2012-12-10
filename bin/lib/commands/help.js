var cli = require('optimist');

console.log('TODO: HELP'.cyan);
require('colors');
var argv = cli
		.usage('Usage: ngn help <command>')
		.describe('command'.bold,'Specify a command to view it\'s help. For example, '+'ngn help install'.blue+' or '+'ngn help init'.blue+'.')
		.check(function(argv){
			if (argv.help === true){
				throw('');
			}
		})
		.argv;

console.log(argv);
