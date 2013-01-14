// Include NGN (locally)
var should = require('should'),
	wrench = require('wrench');

/**
 * Make sure the NGN global namespace is available.
 */
describe('Namespaces Exist', function(){
	it('NGN Core Library Exists', function(){
	  should.exist(__NGN);
	  should.exist(NGN);
	});
	it('NGNX Extended Library Exists', function(){
	  should.exist(__NGNX);
	  should.exist(NGNX);
	});
	it('$ Function Library Exists', function(){
	  should.exist(__$);
	});
});

describe('Base Components Exist',function(){
	it('NGN.Patterns',function(){
		should.exist(__NGN.Patterns);
	});
});

describe('NGN Core Exists',function(){
	it('NGN.core.Command',function(){
		should.exist(__NGN.core.Command);
	});
	
	it('NGN.core.HttpClient',function(){
		should.exist(__NGN.core.HttpClient);
	});
	
	it('NGN.core.HttpServer',function(){
		should.exist(__NGN.core.HttpClient);
	});
	
	it('NGN.core.MailTransport',function(){
		should.exist(__NGN.core.MailTransport);
	});
	
	it('NGN.core.Server',function(){
		should.exist(__NGN.core.Server);
	});
	
	it('NGN.core.RemoteServer',function(){
		should.exist(__NGN.core.RemoteServer);
	});
	
	it('NGN.core.SmtpServer',function(){
		should.exist(__NGN.core.SmtpServer);
	});
	
	it('NGN.core.Syslog',function(){
		should.exist(__NGN.core.Syslog);
	});
});


describe('NGN Application Exists',function(){
	it('NGN.system.Process',function(){
		should.exist(__NGN.system.Process);
	});
	
	it('NGN.system.Configuration',function(){
		should.exist(__NGN.system.Configuration);
	});
});


describe('NGN Datasources Exist',function(){
	it('NGN.datasource.Client',function(){
		should.exist(__NGN.datasource.Client);
	});
	
	it('NGN.datasource.Connection',function(){
		should.exist(__NGN.datasource.Connection);
	});
	
	it('NGN.datasource.Memory',function(){
		should.exist(__NGN.datasource.Memory);
	});
	
	it('NGN.datasource.MongoDB',function(){
		should.exist(__NGN.datasource.MongoDB);
	});
	
	it('NGN.datasource.Redis',function(){
		should.exist(__NGN.datasource.Redis);
	});
});

describe('NGN Mail Exists',function(){
	
	it('NGN.mail.Attachment',function(){
		should.exist(__NGN.mail.Attachment);
	});
	
	it('NGN.mail.Message',function(){
		should.exist(__NGN.mail.Message);
	});
});

describe('NGN Models Exist',function(){
	
	it('NGN.model.Model',function(){
		should.exist(__NGN.model.Model);
	});
	
	it('NGN.model.Person',function(){
		should.exist(__NGN.model.Person);
	});
	
	it('NGN.model.Email',function(){
		should.exist(__NGN.model.Email);
	});
	
	it('NGN.model.Login',function(){
		should.exist(__NGN.model.Login);
	});
	
	it('NGN.model.data.Association',function(){
		should.exist(__NGN.model.data.Association);
	});
	
	it('NGN.model.data.Manager',function(){
		should.exist(__NGN.model.data.Manager);
	});
	
	it('NGN.model.data.Monitor',function(){
		should.exist(__NGN.model.data.Monitor);
	});
	
});

describe('NGN Utilities Exist',function(){
	
	it('NGN.util.Logger',function(){
		should.exist(__NGN.util.Logger);
	});
	
	it('NGN.util.Template',function(){
		should.exist(__NGN.util.Template);
	});
});

describe('NGN Web Exists',function(){
	
	it('NGN.web.Client',function(){
		should.exist(__NGN.web.Client);
	});
	
	it('NGN.web.Processor',function(){
		should.exist(__NGN.web.Processor);
	});
	
	it('NGN.web.Proxy',function(){
		should.exist(__NGN.web.Proxy);
	});
	
	it('NGN.web.API',function(){
		should.exist(__NGN.web.API);
	});
	
	it('NGN.web.Server',function(){
		should.exist(__NGN.web.Server);
	});
	
	it('NGN.web.Static',function(){
		should.exist(__NGN.web.Static);
	});
	
	it('NGN.web.auth.Strategy',function(){
		should.exist(__NGN.web.auth.Strategy);
	});
	
	it('NGN.web.proxy.RewriteRule',function(){
		should.exist(__NGN.web.proxy.RewriteRule);
	});
	
	it('NGN.web.proxy.VirtualHost',function(){
		should.exist(__NGN.web.proxy.VirtualHost);
	});
});

describe('NGNX Datasource Extensions Exist',function(){
	
	it('NGNX.datasource.client.Redis',function(){
		should.exist(__NGNX.datasource.client.Redis);
	});
	
	it('NGNX.datasource.crud.MongoDB',function(){
		should.exist(__NGNX.datasource.crud.MongoDB);
	});

});

describe('NGNX Mail Extensions Exist',function(){
	
	it('NGNX.mail.Common',function(){
		should.exist(__NGNX.mail.Common);
	});
	
	it('NGNX.mail.Gmail',function(){
		should.exist(__NGNX.mail.Gmail);
	});
	
	it('NGNX.mail.Hotmail',function(){
		should.exist(__NGNX.mail.Hotmail);
	});
	
	it('NGNX.mail.iCloud',function(){
		should.exist(__NGNX.mail.iCloud);
	});
	
	it('NGNX.mail.Postmark',function(){
		should.exist(__NGNX.mail.Postmark);
	});
	
	it('NGNX.mail.Sendgrid',function(){
		should.exist(__NGNX.mail.Sendgrid);
	});
	
	it('NGNX.mail.SES',function(){
		should.exist(__NGNX.mail.SES);
	});
	
	it('NGNX.mail.Yahoo',function(){
		should.exist(__NGNX.mail.Yahoo);
	});
	
	it('NGNX.mail.Zoho',function(){
		should.exist(__NGNX.mail.Zoho);
	});
});

describe('NGNX Template Extensions Exist',function(){
	
	it('NGNX.template.email.Validation',function(){
		should.exist(__NGNX.template.email.Validation);
	});
});

describe('NGNX Web Extensions Exist',function(){
	
	it('NGNX.web.ApiRequestHelper',function(){
		should.exist(__NGNX.web.ApiRequestHelper);
	});
	
	it('NGNX.web.Proxy',function(){
		should.exist(__NGNX.web.Proxy);
	});
	
	it('NGNX.web.ProxyController',function(){
		should.exist(__NGNX.web.ProxyController);
	});
	
	it('NGNX.web.WebRequestHelper',function(){
		should.exist(__NGNX.web.WebRequestHelper);
	});
});

/**
 * Make sure datasource connections can be created.
 */
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