/**
 * Make sure the NGN global namespace is available.
 */
var should = require('should');
describe('NGN.model.Model', function(){
	
	var yes = true;
	var m  = new __NGN.model.Model();
	var m2 = new __NGN.model.Model();
	var m3 = new __NGN.model.Model();
	var m4 = new __NGN.model.Model();
	var m5 = new __NGN.model.Model();
	
	function regexSame(r1, r2) {
	    if (r1 instanceof RegExp && r2 instanceof RegExp) {
	        var props = ["global", "multiline", "ignoreCase", "source"];
	        for (var i = 0; i < props.length; i++) {
	            var prop = props[i];
	            if (r1[prop] !== r2[prop]) {
	                return(false);
	            }
	        }
	        return(true);
	    }
	    return(false);
	}
	
	it('Create Model', function(done){
	  	should.exist(m);
	  	done();
	});
	
	it('STRING: Create, update, and delete data property',function(done){
		
		m.on('change',function(d){
			if (d.type == 'create'){
				d.property.should.equal('test');
				d.value.should.equal('testvalue');
			} else if (d.type == 'update') {
				d.property.should.equal('test');
				d.value.should.equal('testvalue2');
				delete m.test;
			} else {
				d.property.should.equal('test');
				done();
			}
		});
		
		// Test String
		m.test = 'testvalue';
		//yes.should.equal(m.test instanceof String);
		m.test = 'testvalue2';
		
	});
	
	it('NUMBER: Create, update, and delete data property',function(done){
		
		m3.on('change',function(d){
			if (d.type == 'create'){
				d.property.should.equal('test');
				d.value.should.equal(1);
			} else if (d.type == 'update') {
				d.property.should.equal('test');
				d.value.should.equal(2);
				delete m3.test;
			} else {
				d.property.should.equal('test');
				done();
			}
		});
		
		// Test String
		m3.test = 1;
		//yes.should.equal(m3.test instanceof Number);
		m3.test += 1;
		
	});
	
	it('ARRAY: Create, update, and delete data property',function(done){
		
		m2.on('change',function(d){
			if (d.type == 'create'){
				d.property.should.equal('test');
				d.value.length.should.equal(0);
			} else if (d.type == 'update') {
				d.property.should.equal('test');
				if (d.array.action == 'add'){
					m2.test[d.array.index].should.equal(d.array.value);
				} else if (d.array.action == 'delete'){
					m2.test.length.should.equal(1);
					delete m2.test;
				}
			} else {
				d.property.should.equal('test');
				done();
			}
		});
		
		// Test Array
		m2.test = [];
		yes.should.equal(m2.test instanceof Array);
		m2.test.push('a');
		m2.test[1] = 'b';
		m2.test.pop();
		
	});
	
	it('DATE: Create, update, and delete data property',function(done){
		
		var tmp = new Date();
		
		m4.on('change',function(d){
			console.log(d);
			if (d.type == 'create'){
	console.log('bp1'.red);			
				d.property.should.equal('test');
				d.value.should.equal(tmp);
			} else if (d.type == 'update') {
				console.log('bp2'.magenta);
				d.property.should.equal('test');
				d.value.should.equal(tmp.setFullYear(2014));
				console.log('bp'.magenta);
				delete m4.test;
			} else {
				d.property.should.equal('test');
				done();
			}
		});
		
		// Test String
		m4.test = tmp;
		yes.should.equal(m4.test instanceof Date);
		m4.test.setFullYear(2014);
		
	});
	
	it('REGEX: Create, update, and delete data property',function(done){
		
		m5.on('change',function(d){
			if (d.type == 'create'){
				d.property.should.equal('test');
				yes.should.equal(regexSame(d.value,/.*/gi));
			} else if (d.type == 'update') {
				d.property.should.equal('test');
				yes.should.equal(regexSame(d.value,/(a|b)*/gi));
				delete m5.test;
			} else {
				d.property.should.equal('test');
				done();
			}
		});
		
		// Test String
		m5.test = /.*/gi;
		yes.should.equal(m5.test instanceof RegExp);
		m5.test = /(a|b)*/gi;
		
	});
});