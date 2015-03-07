module.exports = function (grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= pkg.license %> */\n',
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            dist: {
                files: {
                    "dist/lilli.js": ["src/**/*.js"]
                }
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                src: "dist/lilli.js",
                dest: "dist/lilli.min.js"
            }
        },
        jshint: {
            options: {
                globals: {
                    window: true
                },
                node: true,
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                eqnull: true,
                boss: true,
                bitwise: true,
                camelcase: true,
                forin: true,
                quotmark: "double",
                strict: true
            },
            files: ['!Gruntfile.js', 'src/**/*.js']
        },
        jasmine: {
            runTests: {
                src: ['src/lilli.js'],
                options: {
                    specs: 'specs/**/*.js',
                    vendor: 'specs/vendor/**/*.js'
                }
            },
            coverage: {
                src: ['src/**/*.js'],
                options: {
                    specs: ['specs/lilli.spec.js'],
                    vendor: 'specs/vendor/**/*.js',
                    template: require('grunt-template-jasmine-istanbul'),
                    templateOptions: {
                        coverage: 'specs/report/coverage.json',
                        report: {
                            type: 'html',
                            options: {
                                dir: 'specs/report'
                            }
                        }
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-template-jasmine-istanbul');


    grunt.registerTask('default', ['jshint', 'jasmine:runTests', 'concat', 'uglify']);
    grunt.registerTask('report', ['jasmine:runTests', 'jasmine:coverage']);
};

