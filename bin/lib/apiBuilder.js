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
		/*.seq(function(){
			read({
				prompt: 'Description:',
				'default': ''
			}, this.into('description'));
		})*/
		.seq(function(){
			Build(this.vars);
		});	
};

var Build = function(){
	var arg = arguments[0];
	console.log(arg);
	if (!fs.existsSync(p.resolve(arg.dir)))
		fs.mkdirSync(p.resolve(arg.dir));
	if (!fs.existsSync(p.resolve(p.join(arg.dir,arg.api))))
		fs.mkdirSync(p.resolve(p.join(arg.dir,arg.api)));
	//TODO: Add to ngn.config.json
	//TODO: Create a dummy class as a starting point	
	console.log('The custom API can be built in '.magenta+p.resolve(p.join(arg.dir,arg.api)).toString().magenta.underline);
}

module.exports = {
	wizard: Wizard
}