var read = require('read'),
    Seq = require('seq'),
    fs = require('fs'),
    p = require('path'),
    uuid = require('node-uuid'),
    bcrypt = require('bcrypt');
	
require('colors');

var pkg = require(require('path').resolve('./package.json'));

// Make sure the config folder is available
var cfgPath = p.join(__dirname,'..','..','..','.config');

// If no .config directory exists, create one
if (!fs.existsSync(cfgPath)){
  fs.mkdirSync(cfgPath);
}

// Get existing configurations
try { var cfg = require(p.join(cfgPath,'manager.json'));} catch (e) {var cfg = {};}

// The main wizard
var wizard = function(){
	Seq()
		.seq(function(){
			read({
				prompt: 'Server Name:',
				'default': cfg.name || 'Untitled'
			}, this.into('name'));
		})
		.seq(function(){
			read({
				prompt: 'Server Description:',
				'default': cfg.description || 'NGN Server v'+pkg.version
			}, this.into('dsc'));
		})
		.seq(function(){
			read({
				prompt: 'Service Bus Port:',
				'default': cfg.port || 55555
			}, this.into('port'));
		})
		.seq(function(){
			read({
				prompt: 'Admin Email:',
				'default': cfg.admin || 'admin@localhost'
			}, this.into('admin'));
		})
		.seq(function(){
			if (cfg.password){
				console.log('An admin password already exists. A new password is not required, but can be reset now.'.cyan);
			}
			read({
				prompt: 'Admin Secret:',
				silent: true
			}, this.into('pwd'));
		})
		.seq(function(){
			Build(this.vars);
		});
};

// The main build process
var Build = function(arg){
	
	console.log('\n>> Creating Configuration Files'.cyan);
	
	cfg.name         = arg.name;
	cfg.description  = arg.dsc;
	cfg.port         = arg.port;
	cfg.admin        = arg.admin;
	
	// If the password is defined, create it.
	if (arg.pwd !== 'skip') {
		console.log('   ... Encrypting'.magenta);
		
		var salt       = bcrypt.genSaltSync(12);

    cfg.secret = bcrypt.hashSync(arg.pwd,salt);
	
		console.log('   ... Complete.'.magenta);
	}
	
	console.log('>> Saving Configuration...'.cyan);
	fs.writeFileSync(p.join(cfgPath,'manager.json'),JSON.stringify(cfg,true,4),'utf8');

	console.log('\nDONE!'.green.bold);
};

wizard();
