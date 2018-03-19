"use strict";

var fluid = require("infusion");
var service = fluid.registerNamespace("service");
var kettle = require("../kettle.js");

kettle.loadTestingSupport();

fluid.registerNamespace("service.tests.translation");
fluid.logObjectRenderChars = 10000;

service.tests.translation.testTranslate = [{
    name: "POST request for a valid word test",
    expect:2,
    config:{
        configName: "config",
        configPath: "%kettle/translationApp"
    },
    components:{
        translate:{
            type:"kettle.test.request.http",
            options:{
                path:"/translation/en-pl",
                method:"POST",
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                }
            }
        }
    },
    sequence:[{
        func:"{translate}.send",
        args:{
            model:{"text":"this is a test for translation"}
        }
        
    },
    {
        event:"{translate}.events.onComplete",
        listener:"kettle.test.assertJSONResponse",
        args:{
            message:"Test done",
            string:"{arguments}.0",
            request:"{translate}",
            expected:{
                "statusCode": 200,
                "responseMessage": "Translation en-pl",
                "translatedText": [
                    "jest to test do tłumaczenia"
                ]
            }
        }
    }]
}]

kettle.test.bootstrapServer(service.tests.translation.testTranslate);