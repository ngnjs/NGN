// Include NGN (locally)
var wrench = require('wrench'),
    assert = require('assert'),
    path = require('path');

/**
 * Make sure the NGN Utilities namespace is available.
 */
suite('Utilities', function(){

  var lib = null;
  setup(function(){
    lib = wrench.readdirSyncRecursive(path.join(__dirname,'..','..','lib'));
    require(path.join(__dirname,'..','..'));
  });

  test('Load namespace via require()', function(){
    assert.ok(UTIL !== undefined);
  });

});

/**
 * Make sure the NGN global namespace is available.
 */
suite('NGN Package', function(){

  var lib = null;
  setup(function(){
    lib = wrench.readdirSyncRecursive(path.join(__dirname,'..','..','lib'));
    require(path.join(__dirname,'..','..'));
  });

	test('Core Library Loads', function(){
	  assert.ok(NGN !== undefined);
	});

	test('Core Framework Classes Load',function(){
    for (var i=0;i<lib.length;i++){
      if (lib[i].substr(0,1) !== '_'){
        var c = lib[i].split(path.sep), n='NGN';
        if (c.length > 1){
          while (c.length > 0){
            n += '.'+c.shift().replace('.js','');
          }
          assert.ok(eval(n) !== undefined,n+' does not exist.');
        }
      }
    }
  });

});