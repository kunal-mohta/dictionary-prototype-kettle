/*
Routing Primitives for Kettle Servers

Copyright 2015 Raising the Floor (International)

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/kettle/blob/master/LICENSE.txt
*/

/* Contains code adapted from express 4.x "layer.js":
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

"use strict";

var fluid = require("infusion"),
    urlModule = require("url"),
    kettle = fluid.registerNamespace("kettle");

// Upstream dependency stolen from express 4.x
// Note that path-to-regexp 2.0.0 breaks compatibility with our use of /* to encode middleware matches - seems unlikely we will upgrade
kettle.pathToRegexp = require("path-to-regexp");

fluid.defaults("kettle.router.http", {
    gradeNames: "fluid.component",
    members: {
        handlers: []
    },
    invokers: {
        register: {
            funcName: "kettle.router.http.register",
            args: ["{that}", "{arguments}.0"]
        },
        match: {
            funcName: "kettle.router.http.match",
            args: ["{that}.handlers", "{arguments}.0"]
        }
    }
});


kettle.router.http.register = function (that, handler) {
    var prefix = handler.prefix || "";
    handler.regexp = kettle.pathToRegexp(prefix + handler.route, handler.keys = []);
    that.handlers.push(handler);
};

kettle.router.registerOneHandlerImpl = function (that, handler, extend) {
    var handlerCopy = fluid.extend({
        method: "get"
    }, handler, extend);
    kettle.router.http.register(that, handlerCopy);
};

kettle.router.http.decodeParam = function (val) {
    if (typeof val !== "string" || val.length === 0) {
        return val;
    }
    try {
        return decodeURIComponent(val);
    } catch (err) {
        err.message = "Failed to decode request routing parameter \"" + val + "\"";
        err.status = err.statusCode = 400;
        throw err;
    }
};

kettle.router.http.matchToParams = function (handler, match) {
    var params = {};
    for (var i = 1; i < match.length; i++) {
        var key = handler.keys[i - 1];
        var prop = key.name;
        var val = kettle.router.http.decodeParam(match[i]);

        if (val !== undefined) {
            params[prop] = val;
        }
    }
    return params;
};

// cf. Router.prototype.matchRequest
kettle.router.http.match = function (handlers, req) {
    var method = req.method.toLowerCase(),
        parsedUrl = urlModule.parse(req.url),
        path = parsedUrl.pathname;
    for (var i = 0; i < handlers.length; ++i) {
        var handler = handlers[i];
        if (method === handler.method) {
            var match = handler.regexp.exec(path);
            if (match) {
                return {
                    handler: handler,
                    output: {
                        params: kettle.router.http.matchToParams(handler, match)
                    }
                };
            }
        }
    }
};
