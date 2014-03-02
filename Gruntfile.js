/*global module:false*/
module.exports = function(grunt) {

  var cfg = {};

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
				return require('path').resolve('../../Website/docs.nodengn.com/ngn-'+cfg.ngn.version.replace(/\./g,'-'));
			}
		},
		input:{
			enumerable: false,
			value: {
				docs: require('path').resolve('../../Documentation'),
				code: require('path').resolve('../../Library')
			}
    },
		productDocs: {
			enumerable: false,
			get: function(){
				var p = [];
				require('fs').readdirSync(require('path').join(this.output,'..')).forEach(function(dir,i,a){
					var d = require('path').basename(dir),
							v = d.split('-').splice(0,1).join('.');
					if (v !== cfg.ngn.version) {
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
					return (d.match(/node_modules|\.git/gi)||[]).length === 1 
						&& ['node_modules','.git'].indexOf(require('path').basename(d).toLowerCase()) >= 0;
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
          cfg.input.code+'ngn-idk-http-web',
          cfg.input.code+'ngn-idk-http-data',
          cfg.input.code+'ngn-idk-http-proxy',
          cfg.input.code+'ngn-idk-http-rpc',
          cfg.input.code+'ngn-idk-http-tcp',
          cfg.input.code+'ngn-idk-mail',
          cfg.input.code+'ngn-sdk'
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
          "external": ['XMLHttpRequest'],
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
		console.log('>>>>>>>>>>>>>>>>>>>>>>',cfg.docexclusions);
		require('fs').exists(cfg.output,function(exists){
			if (!exists){
				require('fs').mkdir(cfg.output,done);
			} else {
				done();
			}
		});
	});

  grunt.task.registerTask('check', 'Check the build', function() {
    var mods = require('./package.json').ngn.modules;
    for (var dir in mods){
      var done = this.async();
      grunt.log.writeln(require('path').join(process.cwd(),dir));
      require('child_process').exec("git status",{
        cwd: require('path').join(process.cwd(),dir),
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
  grunt.registerTask('docs', ['jsduckcheck','jsduck','copy:jsduckassets']);
};