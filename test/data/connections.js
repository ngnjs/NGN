// Include NGN (locally)
require('../../'); 

// Utilize Should.js
var should = require('should');

var cfg = require('./personalconfig.json');

NGN.application(function(){
	
	// REDIS
	if (cfg.redis !== undefined) {
	
		var rconfig = cfg.redis;
		rconfig.id = "redistest";
		
		var rconn	= new NGN.datasource.Redis(rconfig),
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
				NGNA.getDatasource(rconfig.id).type.trim().toLowerCase().should.equal('redis');
			});
			
		});
	
	}
	
	// MONGODB
	if (cfg.mongodb !== undefined) {
		
		var mconfig = cfg.mongodb;
		mconfig.id = "mongotest";
		
		var mconn 	= new NGN.datasource.MongoDB(mconfig),
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
				NGNA.getDatasource(mconfig.id).type.trim().toLowerCase().should.equal('mongodb');
			});
			
			it('should connect when asked',function(done){
				mconn.on('ready',function(){
					mconn.connected.should.equal(true);
					done();
				});
				mconn.connect();
			});
			
		});
	}
});