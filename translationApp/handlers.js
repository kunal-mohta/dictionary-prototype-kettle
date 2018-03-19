"use strict";
var fluid = require('infusion');
var service = fluid.registerNamespace("service");
require("../kettle.js");

fluid.defaults("service.translation.translate", {
    gradeNames: "kettle.request.http",
    invokers:{
        handleRequest: "service.translation.handleTranslate"
    }
});

service.translation.handleTranslate = function(request){
    var makingRequest = require('request');//request npm package used to make requests to the online APIs
    
    var fromLang = request.req.params.from, toLang = request.req.params.to;
    var translateText = request.req.body.text;
    var apiKey = 'trnsl.1.1.20180317T094258Z.ad4fd157a0024e3a.0ef6fb779d50af9aa52593dc77a350e7d1e1e12a';

    makingRequest({url:'https://translate.yandex.net/api/v1.5/tr.json/translate?key='+apiKey+'&lang='+fromLang+'-'+toLang+'&text='+encodeURI(translateText), headers:{'content-type':'application/json; charset=utf-8'}}, function(err, res, body){
        var responseBody = JSON.parse(body);
        try{
            //error from the third-party service providers
            if(err){
                request.res.send({
                    statusCode: 500,
                    responseMessage: "Some error occured, please try contacting the service provider.",
                    translatedText: ((responseBody.text)?(responseBody.text):([])),
                });
            }
            else if(res.statusCode == 200){    
                request.res.send({
                    statusCode: 200,
                    responseMessage: "Translation "+responseBody.lang,
                    translatedText: responseBody.text
                });
            }
            else{
                request.res.send({
                    statusCode: responseBody.code,
                    responseMessage: responseBody.message,
                    translatedText: ((responseBody.text)?(responseBody.text):([]))
                })
            }
        }
        catch(e){
            //catch errors in the backend code of the service
            console.log(e);
            request.res.send({
                statusCode: 500,
                responseMessage: "Some error occured, please try contacting the service provider.",
                translatedText: ((responseBody.text)?(responseBody.text):([]))
            });
        }
    }); 
}