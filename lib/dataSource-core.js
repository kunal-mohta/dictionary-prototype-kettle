/*!
Kettle Core DataSource definitions - portable to browser and node.js

Copyright 2012-2013 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/kettle/blob/master/LICENSE.txt
*/

"use strict";

var fluid = fluid || require("infusion"),
    jsonlint = jsonlint || (require && require("jsonlint")),
    kettle = fluid.registerNamespace("kettle"),
    JSON5 = JSON5 || require("json5");


/** Some common content encodings - suitable to appear as the "encoding" subcomponent of a dataSource **/

fluid.defaults("kettle.dataSource.encoding.JSON", {
    gradeNames: "fluid.component",
    invokers: {
        parse: "kettle.dataSource.parseJSON",
        render: "kettle.dataSource.stringifyJSON"
    },
    contentType: "application/json"
});

fluid.defaults("kettle.dataSource.encoding.JSON5", {
    gradeNames: "fluid.component",
    invokers: {
        parse: "kettle.dataSource.parseJSON5",
        render: "kettle.dataSource.stringifyJSON5"
    },
    contentType: "application/json5"
});

fluid.defaults("kettle.dataSource.encoding.formenc", {
    gradeNames: "fluid.component",
    invokers: {
        parse:  "node.querystring.parse({arguments}.0)",
        render: "node.querystring.stringify({arguments}.0)"
    },
    contentType: "application/x-www-form-urlencoded"
});

fluid.defaults("kettle.dataSource.encoding.none", {
    gradeNames: "fluid.component",
    invokers: {
        parse: "fluid.identity",
        render: "fluid.identity"
    },
    contentType: "text/plain"
});


/** Definitions for parsing JSON using jsonlint to render errors **/

kettle.dataSource.JSONParseErrors = [];

kettle.dataSource.accumulateJSONError = function (str, hash) {
    var error = "JSON parse error at line " + hash.loc.first_line + ", col " + hash.loc.last_column + ", found: \'" + hash.token + "\' - expected: " + hash.expected.join(", ");
    kettle.dataSource.JSONParseErrors.push(error);
};

// Adapt to shitty integration model of JISON-based parsers - beware that any other user of this module will find it permanently corrupted
// TODO: Unfortunately the parser has no error recovery states - this can only ever accumulate a single error
jsonlint.parser.parseError = jsonlint.parser.lexer.parseError = kettle.dataSource.accumulateJSONError;

/** Given a String to be parsed as JSON, which has already failed to parse by JSON.parse, reject the supplied promise with
 * a readable diagnostic. If jsonlint was not loaded, simply return the original diagnostic.
 * @param string {String} The string to be parsed
 * @param err {Error} The exception provided by JSON.parse on the string
 * @param promise {Promise} The promise to be rejected with a readable diagnostic
 */
kettle.dataSource.renderJSONDiagnostic = function (string, err, promise) {
    if (!jsonlint) { // TODO: More principled context detection
        return err.toString();
    }
    kettle.dataSource.JSONParseErrors = [];
    var errors = [];
    try {
        jsonlint.parse(string);
    } catch (e) {
        errors.push(e);
    } // Cannot override the core exception throwing code within the shitty parser - at jsonlint.js line 157
    errors = errors.concat(kettle.dataSource.JSONParseErrors);
    promise.reject({
        message: errors.join("\n")
    });
};

kettle.dataSource.parseJSON = function (string) {
    var togo = fluid.promise();
    if (!string) {
        togo.resolve(undefined);
    } else {
        try {
            togo.resolve(JSON.parse(string));
        } catch (err) {
            kettle.dataSource.renderJSONDiagnostic(string, err, togo);
        }
    }
    return togo;
};

kettle.dataSource.stringifyJSON = function (obj) {
    return obj === undefined ? "" : JSON.stringify(obj, null, 4);
};

kettle.dataSource.parseJSON5 = function (string) {
    var togo = fluid.promise();
    if (!string) {
        togo.resolve(undefined);
    } else {
        try {
            togo.resolve(JSON5.parse(string));
        } catch (err) {
            togo.reject({
                message: err.message || err
            });
        }
    }
    return togo;
};

kettle.dataSource.stringifyJSON5 = function (obj) {
    return obj === undefined ? "" : JSON5.stringify(obj, null, 4);
};

/**
 * The head of the hierarchy of dataSource components. These abstract
 * over the process of read and write access to data, following a simple CRUD-type semantic, indexed by
 a coordinate model (directModel) and which may be asynchronous.
 * Top-level methods are:
 *     get(directModel[, callback|options] -        to get the data from data resource
 *     set(directModel, model[, callback|options] - to set the data (only if writable option is set to `true`)
 */
