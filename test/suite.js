/**
 * An array of directories that contain unit tests.
 * The test runner will read these directories recursively 
 * and add each file it finds as a test.
 */
var directories = [
	'./test/core',
	'./test/unit'
]

// Requirements
require('../'); // NGN
require('colors');
var Mocha 	= require('mocha'),
   	path 	= require('path'),
   	should	= require('should'),
   	wrench	= require('wrench');

// Create the mocha instance
var mocha = new Mocha({
  reporter: 'spec',
  ui: 		'bdd',
  globals: 	['__NGN','NGN','ngn','__NGNX','NGNX','ngnx','NGNA','ngna','$','__$','nocirculr'],
  timeout: 	999999
});

// Add the test directories to the runner
for(var _i=0;_i<directories.length;_i++){
	var files = wrench.readdirSyncRecursive(directories[_i]);
	for(var _x=0;_x<files.length;_x++){
		//console.log('Adding '+require('path').join(directories[_i],files[_x]));
		mocha.addFile(require('path').join(directories[_i],files[_x]));
	}
}

// Execute the tests
console.log('|                Running Test Suite                    |'.italic.underline.magenta.inverse);
mocha.run(function(stats, testList){
	/*console.log(arguments);
	console.log('Done:'.underline.yellow.bold);
	console.log('  Passed: %d', stats.passes);
	console.log('  Pending: %d', stats.pending);
	console.log('  Failed: %d', stats.failures);
	console.log('  Total time: %dms', stats.duration);
	console.log();

  	var pending = testList.filter(function(test){
    	return test.pending;
  	});

  	console.log('Pending tests:');
  	pending.forEach(function(test){
    	console.log(' - %s: %s', (test.parent && test.parent.title || '#'), test.title);
  	});*/
  	process.exit(0);
}).on('pass', function(test){
  //console.log('      ...passed %s'.grey, test.title.grey);
}).on('fail', function(test){
  console.log('      ...failed %s'.red, test.title.red.bold);
});
//console.log(runner);