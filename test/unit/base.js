// Include NGN (locally)
var wrench = require('wrench'),
    assert = require('assert'),
    path = require('path');

suite('Class Structure',function(){
	var Class = null;
	setup(function(){
		Class = require(require('path').join(__dirname,'..','..','lib','Class.js'));
	});
	
	test('Basic inheritance.',function(){
		var val = null;
		var Test = Class.extend({
			constructor: function(){
				Test.super.constructor.call(this);
				val = 'ok';
			}
		});
		
		// Validate class construction
		var x = new Test();
		assert.ok(val === 'ok', 'The class was not constructed properly.');
		
	});
	
	test('Fires events.',function(done){
		var Test = Class.extend({
			constructor: function(){
				Test.super.constructor.call(this);
			},
			init: function(){
				this.emit('init');
			}
		});
		
		// Validate class construction
		var x = new Test();
		x.on('init',function(){done();});
		x.init();
	});
});

/**
 * Make sure the NGN Utilities namespace is available.
 */
suite('Utilities', function(){

  var lib = null;
  setup(function(){
    lib = wrench.readdirSyncRecursive(path.join(__dirname,'..','..','lib'));
    require(path.join(__dirname,'..','..'));
  });

  test('Load namespace via require().', function(){
    assert.ok(UTIL !== undefined);
  });
	
	test('Unrequire.',function(){
		var file = require('path').join(__dirname,'..','data','config.json');
		var x = require(file);
		assert.ok(require.cache[file] !== undefined,'Invalid require. Cannot test unrequire method.');
		UTIL.unrequire(file);
		assert.ok(require.cache[file] === undefined,'Unrequire failed.');
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
	
	test('NGN.clone().',function(){
		// Validate object cloning method
		var obj = {
				a: 'a',
				b: true,
				c: 1,
				d: /\W/gi,
				e: null,
				nested: {
					test: 'data',
					blah: 1,
					nested: {
						again: 'another level',
						fourth: {
							yat: 'yet another level'
						}
					}
				}
			};
		assert.ok(JSON.stringify(obj) === JSON.stringify(NGN.clone(obj)),'Basic object clone failed.');
		var Test = NGN.Class.extend({
			constructor: function(){
				Test.super.constructor.call(this);
			},
			init: function(){
				this.emit('init');
			}
		});
		assert.ok(new (NGN.clone(Test))() instanceof Test, 'Complex object clone failed.');
	});
	
	test('NGN.absolutePath().',function(){
		assert.ok(NGN.absolutePath('./') === require('path').join(__dirname,'..','..'),'Absolute path is incorrect');
	});	
		
	test('NGN.getConstructor().',function(){
		assert.ok(NGN.getConstructor('string') === String,'Invalid #getConstructor (string)');
		assert.ok(NGN.getConstructor('number') === Number,'Invalid #getConstructor (number)');
		assert.ok(NGN.getConstructor('boolean') === Boolean,'Invalid #getConstructor (boolean)');
		assert.ok(NGN.getConstructor('regexp') === RegExp,'Invalid #getConstructor (regexp)');
		assert.ok(NGN.getConstructor('date') === Date,'Invalid #getConstructor (date)');
		assert.ok(NGN.getConstructor('array') === Array,'Invalid #getConstructor (array)');
	});
		
	test('NGN.typeOf().',function(){
		assert.ok(NGN.typeOf('string') === 'string','Failed to detect string type.');
		assert.ok(NGN.typeOf([]) === 'array','Failed to detect array type.');
		assert.ok(NGN.typeOf(1) === 'number','Failed to detect number type.');
		assert.ok(NGN.typeOf(new Date()) === 'date','Failed to detect date type.');
		assert.ok(NGN.typeOf(false) === 'boolean','Failed to detect boolean type.');
		assert.ok(NGN.typeOf(/\W/gi) === 'regexp','Failed to detect regexp type.');
		assert.ok(NGN.typeOf(null) === 'null','Failed to detect null type.');
		assert.ok(NGN.typeOf(undefined) === 'undefined','Failed to detect undefined type.');
	});
		
	test('NGN.coalesce().',function(){
		assert.ok(NGN.coalesce(null,null,true,null) === true,'Failed boolean coalesce');
		assert.ok(NGN.coalesce(null,'test') === 'test','Failed string coalesce');
	});

});