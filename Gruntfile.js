module.exports = function (grunt) {

    /*  Load tasks  */
    require('load-grunt-tasks')(grunt);

    /*  Configure project  */
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        nggettext_extract: {
            pot: {
                files: {
                    '../languages/template.pot': ['../**/*.html', '../**/*.js', '!../**/app/**', '!../**/js/**', '!../**/lang/**', '!../**/oauth/**', '!../**/_src/**']
                }
            }
        },

        nggettext_compile: {
            all: {
                options: {
                    format: "json"
                },
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: "../languages/",
                        dest: "../languages/",
                        src: ["../languages/*.po"],
                        ext: ".json"
                    }
                ]
            },
        }

    });

    // Allows to update modified files only.
    grunt.loadNpmTasks('grunt-angular-gettext');

    /*  Register tasks  */
    grunt.registerTask('default', ['nggettext_extract', 'nggettext_compile']);

};