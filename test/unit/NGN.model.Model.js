/**
 * Make sure the NGN global namespace is available.
 */
var should = require('should');
describe('NGN.model.Model', function(){
	
	var m = new __NGN.model.Model();
	
	it('Create New', function(done){
	  	should.exist(m);
	  	done();
	});
	
	it('Create new data property',function(done){
		
		m.on('change',function(d){
			m.test.should.equal('testvalue');
			m.changelog.length.should.equal(1);
			done();
		});
		
		console.log(m);
		
		m.test = 'testvalue';
	})
});