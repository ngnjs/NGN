// Include NGN (locally)
var assert = require('assert'),
    path = require('path');

suite('NGN.string', function(){
  
  // Make sure the NGN global namespace is available.
  setup(function(){
    require(path.join(__dirname,'..','..'));
  });
  
  test('.capitalize()', function(){
    assert.equal(NGN.string.capitalize('test'),'Test','Single word capitlization.');
    assert.equal(NGN.string.capitalize('test test test'),'Test Test Test','Multi-word capitlization.');
    assert.equal(NGN.string.capitalize('testing the waters.',true),'Testing the waters.','Sentence capitlization.');
  });
  
  test('.uncapitalize()', function(){
    assert.equal(NGN.string.uncapitalize('TestWord'),'testWord','Single word uncapitlization.');
    assert.equal(NGN.string.uncapitalize('Test TestWord Test'),'test testWord test','Multi-word uncapitlization.');
    assert.equal(NGN.string.uncapitalize('Testing the waters.',true),'testing the waters.','Sentence uncapitlization.');
  });
  
  test('.center()', function(){
    assert.equal(NGN.string.center('test',8,'-'),'--test--');
    assert.equal(NGN.string.center('test',8),'  test  ');
    assert.equal(NGN.string.center('test',7,'-'),'--test-');
    assert.equal(NGN.string.center('test',7,'-',false),'-test--');
    assert.equal(NGN.string.center('test',2),'test');
  });
  
  test('.lpad()', function(){
    assert.equal(NGN.string.lpad('test',2),'  test');
    assert.equal(NGN.string.lpad('test',2,'-'),'--test');
  });
  
  test('.rpad()', function(){
    assert.equal(NGN.string.rpad('test',2),'test  ');
    assert.equal(NGN.string.rpad('test',2,'-'),'test--');
  });
  
  test('.cpad()', function(){
    assert.equal(NGN.string.cpad('test',2),'  test  ');
    assert.equal(NGN.string.cpad('test',2,'-'),'--test--');
  });
  
  test('.quote()', function(){
    assert.equal(NGN.string.quote('test'),'"test"');
    assert.equal(NGN.string.quote('test test test'),'"test test test"');
    assert.equal(NGN.string.quote('test test test',':'),':test test test:');
  });
  
});