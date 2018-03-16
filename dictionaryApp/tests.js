"use strict";

var fluid = require("infusion");
var service = fluid.registerNamespace("service");
var kettle = require("../kettle.js");

kettle.loadTestingSupport();

fluid.registerNamespace("service.tests.dictionary");
fluid.logObjectRenderChars = 10000;

service.tests.dictionary.testDefs = [{
    name: "GET request for a valid word test",
    expect:2,
    config:{
        configName: "config",
        configPath: "%kettle/dictionaryApp"
    },
    components:{
        getDef:{
            type:"kettle.test.request.http",
            options:{
                path:"/definition/test",//the word "test" is sent as parameter for getting defintion for the purpose of testing
                method:"GET"
            }
        }
    },
    sequence:[{
        func:"{getDef}.send"
    },
    {
        event:"{getDef}.events.onComplete",
        listener:"kettle.test.assertJSONResponse",
        args:{
            message:"Test done",
            string:"{arguments}.0",
            request:"{getDef}",
            expected:{
                "statusCode": 200,
                "responseMessage": "Word Found",
                "jsonDefinitions": [
                    {
                        "definitions": [
                            "a procedure intended to establish the quality, performance, or reliability of something, especially before it is taken into widespread use"
                        ],
                        "examples": [
                            "four fax modems are on test",
                            "both countries carried out nuclear tests in May"
                        ]
                    },
                    {
                        "examples": [
                            "the first Test against New Zealand"
                        ]
                    },
                    {
                        "definitions": [
                            "a movable hearth in a reverberating furnace, used for separating gold or silver from lead."
                        ],
                        "examples": []
                    }
                ]
            }
        }
    }]
},
{
    name: "GET request for an invalid word test",
    expect:2,
    config:{
        configName: "config",
        configPath: "%kettle/dictionaryApp"
    },
    components:{
        notGetDef:{
            type:"kettle.test.request.http",
            options:{
                path:"/definition/notfoundtext",//the word "notfoundtext" is used as an invalid word
                method:"GET"
            }
        }
    },
    sequence:[{
        func:"{notGetDef}.send"
    },
    {
        event:"{notGetDef}.events.onComplete",
        listener:"kettle.test.assertJSONResponse",
        args:{
            message:"Test done",
            string:"{arguments}.0",
            request:"{notGetDef}",
            expected:{
                "statusCode": 404,
                "responseMessage": "Unknown word",
                "jsonDefinitions": []
            }
        }
    }]
}];

kettle.test.bootstrapServer(service.tests.dictionary.testDefs);