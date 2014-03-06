/*global module:false*/
module.exports = function(grunt) {

  var cfg = {};
	var path = require('path'),
			fs = require('fs');

  Object.defineProperties(cfg,{
    _ngn: {
      enumerable: false,
      writable: true,
      configurable: false,
      value: null
    },
    ngn: {
      enumerable: true,
      get: function(){
        this._ngn = this._ngn || require('./package.json');
        return this._ngn;
      }
    },
		output: {
			enumerable: false,
			get: function(){
				return path.resolve('../../Website/docs.nodengn.com/ngn-'+cfg.ngn.version.replace(/\./g,'-'));
			}
		},
		input:{
			enumerable: false,
			value: {
				docs: path.resolve('../../Documentation'),
				code: path.resolve('../../Library')
			}
    },
		node_modules:{
			enumerable: false,
			writable: true,
			configurable: false,
			value: null
		},
		nodemodules:{
			enumerable: true,
			get: function(){
				if(this.node_modules === null){
					this.node_modules = [];
					var fs = require('fs'), me = this;
					(fs.readdirSync(this.input.code)||[]).forEach(function(dir){
						if (fs.statSync(require('path').dirname(dir)).isDirectory()){
							var pkg = require('path').join(dir,'package.json');
							if (fs.existsSync(pkg)){
								var p = require(pkg);
								if (p.hasOwnProperty('dependencies')){
									me.node_modules = me.node_modules.concat(Object.keys(p.dependencies));
								}
								if (p.hasOwnProperty('devDependencies')){
									me.node_modules = me.node_modules.concat(Object.keys(p.devDependencies));
								}
							}
						}
					});
					this.node_modules = this.node_modules.filter(function(el,i,a){
						return a.indexOf(el) === i;
					});
				}
				return this.node_modules;
			}
		},
		productDocs: {
			enumerable: false,
			get: function(){
				var p = [];
				fs.readdirSync(path.join(this.output,'..')).forEach(function(dir,i,a){
					var d = path.basename(dir),
							v = d.split('-').slice(1,d.split('-').length).join('.');
					if (v !== cfg.ngn.version && d !== 'latest') {
						var	nm = d.split('-')[0].replace('ngn','NGN')+' '+v;
						p.push("{text: '"+nm+"', href: './"+d+"'}"+(i<a.length?',':''));
					}
				});
				return p.length === 0 ? [] : (["<script type='text/javascript'>","Docs.otherProducts = ["].concat(p)).concat(["];","</script>"]);
			}
		},
		docexclusions: {
			enumerable: false,
			get: function(){
				var wrench = require('wrench');
				var exclusions = [];
				exclusions = wrench.readdirSyncRecursive(this.input.code).filter(function(d){
					// Skip anything that isn't in the list of ignored directories
					return (d.match(/node_modules|\.git|test/gi)||[]).length === 1 
						&& ['node_modules','.git','test'].indexOf(path.basename(d).toLowerCase()) >= 0;
				}).map(function(el){
					return path.resolve('../'+el);
				});
				return exclusions;
			}
		}
  });

  // Get list of minimatch patterns that should be excluded
  // from JSHint.
  var _jshint = {
    ignore: function() {
      var ignores = grunt.file.read('.jshintignore');
      console.log(ignores);
      if (ignores) {
        ignores = ignores.split( '\n' )
          .filter(function(_ignore) {
            return !!_ignore.trim();
          })
          .map(function(_ignore){
            if (_ignore.slice(-3) === '.js') {
              return '!' + _ignore;
            }
            if (_ignore.slice(-1) !== '/') {
              _ignore += '/';
            }
            return '!' + _ignore + '**/*.js';
          });

          _jshint.ignore = function () { return ignores; };
          return ignores;
      }
      return [];
    }
  };

  // Project configuration.
  grunt.initConfig({
    blah: function(){
      console.log('test');
    },
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    lint: {
      files: ['Gruntfile.js','bin/**/*.js', 'test/**/*.js']
    },
    test: {
      files: ['test/**/*.js']
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', '<file_strip_banner:bin/cli.js>'],
        dest: 'dist/bin/cli.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint test'
    },
    jshint: {
      all: ['Gruntfile.js', 'test/**/*.js','/lib/**/*.js','/bin/**/*.js'],
      options: {
        "curly": true,
        "eqnull": true,
        "eqeqeq": true,
        "undef": true,
        "devel": true,
        "node": true,
        "nomen": false,
        "globalstrict": false,
        "strict": false,
        "globals": {}
      },
      globals: {}
    },
    uglify: {},
    jsduck: {
      main: {
        // source paths with your code
        src: [
          './lib',
          cfg.input.docs+'/node',
          cfg.input.code+'/ngn-idk-core',
          cfg.input.code+'/ngn-idk-http-web',
          cfg.input.code+'/ngn-idk-http-data',
          cfg.input.code+'/ngn-idk-http-proxy',
          cfg.input.code+'/ngn-idk-rpc',
          cfg.input.code+'/ngn-idk-tcp',
          cfg.input.code+'/ngn-idk-mail',
          cfg.input.code+'/ngn-sdk'
        ],

        // docs output dir
        dest: cfg.output,
				
        // extra options
        options: {
          "title": "NGN v"+cfg.ngn.version,
          "welcome": cfg.input.docs+"/assets/html/welcome.html",
          "head-html": '<link rel="stylesheet" href="resources/css/ngn.css" type="text/css">',
          "categories": cfg.input.docs+"/categories.json",
          "guides": cfg.input.docs+"/guides.json",
          "output": cfg.output,
          //"meta-tags": "docs/custom/tags",
          "builtin-classes": true,
          "warnings": [],
          "external": ['XMLHttpRequest'].concat(cfg.nodemodules),
					"exclude": cfg.docexclusions,
					"body-html": cfg.productDocs
        }
      }
    },
    copy: {
      jsduckassets: {
        files: [
          {expand: true, cwd: cfg.input.docs+'/assets/css/', src:['*.*'], dest: cfg.output+'/resources/css/'},
          {expand: true, cwd: cfg.input.docs+'/assets/images/', src:['*.*'], dest: cfg.output+'/resources/images/'}//,
        ]
      }
    },
    report: {
      core:{}
    }
  });
	
	grunt.task.registerTask('jsduckcheck', 'Make sure the doc directories are available for output.', function(){
		var done = this.async();
		var unlink = function(){
			fs.exists(path.join(path.dirname(cfg.output),'latest'),function(exists){
				if (exists){
					fs.unlink(path.join(path.dirname(cfg.output),'latest'),done);
				} else {
					done();
				}
			});
		}
		
		fs.exists(cfg.output,function(exists){
			if (!exists){
				fs.mkdir(cfg.output,unlink);
			} else {
				unlink();
			}
		});
	});
	
	grunt.task.registerTask('linklatestdoc','Link the latest docs', function(){
		fs.symlink(cfg.output,path.join(path.dirname(cfg.output),'latest'),'dir',this.async);
	});

  grunt.task.registerTask('check', 'Check the build', function() {
    var mods = require('./package.json').ngn.modules;
    for (var dir in mods){
      var done = this.async();
      grunt.log.writeln(path.join(process.cwd(),dir));
      require('child_process').exec("git status",{
        cwd: path.join(process.cwd(),dir),
        env: process.env
      },function(err,result){
        console.log(err);
        done();
      });
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  //grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-jsduck');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-ngn-dev');

  // Default task.
  grunt.registerTask('default', 'jshint');
  grunt.registerTask('docs', ['jsduckcheck','jsduck','copy:jsduckassets','linklatestdoc']);
};