var fs	 = require('fs'),
	eyes = require('eyes'),
	dir	 = require('wrench');
	exec = require('child_process').exec,
	p 	 = require('path'),
	cwd	 = process.cwd(),
	root = p.dirname(process.mainModule.filename);
	
// Generate docs
module.exports.build = function(argv) {
	var CREATE 			= argv['create'] || null,
		PUBLISH			= argv['publish'] || null,
		CFG				= argv['configuration'] || p.join(process.cwd(),'ngn.config.json'),
		OUT_DIR			= argv['output'] || p.join(cwd,'docs','manual'),
		HELP			= argv['help'] || argv['h'] || null,
		pkg				= require(require('path').resolve('./package.json'));

	console.log(' >> Cleaning up existing docs...'.grey);
	dir.rmdirSyncRecursive(OUT_DIR.toString().trim(), true);
	
	console.log(' >> Checking configuration...'.grey);
	
	if (fs.existsSync(CFG)){
		var ngncfg = require(CFG);
		
		/*if (fs.existsSync(p.join(ngncfg.docsource,'config.json')))
			var jsdcfg = require(p.join(ngncfg.docsource,'config.json'));
		else*/ 
		if (fs.existsSync(p.join(cwd,ngncfg.docsource,'config.json')))
			var jsdcfg = require(p.join(cwd,ngncfg.docsource,'config.json'));
		else if (fs.existsSync(p.join(cwd,'docs','src','config.json')))
			var jsdcfg = require(p.join(cwd,'docs','src','config.json'));
		else
			var jsdcfg = require(p.join(root,'..','docs','src','config.json'));
			
		if (ngncfg.extensions !== undefined){
			if (jsdcfg['--'] == undefined)
				jsdcfg['--'] = [];
			jsdcfg['--'] = jsdcfg['--'].concat(ngncfg.extensions);
			
			for (var i=0;i<jsdcfg['--'].length;i++){
				if (fs.existsSync(p.join(cwd,jsdcfg['--'][i])))
					jsdcfg['--'][i] = p.join(cwd,jsdcfg['--'][i]);
				else if (fs.existsSync(p.join(root,jsdcfg['--'][i])))
					jsdcfg['--'][i] = p.join(root,jsdcfg['--'][i]);
			}
		}
		
		jsdcfg['--'].push(p.resolve(p.join(root,'..','lib')));
		
		jsdcfg['--title'] += ' v'+pkg.version;
		
		if (argv['examples'])
			jsdcfg['--'].push(p.resolve(p.join(root,'..','examples')))
	} else {
		console.log('Missing Configuration!'.red.bold);
		console.log(CFG.red.underline+' could not be found.'.red);
		return;
	}
	
	var docs = p.join(cwd,ngncfg.docsource||'./docs/src');
	
	if (!fs.existsSync(docs))
		docs = p.join(root,'..','docs','src');
	if (!fs.existsSync(docs)){
		console.log(docs.red);
		throw Error('Could not find doc source.');
	}
	
	// Create a temp config file for processing the request
	if (ngncfg.extensions !== undefined){
		if (ngncfg.extensions.length > 0){
			CFG = docs+'/.ngn.tmp.json';
			fs.writeFileSync(CFG,JSON.stringify(jsdcfg,null,4));
		}
	}
	
	var cmd = 'jsduck --builtin-classes'+(CFG.trim().length>0?' --config '+CFG:'')+' --output "'+p.resolve(OUT_DIR)+'"';
	
	console.log(' >> Building docs...'.grey);
	
	if (argv['showcmd']){
		console.log('-----------------------------------------------------'.grey.bold);
		console.log('CONFIG'.blue);
		console.log(JSON.stringify(jsdcfg,null,4).grey);
		console.log('-----------------------------------------------------'.grey.bold);
		console.log('COMMAND'.blue);
		console.log(cmd.grey);
		console.log('-----------------------------------------------------'.grey.bold);
	}
	
	var child = exec(cmd,{
				 	cwd: docs
				}, function(error,sout,serr){
					fs.exists(p.join(docs,'.ngn.tmp.json'),function(exists){
						if (exists){
							fs.unlink(__dirname+'/.ngn.tmp.json',function(err){
								if (error) {
									console.log('ERROR'.bold.red);
									eyes.inspect(error);
								 } else {
								 	console.log(' >> Updating Permissions...'.grey);
								 	require('wrench').chmodSyncRecursive(OUT_DIR, 0777);
									console.log('DONE'.bold.green);
									console.log('Docs are available at: '.yellow+'file:///'.magenta+p.resolve(p.join(OUT_DIR,'index.html')).magenta);
								}
							});
						} else {
							if (error) {
								console.log('ERROR'.bold.red);
								eyes.inspect(error);
						 	} else {
						 		console.log(' >> Updating Permissions...'.grey);
								 require('wrench').chmodSyncRecursive(OUT_DIR, 0777);
								console.log('DONE'.bold.green);
								console.log('Docs are available at: '.yellow+'file:///'.magenta+p.resolve(p.join(OUT_DIR,'index.html')).magenta);
							}
						}
						
					});
				});
}