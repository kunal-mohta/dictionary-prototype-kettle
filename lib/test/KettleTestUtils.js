/**
 * Kettle Test Utilities
 *
 * Contains base utilities for node.js based tests in Kettle
 *
 * Copyright 2013-2015 Raising the Floor (International)
 * Copyright 2013 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/gpii/universal/LICENSE.txt
 */

"use strict";

var fluid = require("infusion"),
    kettle = fluid.registerNamespace("kettle"),
    fs = require("fs"),
    QUnit = fluid.registerNamespace("QUnit");

fluid.require("ws", require, "kettle.npm.ws");

fluid.registerNamespace("kettle.test");

// Register an uncaught exception handler that will cause any active test fixture to unconditionally fail

kettle.test.handleUncaughtException = function (err) {
    if (QUnit.config && QUnit.config.current) {
        QUnit.ok(false, "Unexpected failure in test case (see following log for more details): " + err.message);
    } else {
        process.exit(1);
    }
};

fluid.onUncaughtException.addListener(kettle.test.handleUncaughtException, "fail",
    fluid.handlerPriorities.uncaughtException.fail);

/*
 * Some low-quality synchronous file utilities, suitable for use in test fixtures
 */

// Utility to recursively delete a directory and its contents from http://www.geedew.com/2012/10/24/remove-a-directory-that-is-not-empty-in-nodejs/
// Useful for cleaning up before and after test cases

kettle.test.deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                kettle.test.deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

kettle.test.copyFileSync = function (sourceFile, targetFile) {
    fs.writeFileSync(targetFile, fs.readFileSync(sourceFile));
};

// Two utilities which aid working with "sequences" in IoC testing fixtures

// returns subarray including only elements between start and end (non-inclusive)
kettle.test.elementsBetween = function (origArray, start, end) {
    var array = fluid.makeArray(origArray);
    start = start || 0;
    if (!end && end !== 0) {
        end = array.length;
    }
    array.length = end;
    array.splice(0, start);
    return array;
};

// insert the supplied elements into the array at position index (DESTRUCTIVE)
kettle.test.insertIntoArray = function (origArray, index, elements) {
    var spliceArgs = [index || 0, 0].concat(elements);
    origArray.splice.apply(origArray, spliceArgs);
};

/** Some definitions for testing Kettle error handlers **/

kettle.test.pushInstrumentedErrors = function (globalErrorHandler) {
    // Beat jqUnit's exception handler so that we can test kettle's instead
    fluid.failureEvent.addListener(fluid.identity, "jqUnit", "before:fail");
    // Beat the existing global exception handler for the duration of these tests
    fluid.onUncaughtException.addListener(globalErrorHandler, "fail", fluid.handlerPriorities.uncaughtException.fail);
};

kettle.test.popInstrumentedErrors = function () {
    fluid.failureEvent.removeListener("jqUnit");
    // restore whatever was the old listener in this namespace, as per FLUID-5506 implementation
    fluid.onUncaughtException.removeListener("fail");
};


/** Definitions for driving IoC Testing framework fixtures **/

// Component that contains the Kettle configuration (server) under test.
fluid.defaults("kettle.test.configuration", {
    gradeNames: ["fluid.component", "{testEnvironment}.options.configurationName"],
    components: {
        server: {
            createOnEvent: "{testEnvironment}.events.constructServer",
            options: {
                gradeNames: "kettle.test.server",
                listeners: {
                    onListen: "{testEnvironment}.events.onServerReady"
                }
            }
        }
    }
});

fluid.defaults("kettle.test.server", {
    listeners: {
        "onCreate.upgradeError": {
            funcName: "kettle.test.server.upgradeError",
            priority: "before:listen"
        }
    }
});

// Forward any errors which reach the end of express' handling chain to our builtin uncaught exception handler to
// enable more easy interception during testing
kettle.test.server.upgradeError = function (server) {
    if (!server.expressApp) { // TODO: more principled approach to "fake server" in multi-config
        return;
    }
    // we MUST supply 4 arguments here
    server.expressApp.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
        fluid.log("kettle.tests.server.upgradeError received error ", err);
        if (err) {
            fluid.log("kettle.tests.server.upgradeError throwing uncaught exception error ", err);
            fluid.onUncaughtException.fire(err);
        }
    });
};


// The two core grades (serverEnvironment and testCaseHolder) for kettle server-aware fixtures.
// There are currently two reasons for separation and locating most material with the testCaseHolder
// based on framework limitations:
// i) An environment can't be its own TestCaseHolder (IoC testing framework limitation)
// ii) The subcomponents of "tests" must be siblings of the fixtures themselves otherwise they
// couldn't be addressed by distributeOptions etc. (FLUID-5495)

fluid.defaults("kettle.test.testCaseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    secret: "kettle tests secret",
    distributeOptions: [{
        source: "{that}.options.secret",
        target: "{that > cookieJar}.options.secret"
    }, {
        source: "{that}.options.secret",
        target: "{that server}.options.secret"
    }],
    components: {
        // The server and all its tree lie under here
        // TODO: It's a big problem to have this site fused with the place where "module/sequence" are etc.
        // It prevents other producers of sequences from participating
        configuration: {
            type: "kettle.test.configuration"
        },
        cookieJar: {
            type: "kettle.test.cookieJar"
        }
    }
});