fluid.defaults("kettle.dataSource", {
    gradeNames: ["fluid.component", "{that}.getWritableGrade"],
    mergePolicy: {
        setResponseTransforms: "replace"
    },
    events: {
        // events "onRead" and "onWrite" are operated in a custom workflow by fluid.fireTransformEvent to
        // process dataSource payloads during the get and set process. Each listener
        // receives the data returned by the last.
        onRead: null,
        onWrite: null,
        onError: null
    },
    components: {
        encoding: {
            type: "kettle.dataSource.encoding.JSON"
        }
    },
    listeners: {
        onRead: {
            func: "{encoding}.parse",
            namespace: "encoding"
        },
        onWrite: {
            func: "{encoding}.render",
            namespace: "encoding"
        }
    },
    invokers: {
        get: {
            funcName: "kettle.dataSource.get",
            args: ["{that}", "{arguments}.0", "{arguments}.1"] // directModel, options/callback
        },
        // getImpl: must be implemented by a concrete subgrade
        getWritableGrade: {
            funcName: "kettle.dataSource.getWritableGrade",
            args: ["{that}", "{that}.options.writable", "{that}.options.readOnlyGrade"]
        }
    },
    // In the case of parsing a response from a "set" request, only transforms of these namespaces will be applied
    setResponseTransforms: ["encoding"],
    charEncoding: "utf8", // choose one of node.js character encodings
    writable: false
});

// TODO: Move this system over to "linkage" too
/** Use the peculiar `readOnlyGrade` member defined on every concrete DataSource to compute the name of the grade that should be
 * used to operate its writable variant if the `writable: true` options is set
 */
kettle.dataSource.getWritableGrade = function (that, writable, readOnlyGrade) {
    if (!readOnlyGrade) {
        fluid.fail("Cannot evaluate writable grade without readOnlyGrade option");
    }
    if (writable) {
        return fluid.model.composeSegments(readOnlyGrade, "writable");
    }
};

fluid.defaults("kettle.dataSource.writable", {
    gradeNames: ["fluid.component"],
    invokers: {
        set: {
            funcName: "kettle.dataSource.set",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // directModel, model, options/callback
        }
    // setImpl: must be implemented by a concrete subgrade
    }
});

// Registers the default promise handlers for a dataSource operation -
// i) If the user has supplied a function in place of method <code>options</code>, register this function as a success handler
// ii) if the user has supplied an onError handler in method <code>options</code>, this is registered - otherwise
// we register the firer of the dataSource's own onError method.

kettle.dataSource.registerStandardPromiseHandlers = function (that, promise, options) {
    promise.then(typeof(options) === "function" ? options : null,
        options.onError ? options.onError : that.events.onError.fire);
};

kettle.dataSource.defaultiseOptions = function (componentOptions, options, directModel, isSet) {
    options = options || {};
    options.directModel = directModel;
    options.operation = isSet ? "set" : "get";
    options.reverse = isSet ? true : false;
    options.writeMethod = options.writeMethod || componentOptions.writeMethod || "PUT"; // TODO: parameterise this, only of interest to HTTP DataSource
    options.notFoundIsEmpty = options.notFoundIsEmpty || componentOptions.notFoundIsEmpty;
    return options;
};

// TODO: Strategy note on these core engines - we need/plan to remove the asymmetry between the "concrete DataSource" (e.g. file or URL) and elements
// of the transform chain. The so-called getImpl/setImpl should be replaced with sources of "just another" transform element, but in this case
// one which transforms out of or into nothing to acquire the initial/final payload.

/** Operate the core "transforming promise workflow" of a dataSource's `get` method. Gets the "initial payload" from the dataSource's `getImpl` method
 * and then pushes it through the transform chain to arrive at the final payload.
 * @param that {Component} The dataSource itself
 * @param directModel {Object} The direct model expressing the "coordinates" of the model to be fetched
 * @param options {Object} A structure of options configuring the action of this get request - many of these will be specific to the particular concrete DataSource
 * @return {Promise} A promise for the final resolved payload
 */

kettle.dataSource.get = function (that, directModel, options) {
    options = kettle.dataSource.defaultiseOptions(that.options, options, directModel);
    var initPayload = that.getImpl(options, directModel);
    var promise = fluid.promise.fireTransformEvent(that.events.onRead, initPayload, options);
    kettle.dataSource.registerStandardPromiseHandlers(that, promise, options);
    return promise;
};

