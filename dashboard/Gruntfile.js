module.exports = function(grunt) {
  var jsFiles = {
    'build/rollbar_config.js': [
      'src/javascripts/rollbar_config.js',
    ],
    'build/application.js': [
      'src/javascripts/lib/react-with-addons.js',
      'src/javascripts/lib/jquery-2.1.1.js',
      'src/javascripts/lib/page.js',
      'src/javascripts/lib/i18n.js',
      'src/javascripts/lib/spin.js',
      'src/javascripts/lib/moment.js',
      'src/javascripts/lib/select2.js',
      'src/javascripts/lib/jquery.cookie.js',
      'src/javascripts/lib/rollbar.snipet.js',
      'tmp/init.js',                    // initializes the namespaces
      'tmp/mixins/*.js',                // all mixins first
      'tmp/**/*.js',                    // compiled jsx files from tmp
      'src/javascripts/*/**/*',         // all files from subfolders
      '!src/javascripts/**/*.jsx',      // no jsx files
      'src/javascripts/application.js', // end with the application file
    ]
  };

  grunt.initConfig({
    now: Date.now(),
    concat: {
      dist: {
        options: {
          process: function(src, filepath) {
            // This expression is generated by the react build process and
            // is used to display development warnings.
            //
            // We replace this expression with false when we're generating for production.
            return src.replace(/"production" !== "development"/g, 'false');
          },
        },
        files: jsFiles
      },
      dev: {
        files: jsFiles
      }
    },
    uglify: {
      options: {
        mangle: {
          except: ["$super"]
        },
        compress: {
          dead_code: true
        }
      },
      js: {
        files: {
          'build/application.min.js': 'build/application.js'
        }
      }
    },
    cssmin: {
      dist: {
        files: {
          'build/application.min.css': 'build/application.css'
        }
      }
    },
    sass: {
      options: {
        compass: true,
        require: 'sass-globbing',
        style: 'expanded',
        lineNumbers: true,
        trace: true
      },
      dist: {
        files: {
          'build/application.css': 'src/stylesheets/application.sass'
        }
      }
    },
    react: {
      dynamic_mappings: {
        files: [{
          expand: true,
          cwd: 'src/javascripts',
          src: ['init.jsx', '**/*.jsx'],
          dest: 'tmp',
          ext: '.js'
        }]
      }
    },
    watch: {
      files: ['src/**/*', 'Gruntfile.js'],
      tasks: ['default'],
      options: {
        atBegin: true
      }
    },
    clean: {
      tmp: ['tmp/*'],
      dist: ['dist/*'],
      build: ['build/*']
    },
    'string-replace': {
      dev: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['*.html'],
          dest: 'build'
        }],
        options: {
          replacements: [{
            pattern: '@@@JS@@@',
            replacement: 'application.js'
          },
          {
            pattern: '@@@CSS@@@',
            replacement: 'application.css'
          }]
        }
      },
      dist: {
        files: {
          'dist/index.html': 'src/index.html'
        },
        options: {
          replacements: [{
            pattern: '@@@JS@@@',
            replacement: 'application-<%= now %>.min.js'
          },
          {
            pattern: '@@@CSS@@@',
            replacement: 'application-<%= now %>.min.css'
          }]
        }
      }
    },
    copy: {
      dev: {
        files: [{
          expand: true,
          cwd: 'src/images/',
          src: ['**/*'],
          dest: 'build/images/'
        }, {
          expand: true,
          cwd: 'src/fonts/',
          src: ['**/*'],
          dest: 'build/fonts/'
        }, {
          expand: true,
          cwd: 'src/css/',
          src: ['**/*.css'],
          dest: 'build/css/'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/images/',
          src: ['**/*'],
          dest: 'dist/images/'
        }, {
          expand: true,
          cwd: 'src/fonts/',
          src: ['**/*'],
          dest: 'dist/fonts/'
        }, {
          expand: true,
          cwd: 'src/css/',
          src: ['**/*.css'],
          dest: 'dist/css/'
        }, {
          'dist/rollbar_config.js': 'build/rollbar_config.js',
          'dist/application-<%= now %>.min.js': 'build/application.min.js',
          'dist/application-<%= now %>.min.css': 'build/application.min.css'
        }]
      }
    },
    connect: {
      dev: {
        options: {
          base: "build",
          keepalive: true,
          logger: "dev",
          port: 8001,
          middleware: function (connect, options, middlewares) {
            var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
            var modRewrite = require('connect-modrewrite');
            var rewriteThis = modRewrite(['!\\.ttf|\\.woff|\\.html|\\.js|\\.svg|\\.css|\\.png$ /index.html [L]']);
            return [proxy, rewriteThis, connect.static(options.base[0]), connect.directory(options.base[0])];
          }
        },
        proxies: [
          {
            context: ['/dashboard'],
            host: 'localhost',
            port: 8280,
            https: false,
            changeOrigin: false,
            xforward: false
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-react');
  grunt.loadNpmTasks('grunt-connect-proxy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('server', [ 'configureProxies:dev', 'connect:dev']);

  grunt.registerTask('default', ['clean:tmp', 'react', 'sass', 'concat:dev', 'string-replace:dev', 'copy:dev']);
  grunt.registerTask('prod', ['default', 'concat:dist', 'clean:dist', 'string-replace:dist', 'cssmin', 'uglify', 'copy:dist']);
};
