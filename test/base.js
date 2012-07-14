var should = require('should');

describe('NGN', function(){
	it('Should Exist', function(){
	  require('../');
	  should.exist(__NGN);
	})
})