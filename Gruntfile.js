/*global module:false*/
module.exports = function(grunt) {

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
      all: ['Gruntfile.js', 'bin/**/*.js', 'test/**/*.js','!bin/lib/builder/*.js'],
      options: {
        "curly": true,
        "eqnull": true,
        "eqeqeq": true,
        "undef": true,
        "devel": true,
        "node": true,
        "nomen": false,
        "globalstrict": false,
        "strict": false
      },
      globals: {
        "globalstrict": false,
        "strict": false
      }
    },
    uglify: {}
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-bump');

  // Default task.
  grunt.registerTask('default', 'lint test concat min');
};
