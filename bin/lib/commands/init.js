var cli = require('optimist'),
    exec= require('child_process').exec,
    fs = require('fs'),
    path = require('path'),
    Seq = require('seq'),
    read = require('read');
require('colors');
/*
console.log('TODO: Init'.cyan);
require('colors');
var argv = cli
		.usage('Usage: ngn init --<options>')
		.describe('test'.bold,'sdfsfsd')
		.demand('test'.bold).argv;
*/
/*
var init = function(){
  var cfg = fs.existsSync(path.join(process.cwd(),'package.json')) == true
            ? require(path.join(process.cwd(),'package.json'))
            : {};

  Seq()
    .seq(function(){
      read({
        prompt: 'Name:',
        'default': cfg.name || path.basename(process.cwd())
      },this.into('name'));
    })
    .seq(function(){
      read({
        prompt: 'Version:',
        'default': cfg.version || '0.0.1'
      },this.into('version'));
    })
    .seq(function(){
      read({
        prompt: 'Description:',
        'default': cfg.description || ''
      },this.into('description'));
    })
    .seq(function(){
      read({
        prompt: 'Main file:',
        'default': cfg.main || this.vars.name.trim().replace(/[^0-9a-zA-Z]|\.js/gi,'').toLowerCase()+'.js'
      },this.into('main'));
    })
    .seq(function(){
      read({
        prompt: 'Author:',
        'default': cfg.author || 'Unknown'
      },this.into('author'));
    })
    .seq(function(){
      read({
        prompt: 'License:',
        'default': cfg.license || 'MIT'
      },this.into('license'));
    })
    .seq(function(){
      console.log('Writing package.json...'.blue);
      console.log('Write',this.vars);
      fs.writeFile(path.join(process.cwd(),'package.json'),JSON.stringify(this.vars,null,2),'utf8',function(){
        console.log('Writing initial JavaScript...'.blue);
        var str = "require('ngn');\n\nconsole.log('Initial Code. Replace Me.');";
        fs.writeFile(path.join(process.cwd(),this.vars.main,'utf8',function(){
          console.log('DONE'.green.bold);
        }));
      });
    });
};*/

fs.exists(path.join(process.cwd(),'node_modules','ngn'),function(exists){
  if (!exists){
    console.log('Adding NGN Support...'.blue.bold);
    exec('npm link ngn',{cwd:process.cwd()},function(){
      console.log('NGN is now available.'.green);
    });
  } else {
    console.log('NGN is already available.'.magenta)
    //init();
  }
});