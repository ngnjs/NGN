// Include NGN (locally)
require('../'); 

// Utilize Should.js
var should = require('should');


/**
 * Make sure the NGN global namespace is available.
 */
describe('NGN global namespace', function(){
	it('should exist', function(){
	  should.exist(__NGN);
	})
});


/**
 * Make sure datasource connections can be created.
 */
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
