var read = require('read'),
	Seq  = require('seq'),
	fs	 = require('fs'),
	p 	 = require('path');
	
require('colors');

var Wizard = function(root) {
	Seq()
		.seq(function(){
			read({
				prompt: 'Class Name:',
				'default': 'NGNX.xtn.Class'
			}, this.into('class'));
		})
		.seq(function(){
			read({
				prompt: 'Filename:',
				'default': this.vars['class'].split('.')[this.vars['class'].split('.').length-1]+'.js'
			}, this.into('filename'));
		})
		.seq(function(){
			read({
				prompt: 'Description:',
				'default': ''
			}, this.into('description'));
		})
		.seq(function(){
			read({
				prompt: 'Author:',
				'default': 'NGN Generator'
			}, this.into('author'))
		})
		.seq(function(){
			read({
				prompt: 'Extends:',
				'default': 'NGN.core'
			}, this.into('extend'))
		})
		.seq(function(){
			read({
				prompt: 'Private Class?:',
				'default': 'n'
			}, this.into('private'))
		})
		.seq(function(){
			read({
				prompt: 'Singleton?:',
				'default': 'n'
			}, this.into('singleton'))
		})
		.seq(function(){
			read({
				prompt: 'Will this class have custom methods/functions?:',
				'default': 'y'
			}, this.into('methods'))
		})
		.seq(function(){
			read({
				prompt: 'Will this class have custom properties/config attributes?:',
				'default': 'y'
			}, this.into('properties'))
		})
		.seq(function(){
			read({
				prompt: 'Save to Directory:',
				'default': './'
			}, this.into('output'))
		})
		.seq(function(){
			Build(this.vars);
		});
}

var Build = function(){
	
	var arg = arguments[0];
	
	if (!fs.existsSync(arg.output)){
		arg.output = p.resolve(p.join(process.cwd(),arg.output));
		if (!fs.existsSync(arg.output))
			throw Error('Could not find location: '+arg.output);
	}
	
	var t = '    '; // tab
	var cr= '\n';
	var str = "require('ngn');"+cr+cr;
	
	// Generate Comments
	str += "/**"+cr+" * @class "+arg['class']+cr+" * "+arg.description+cr;
	str += " * @extends "+arg.extend+cr;
	str += (arg['private'] == 'y' ? " * @private"+cr : '');
	str += (arg.singleton == 'y' ? " * @singleton"+cr : '');
	str += " * @author "+arg.author+cr ;
	str += " */"+cr;
	
	// Stub Code
	str += "var Class = "+arg.extend+".extend({"+cr+cr;
	str += t+"constructor: function(config) {"+cr+cr;
	str += t+t+"// Call the parent constructor"+cr;
	str += t+t+"Class.super.constructor.call(this,config);";
	
	//Optionally support additional properties
	if (arg.properties == 'y') {
		str += cr+cr+t+t+'//TODO: Create configuration/properties.'
		
		str += cr+t+t+"Object.defineProperties(this,{"+cr;
		
		str += t+t+t+"/**"+cr+t+t+t+' * @cfg {String} [someConfigPropery=null]'+cr;
		str += t+t+t+' * Replace me.'+cr;
		str += t+t+t+' */'+cr;
		str += t+t+t+'someConfigProperty: {'+cr;
		str += t+t+t+t+'value: config.someConfigProperty || null,'+cr;
		str += t+t+t+t+'enumerable: true,'+cr;
		str += t+t+t+t+'writable: true,'+cr;
		str += t+t+t+t+'configurable: true'+cr;
		str += t+t+t+"},"+cr+cr;
		
		str += t+t+t+"/**"+cr+t+t+t+' * @property {String}'+cr;
		str += t+t+t+' * Replace me.'+cr;
		str += t+t+t+' */'+cr;
		str += t+t+t+'someProperty: {'+cr;
		str += t+t+t+t+'value: null,'+cr;
		str += t+t+t+t+'enumerable: true,'+cr;
		str += t+t+t+t+'writable: true,'+cr;
		str += t+t+t+t+'configurable: true'+cr;
		str += t+t+t+"}"+cr+cr;
		
		str += t+t+"});";
	}
	str += cr+cr;
	
	str += t+t+'// Constructor code goes here....'+cr+cr;
	str += t+"}";
	
	// Add custom method stubb
	if (arg.methods == 'y') {
		str += ","+cr+cr;
		str += t+"//TODO: Create class functions."+cr+cr;
		str += t+"/**"+cr;
		str += t+' * @method'+cr;
		str += t+' * This is a custom function.'+cr;
		str += t+' * @param {String} [arg=null]'+cr;
		str += t+' * This argument is `null` by default.'+cr;
		str += t+' */'+cr;
		str += t+"myFunction: function(arg) {"+cr;
		str += t+t+"// Code..."+cr;
		str += t+"}";
	}
	str += cr+cr;
	
	str += "});"+cr+cr;
	str += "module.exports = Class;";
	
	fs.writeFile(p.resolve(p.join(arg.output,arg.filename)),str,'utf8',function(){
		fs.chmodSync(p.resolve(p.join(arg.output,arg.filename)),'662');
		console.log('Class stub created at '.magenta+p.resolve(p.join(arg.output,arg.filename)).magenta.bold);
	});
}


module.exports = {
	wizard: Wizard,
	build: Build
}
