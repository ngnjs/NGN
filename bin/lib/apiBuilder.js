var read = require('read'),
	Seq  = require('seq'),
	fs	 = require('fs'),
	p 	 = require('path');
	
require('colors');

var Wizard = function(root) {
	Seq()
		.seq(function(){
			read({
				prompt: 'API Namespace:',
				'default': 'MY'
			}, this.into('api'));
		})
		.seq(function(){
			read({
				prompt: 'Directory:',
				'default': p.join(process.cwd(),'ngn_extensions',this.vars['class'])
			}, this.into('dir'));
		})
		.seq(function(){
			Build(this.vars);
		});	
};

var Build = function(){
	var arg = arguments[0];
	
	console.log(' >> Creating custom API directories...'.grey);
	if (!fs.existsSync(p.resolve(arg.dir)))
		fs.mkdirSync(p.resolve(arg.dir));
	if (!fs.existsSync(p.resolve(p.join(arg.dir,arg.api))))
		fs.mkdirSync(p.resolve(p.join(arg.dir,arg.api)));
	else
		console.warn(arg.api+' already exists in '+arg.dir);
	
	console.log(' >> Creating/Updating NGN configuration...'.grey);
	// Get/Create the ngn config file.
	if (fs.existsSync((p.resolve('ngn.config.json'))))
		var cfg = require(p.resolve('ngn.config.json'));
	else {
		var cfg = {
			extensions: [],
			application: {},
			'default': {}
		}
	}
	
	if (cfg.extensions.indexOf(p.resolve(arg.dir)) < 0)
		cfg.extensions.push(p.resolve(arg.dir));
		
	for (var i=0;i<cfg.extensions.length;i++){
		if (!fs.existsSync(p.resolve(cfg.extensions[i])))
			console.warn('Cannot find '+cfg[extensions[i]]);
	}
	
	fs.writeFileSync(p.resolve('ngn.config.json'),JSON.stringify(cfg,null,4),'utf8');
	
	console.log(' >> Building demo class...'.grey);
	
	if (!fs.existsSync(p.resolve(p.join(arg.dir,arg.api,'CustomClass.js')))){
		var cb = require('./classBuilder');
		
		cb.build({
			'class': arg.api+'.CustomClass',
			'filename': 'CustomClass.js',
			description: 'A demonstration of how to extend NGN into a custom API.',
			author: 'NGN Build Tool',
			'extend': 'NGN.core',
			'private': 'n',
			singleton: 'n',
			methods: 'y',
			properties: 'y',
			output: p.resolve(p.join(arg.dir,arg.api))
		});
	} else
		console.warn('Demo class could not be created because it already exists.'.yellow);
	
	console.log('Done'.green);
	console.log('The custom API has been started in '.magenta+p.resolve(p.join(arg.dir,arg.api)).toString().magenta.underline);
}

module.exports = {
	wizard: Wizard,
	build: Build
}