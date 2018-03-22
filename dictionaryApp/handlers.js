"use strict";
var fluid = require('infusion');
var service = fluid.registerNamespace("service");
require("../kettle.js");

var makingRequest = require('request');//request npm package used to make requests to the online APIs

//get defintion + examples
fluid.defaults("service.dictionary.getDef", {
    gradeNames: "kettle.request.http",
    invokers:{
        handleRequest: "service.dictionary.handleGetDef"
    }
});

service.dictionary.handleGetDef = function(request){    
    var word = request.req.params.word;//the API already supports uppercase letters so no need to convert to lowercase
    
    makingRequest({url:'https://od-api.oxforddictionaries.com:443/api/v1/entries/en/'+word, headers:{'app_id':'bbbf37f3','app_key':'a6c826c2d4f3f3b422979c0506a1f1b8'}}, function(err, res, body){
        try{
            //error from the third-party service providers
            if(err){
                request.res.send({
                    statusCode: 500,
                    responseMessage: "Some error occured, please try contacting the service provider.",
                    jsonDefinitions: [],
                });
            }
            //word not found 
            else if(res.statusCode == 404){
                request.res.send({
                    statusCode: 404,
                    responseMessage: "Unknown word",
                    jsonDefinitions: [],
                });
            }
            //word found
            else{
                var scrapedDef = JSON.parse(body).results[0].lexicalEntries[0].entries[0].senses;
                var defArray = [];
                var i;
                for(i=0;i<scrapedDef.length;i++){
                    defArray[i] = {
                        definitions: scrapedDef[i].definitions,
                        examples: []
                    }
                    
                    if(scrapedDef[i].examples){
                        var j;
                        for(j=0;j<scrapedDef[i].examples.length;j++) defArray[i].examples[j] = scrapedDef[i].examples[j].text;
                    }
                }
    
                request.res.send({
                    statusCode: 200,
                    responseMessage: "Word Found",
                    jsonDefinitions: defArray
                });
            }
        }
        catch(e){
            //catch errors in the backend code of the service
            console.log(e);
            request.res.send({
                statusCode: 500,
                responseMessage: "Some error occured, please try contacting the service provider.",
                jsonDefinitions: []
            });
        }
    }); 
}

//get examples
fluid.defaults("service.dictionary.getEx", {
    gradeNames: "kettle.request.http",
    invokers:{
        handleRequest: "service.dictionary.handleGetEx"
    }
});

service.dictionary.handleGetEx = function(request){    
    var word = request.req.params.word;//the API already supports uppercase letters so no need to convert to lowercase
    
    makingRequest({url:'https://od-api.oxforddictionaries.com:443/api/v1/entries/en/'+word, headers:{'app_id':'bbbf37f3','app_key':'a6c826c2d4f3f3b422979c0506a1f1b8'}}, function(err, res, body){
        try{
            //error from the third-party service providers
            if(err){
                request.res.send({
                    statusCode: 500,
                    responseMessage: "Some error occured, please try contacting the service provider.",
                    jsonExamples: [],
                });
            }
            //word not found 
            else if(res.statusCode == 404){
                request.res.send({
                    statusCode: 404,
                    responseMessage: "Unknown word",
                    jsonExamples: [],
                });
            }
            //word found
            else{
                var scrapedDef = JSON.parse(body).results[0].lexicalEntries[0].entries[0].senses;
                var exArray = [];
                var i;
                for(i=0;i<scrapedDef.length;i++){                    
                    if(scrapedDef[i].examples){
                        var j;
                        for(j=0;j<scrapedDef[i].examples.length;j++) {
                            exArray[exArray.length] = scrapedDef[i].examples[j].text;
                        }
                    }
                }
    
                request.res.send({
                    statusCode: 200,
                    responseMessage: "Word Found",
                    jsonExamples: exArray
                });
            }
        }
        catch(e){
            //catch errors in the backend code of the service
            console.log(e);
            request.res.send({
                statusCode: 500,
                responseMessage: "Some error occured, please try contacting the service provider.",
                jsonExamples: []
            });
        }
    }); 
}