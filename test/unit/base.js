// Include NGN (locally)
var wrench = require('wrench'),
    assert = require('assert'),
    path = require('path');

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
	  assert.ok(__NGN !== undefined);
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
	
	test('Extended Library Loads', function(){
    assert.ok(__NGNX !== undefined);
    assert.ok(NGNX !== undefined);
  });

});

// Make sure datasource connections can be created.
/*
describe('NGN.datasource.Connection',function(){
	var conn = new __NGN.datasource.Connection();
		
	it('should have default values.',function(){
		conn.type.should.equal('Unknown');
		conn.host.should.equal('127.0.0.1');
		conn.should.have.property('port');
		conn.should.have.property('username');
		conn.should.have.property('connected');
		conn.should.have.property('timedout');
		conn.should.have.property('securedConnection');
		conn.should.have.property('database');
		conn.should.have.property('connecting');
		conn.should.have.property('timeout');
		conn.should.have.property('autoConnect');
		conn.should.have.property('client');
		conn.should.have.property('password'); // The password is not enumerable and should not show up.		
	});
	
	it('should not be connected.',function(){
		conn.connected.should.equal(false);
	});
});
*/