fluid.defaults("kettle.test.serverEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    events: {
        onServerReady: null,
        constructServer: null
    },
    components: {
        // Aligned with the name generated in kettle.test.testDefToServerEnvironment
        tests: {
            type: "kettle.test.testCaseHolder"
            // configuration is child of this testCaseHolder, then server etc.
        }
    }
});

kettle.test.startServerSequence = fluid.freezeRecursive([
    { // This sequence point is required because of a QUnit bug - it defers the start of sequence by 13ms "to avoid any current callbacks" in its words
        func: "{testEnvironment}.events.constructServer.fire"
    }, {
        event: "{testEnvironment}.events.onServerReady",
        listener: "fluid.identity"
    }
]);

kettle.test.stopServerSequence = fluid.freezeRecursive([
    {
        func: "{testCaseHolder}.configuration.server.stop"
    }, {
        event: "{testCaseHolder}.configuration.server.events.onStopped",
        listener: "fluid.identity"
    }
]);

/** Builds a Fluid IoC testing framework fixture (in fact, the "options" to a TestCaseHolder) given a configuration
 * name and a "testDef". This fixture will automatically be supplied as a subcomponent of an environment of type
 * <code>kettle.test.serverEnvironment</code>.
 * The testDef must include a <code>sequence</code> element which will be fleshed out with the following
 * additions - i) At the front, two elements - firstly a firing of the <code>constructServer</code> event of the TestEnvironment,
 * secondly, a listener for the <code>onServerReady</code> event of the TestEnvironment - ii) at the back, two elements - firstly,
 * an invocation of the <code>stop</code> method of the server. The resulting holder will be a <code>kettle.test.testCaseHolder</code> holding
 * a Kettle server as a subcomponent of its <code>configuration</code> component.
 * @param configurationName {String} A configuration name which will become the "name" (in QUnit terms, "module name") of the
 * resulting fixture
 * @param testDef {Object} A partial test fixture specification. This includes most of the elements expected in a Fluid IoC testing
 * framework "module" specification, with required elements <code>sequence</code>, <code>name</code> and optional element <code>expect</code>. It may
 * also include any configuration directed at the <code>TestCaseHolder</code> component, including some <code>gradeNames</code> to supply some reusable
 * component material.
 * @return {Object} a fully-fleshed out set of options for a TestCaseHolder, incuding extra sequence elements as described above.
 */

kettle.test.testDefToCaseHolder = function (configurationName, testDefIn) {
    var testDef = fluid.copy(testDefIn);
    var sequence = testDef.sequence;
    delete testDef.sequence;
    delete testDef.config;
    sequence.unshift.apply(sequence, kettle.test.startServerSequence);
    sequence.push.apply(sequence, kettle.test.stopServerSequence);

    testDef.modules = [{
        name: configurationName + " tests",
        tests: [{
            name: testDef.name,
            expect: testDef.expect,
            sequence: sequence
        }]
    }];
    return testDef;
};

/** Given a "short testDef" record (with top-level sequence, name, expect, config|configType), will construct a "type record" for
 * a `kettle.test.serverEnvironment` suitable to be sent directly to `fluid.test.runTests`. This will include the contents of the
 * "short testDef" expanded into a full `kettle.test.testCaseHolder` held at a child component named `tests`. The property named
 * `configurationName` will be generated on the testCaseHolder and will be pulled in to produce a `config` grade as parent of the server.
 */
kettle.test.testDefToServerEnvironment = function (testDef) {
    var configurationName = testDef.configType || kettle.config.createDefaults(testDef.config);
    return {
        type: "kettle.test.serverEnvironment",
        options: {
            configurationName: configurationName,
            components: {
                tests: {
                    options: kettle.test.testDefToCaseHolder(configurationName, testDef)
                }
            }
        }
    };
};

/** These functions assist the use of individual files run as tests, as well as assisting a complete
 * module's test suites run in aggregate. The test definitions will be transformed and then contributed
 * to the current queue of asynchronously resolving tests.
 *
 * @param testDefs {Object} or {Array of Object} an array of objects, each representing a test fixture
 * @param transformer {Function} or {Array of Function} an array of transform functions, accepting an object representing a test fixture and returning a "more processed" one. The entire chain
 * of functions will be applied to each member of <code>testDefs</code>, with the result that it becomes a fully fleshed out TestCaseHolder as required by Fluid's
 * <a href="http://wiki.fluidproject.org/display/docs/The+IoC+Testing+Framework">IoC Testing Framework</a>
 */

kettle.test.bootstrap = function (testDefs, transformer) {
    var transformArgs = [fluid.makeArray(testDefs)].concat(fluid.makeArray(transformer));
    var tests = fluid.transform.apply(null, transformArgs);
    return fluid.test.runTests(tests);
};

/** As for kettle.test.bootstrap, only transform the supplied definitions by converting them into kettle
 * server tests, bracketed by special server start and stop sequence points. Any supplied transforms in the 2nd
 * argument will be run before the standard transform to construct server-aware test cases */

kettle.test.bootstrapServer = function (testDefs, transformer) {
    return kettle.test.bootstrap(testDefs, fluid.makeArray(transformer).concat([kettle.test.testDefToServerEnvironment]));
};
