/*
 * Copyright (c) 2015 Marco Trulla
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig( {
        pkg: grunt.file.readJSON( "package.json" ),

        jshint: {
            all: [
                "Gruntfile.js",
                "tasks/*.js"
            ],
            options: {
                jshintrc: ".jshintrc"
            }
        },

        // Configuration to be run (and then tested).
        json5lint: {
            default_options: {
                options: {},
                src: "test/fixtures/package.*"
            }
        }

    } );

    // Actually load this plugin's task(s).
    grunt.loadTasks("tasks");

    grunt.loadNpmTasks("grunt-contrib-jshint");

    // By default, lint and run all tests.
    grunt.registerTask( "default", [ "jshint", "json5lint" ] );

};
