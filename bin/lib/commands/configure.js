var read = require('read'),
    Seq = require('seq'),
    fs = require('fs'),
    p = require('path');
	
require('colors');
console.log(p.join(__dirname,'..','..','..','package.json'));
var pkg = require(p.join(__dirname,'..','..','..','package.json'));

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
			if (cfg.secret){
        console.log('An admin password already exists. A new password is not required, but can be reset now.'.cyan);
			}
			
			read({
				prompt: 'Admin Secret:',
				silent: true,
				replace: '*'
			}, this.into('pwd'));
		})
		.seq(function(){
      read({
        prompt: 'Enable NGN Manager Process Protection? (Y/n):',
          'default': "Y"
      }, this.into('secure'));
		})
		.seq(function(){
      if (['y','yes'].indexOf(this.vars.secure.trim().toLowerCase()) >= 0){
        this.vars.secure = true;
        read({
          prompt: 'NGN Manager Process Secret:',
          'default': cfg.process_key || 'auto'
        }, this.into('key'));
      } else {
      this.vars.secure = false;
        this.next();
      }
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

	if (arg.secure){
    if (!cfg.hasOwnProperty('manager_key')){
      cfg.process_key = null;
    }

    if (cfg.process_key !== arg.key || arg.key === 'auto'){
      var uuid = require('node-uuid');
      cfg.process_key = arg.key !== 'auto' ? arg.key : uuid.v1().replace(/-/gi,'');
    }
	} else if (cfg.hasOwnProperty('process_key')){
    console.log('Attempt to remove'.yellow);
    delete cfg.process_key;
	}

  if (arg.pwd.trim().length === 0){
    arg.pwd = null;
	} else {
    arg.pwd = arg.pwd.trim();
	}
	
	// If the password is not defined, create it.
	if (!cfg.hasOwnProperty('secret')){
    cfg.secret = null;
	}

	// If a new password is provided, encrypt it
	if (arg.pwd !== cfg.secret && arg.pwd !== null) {
    var bcrypt = require('bcrypt');

		console.log('   ... Encrypting'.magenta);
		
		var salt = bcrypt.genSaltSync(12);

    cfg.secret = bcrypt.hashSync(arg.pwd,salt);
	
		console.log('   ... Complete.'.magenta);
	}
	
	if (cfg.secret == null){
    delete cfg.secret;
  }
	
	console.log('>> Saving Configuration...'.cyan);
	fs.writeFileSync(p.join(cfgPath,'manager.json'),JSON.stringify(cfg,true,4),'utf8');

  Seq()
    .seq(function(){
      console.log('Ask to start here');
      read({
        prompt:'Launch or relaunch NGN Mechanic now?',
        'default': 'y'
      },this.into('launch'));
    })
    .seq(function(){
      if (this.vars.launch.trim().toLowerCase() == 'y' || this.vars.launch.trim().toLowerCase() == 'yes'){
        var mechanic = require('ngn-mechanic');
        mechanic.service.start();
            /*forever = require('forever-monitor'),
            maxRestarts = 25,
            child = new forever.Monitor(mechanic.path, {
              max: maxRestarts,
              uid: 'ngn-mechanic',
              silent: true,
              //watch: true,
              logFile: p.join(p.dirname(mechanic.path),'logs','general.log'),
              outFile: p.join(p.dirname(mechanic.path),'logs','output.log'),
              errFile: p.join(p.dirname(mechanic.path),'logs','error.log')
            });
      
        child.on('exit', function () {
          console.log('NGN Mechanic has exited after '+maxRestarts+' restarts');
        });

        child.start();*/
      }
      console.log('\nDONE!'.green.bold);
    });
};

wizard();