/** Operate the core "transforming promise workflow" of a dataSource's `set` method. Pushes the user's payload backwards through the
 * transforming promise chain (in the opposite direction to that applied on `get`, and then applies it to the dataSource's `setImpl` method.
 * Any return from this is then pushed forwards through a limited range of the transforms (typically, e.g. just decoding it as JSON)
 * on its way back to the user.
 * @param that {Component} The dataSource itself
 * @param directModel {Object} The direct model expressing the "coordinates" of the model to be written
 * @param model {Object} The payload to be written to the dataSource
 * @param options {Object} A structure of options configuring the action of this set request - many of these will be specific to the particular concrete DataSource
 * @return {Promise} A promise for the final resolved payload (not all DataSources will provide any for a `set` method)
 */

kettle.dataSource.set = function (that, directModel, model, options) {
    options = kettle.dataSource.defaultiseOptions(that.options, options, directModel, true); // shared and writeable between all participants
    var transformPromise = fluid.promise.fireTransformEvent(that.events.onWrite, model, options);
    var togo = fluid.promise();
    transformPromise.then(function (transformed) {
        var innerPromise = that.setImpl(options, directModel, transformed);
        innerPromise.then(function (setResponse) { // Apply limited transforms to a SET response payload
            var options2 = kettle.dataSource.defaultiseOptions(that.options, fluid.copy(options), directModel);
            options2.filterNamespaces = that.options.setResponseTransforms;
            var retransformed = fluid.promise.fireTransformEvent(that.events.onRead, setResponse, options2);
            fluid.promise.follow(retransformed, togo);
        }, function (error) {
            togo.reject(error);
        });
    });
    kettle.dataSource.registerStandardPromiseHandlers(that, togo, options);
    return togo;
};


/**
 * A mixin grade for a data source suitable for communicating with the /{db}/{docid} URL space of CouchDB for simple CRUD-style reading and writing
 */

fluid.defaults("kettle.dataSource.CouchDB", {
    mergePolicy: {
        "rules": "nomerge"
    },
    rules: {
        writePayload: {
            value: ""
        },
        readPayload: {
            "": "value"
        }
    },
    listeners: {
        onRead: {
            funcName: "kettle.dataSource.CouchDB.read",
            args: ["{that}", "{arguments}.0"], // resp
            namespace: "CouchDB",
            priority: "after:encoding"
        }
    }
});

fluid.defaults("kettle.dataSource.CouchDB.writable", {
    listeners: {
        onWrite: {
            funcName: "kettle.dataSource.CouchDB.write",
            args: ["{that}", "{arguments}.0", "{arguments}.1"], // model, options
            namespace: "CouchDB",
            priority: "after:encoding"
        }
    }
});

fluid.makeGradeLinkage("kettle.dataSource.CouchDB.linkage", ["kettle.dataSource.writable", "kettle.dataSource.CouchDB"], "kettle.dataSource.CouchDB.writable");

/**
 * Convert a dataSource payload from CouchDB-encoded form -
 *
 * i)  Decode a Couch error response into a promise failure
 *
 * ii) Transform the output from CouchDB using `that.options.rules.readPayload`. The default rules reverse the default
 *     "value" encoding used by `kettle.dataSource.CouchDB.write` (see below).
 *
 * @param {resp} JSON-parsed response as received from CouchDB.
 */
kettle.dataSource.CouchDB.read = function (that, resp) {
    // if undefined, pass that through as per dataSource (just for consistency in FS-backed tests)
    var togo;
    if (resp === undefined) {
        togo = undefined;
    } else {
        if (resp.error) {
            var error = {
                isError: true,
                statusCode: resp.statusCode,
                message: resp.error + ": " + resp.reason
            };
            togo = fluid.promise();
            togo.reject(error);
        } else {
            togo = fluid.model.transformWithRules(resp, that.options.rules.readPayload);
        }
    }
    return togo;
};

/**
 * Convert `model` data for storage in CouchDB using the model transformation rules outlined in
 * `that.options.rules.writePayload`. By default, the entirety of the model is wrapped in a `value` element to avoid
 * collisions with top-level CouchDB variables such as `_id` and `_rev`.
 *
 * @param {model} The data to be stored.
 * @param {options} The `dataSource` options (see above).
 */
kettle.dataSource.CouchDB.write = function (that, model, options) {
    var directModel = options.directModel;
    var doc = fluid.model.transformWithRules(model, that.options.rules.writePayload);
    var original = that.get(directModel, {filterNamespaces: ["encoding"], notFoundIsEmpty: true});
    var togo = fluid.promise();
    original.then(function (originalDoc) {
        if (originalDoc) {
            doc._id = originalDoc._id;
            doc._rev = originalDoc._rev;
        }
        togo.resolve(doc);
    });
    return togo;
};

