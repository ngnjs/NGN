// Include NGN (locally)
require('../../'); 

// Utilize Should.js
var should = require('should');

var cfg = require('./config.json');

// REDIS
if (cfg.redis !== undefined) {

	var config = cfg.redis;
	config.name = "redistest";
	
	var rconn	= new __NGN.datasource.Redis(config),
		rclient = rconn.getClient();
	
	describe('NGN.datasource.Redis',function(){
		
		it('should have a client',function(){
			rconn.should.have.property('client');
			should.exist(rclient);
		});
		
		it('should not be connected',function(){
			rconn.connected.should.equal(false);
		});
		
		it('should be registered as a DSN',function(){
			__NGN.getDatasource('redistest').type.trim().toLowerCase().should.equal('redis');
		});
		
	});

}

// MONGODB
if (cfg.mongodb !== undefined) {
	
	var config = cfg.mongodb;
	config.name = "mongotest";
	
	var mconn 	= new __NGN.datasource.MongoDB(config),
		mclient = mconn.getClient();
	
	describe('NGN.datasource.MongoDB',function(){
		
		it('should have a client',function(){
			mconn.should.have.property('client');
			should.exist(mclient);
		});
		
		it('should not be connected',function(){
			mconn.connected.should.equal(false);
		});
		
		it('should be registered as a DSN',function(){
			__NGN.getDatasource('mongotest').type.trim().toLowerCase().should.equal('mongodb');
		});
		
	});
}