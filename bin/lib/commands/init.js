var cli = require('optimist');

console.log('TODO: Init'.cyan);
require('colors');
var argv = cli
		.usage('Usage: ngn init --<options>')
		.describe('test'.bold,'sdfsfsd')
		.demand('test'.bold).argv;
