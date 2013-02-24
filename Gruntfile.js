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
          'docs/src/node'
        ],
  
        // docs output dir
        dest: 'docs/manual',
  
        // extra options
        options: {
          "title": "NGN v"+cfg.ngn.version,
          "welcome": "docs/src/assets/html/welcome.html",
          "head-html": '<link rel="stylesheet" href="resources/css/ngn.css" type="text/css">',
          "categories": "docs/src/categories.json",
          "guides": "docs/src/guides.json",
          "output": "docs/manual",
          "meta-tags": "docs/custom/tags",
          'builtin-classes': true,
          'warnings': [],
          'external': ['XMLHttpRequest']
        }
      }
    },
    copy: {
      jsduckassets: {
        files: [
          {expand: true, cwd: './docs/src/assets/css/', src:['*.*'], dest: './docs/manual/resources/css/'},
          {expand: true, cwd: './docs/src/assets/images/', src:['*.*'], dest: './docs/manual/resources/images/'}//,
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  //grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-jsduck');

  // Default task.
  grunt.registerTask('default', 'jshint');
  grunt.registerTask('docs', ['jsduck','copy:jsduckassets']);
};