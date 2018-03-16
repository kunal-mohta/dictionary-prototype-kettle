/*
 * grunt-json5lint
 * https://github.com/ragnarokkr/grunt-json5lint
 *
 * Copyright (c) 2015 Marco Trulla
 * Licensed under the MIT license.
 */

"use strict";

var sprintf = require("sprintf-js").sprintf,
    JSON5 = require("json5"),

    msg_fileNotFound = "Source file \"%s\" not found.",
    msg_notValidJSON5 = "Source file \"%s\" is not valid JSON5",
    msg_lintValid = "%d file%s lint free.",
    msg_lintNotValid = "%d file%s failed JSON5 validation.";

module.exports = function ( grunt ) {

    grunt.registerMultiTask( "json5lint", "Validate JSON5 files.", function () {
        var valid = 0,
            notValid = 0;

        // Iterate over all files.
        this.filesSrc.filter( function ( filepath ) {
            if ( !grunt.file.exists( filepath ) ) {
                grunt.fail.warn( sprintf ( msg_fileNotFound, filepath ) );
                return false;
            } else {
                return true;
            }
        } ).forEach( function ( filepath ) {
            var f = grunt.file.read( filepath );
            try {
                JSON5.parse( f );
                valid++;
            } catch ( error ) {
                notValid++;
                grunt.log.error( sprintf( msg_notValidJSON5, filepath ) );
                grunt.log.error( error );
            }
        } );
        if (valid > 0) {
            grunt.log.ok( sprintf( msg_lintValid, valid, valid > 1 ? "s" : "" ) );
        }
        if (notValid > 0) {
            grunt.log.error( sprintf( msg_lintNotValid, notValid, notValid > 1 ? "s" : "" ) );
        }

        if ( this.errorCount ) {
            return false;
        }
    } );
};
