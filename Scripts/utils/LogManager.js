//
﻿//       (c) 2015, David Mann / Sector 43 - www.sector43.com
﻿//       Released under the MIT license.  See license file for details
﻿//
﻿
(function () {
    "use strict"; 
     window.s43 = window.s43 || {}; //MDS Support: Type.registerNamespace("s43");
        

     s43.LogManager = function () {
          
        
        var inDebug = false;
        var bufferStore = [];

         //JS Enum implementation adapted from Rob Hardy: http://stackoverflow.com/a/17280078/1816009
        var modes = null;
        (function (modes) {
            modes[modes["Debug"] = 0] = "Debug";
            modes[modes["Production"] = 1] = "Production";
            modes[modes["Off"] = 2] = "Off";
        })(modes || (modes = {}));

       
        var currentMode = modes.Production;
        var bufferMax = 100; 
        
        

        //#region Private Functions

        function log(message) {
            if(currentMode === modes.Off){
                return;
            }
            if (window.console) {
                window.console.log(message);
            }
        }

        function info(message){
            if(currentMode === modes.Off){
                return;
            }
            if (window.console && window.console.info) {
                console.info(message);
            }
            else{
                log(message);
            }

        }

        function warn(message){ 
            if(currentMode === modes.Off){
                return;
            }
            if (window.console && window.console.warn) {
                console.warn(message);
            }
            else{
                log(message);
            }

        }

        function error(err) {
            if(currentMode === modes.Off){
                return;
            }
            var message = "No message supplied";
            if (typeof err === 'undefined') {
                err = new Error("Attempted to log error to console but Error object is undefined");
            }
            if (typeof err === 'string') {
                err = new Error(err);
            }
            if(typeof err.message !== 'undefined'){
                message = err.message;
            }
            if (window.console && window.console.error) {
                    window.console.error("Message: " + message); 
                    var stack = "(UNKNOWN)";
                    if(typeof err.stacktrace !== 'undefined'){
                        stack = err.stacktrace;
                    }
                    else if(typeof err.stack !== 'undefined'){
                        stack = err.stack;
                    }

                    window.console.error("Stack Trace= " + stack);
            }
            else{
                log(message); 
            }
        }

        function handleRejectedPromise(jqXHR, status, error) {
            var lastError = JSON.parse(jqXHR.responseText).error;
            info("We're in the failure callback, but the browser doesn't consider this an 'error'.  We can handle it however we wish");
            info("Error message: " + lastError.message.value);
            info("Stack Trace: " + lastError.stacktrace);
        }

        function trace(funcName){
            if(currentMode === modes.Off){
                return;
            }
            //can't use arguments.callee.caller because it's not allowed in strict mode, so must pass in function name.
            if (funcName && funcName.length > 0) {
                var msg = "Trace: " + funcName;
                if(window.console && window.console.trace){
                    console.trace(msg);
                }
                else {
                    log(msg);
                }
            }


        }

        function setMode(mode){
            switch (mode)
            {
        	    case modes.Debug:
        	        inDebug = true;
                    currentMode = modes.Debug;
        		    break;
                case modes.Off:
                    inDebug = false;
                    currentMode = modes.Off;
                    break;
                default:
                    inDebug = false;
                    currentMode = modes.Production;
                    break;
            }
        }

        function assert(test, message){
            if(currentMode === modes.Off){
                return;
            }
            if (window.console && window.console.assert) {
                console.assert(test, message);
            }

        }

        function debugLog(message){
            if(currentMode === modes.Off){
                return;
            }
            if (currentMode === modes.Debug) {
                log(message);
            }

        }

        function buffer(message){
            if(currentMode === modes.Off){
                return;
            }
            if (bufferStore.indexOf(message) === -1) {
                bufferStore.push(message);
                if (bufferStore.length >= bufferMax) {
                    var tempBuffer = bufferStore;
                    bufferStore = [];
                    setTimeout(function () { flushBuffer(tempBuffer); }, 0);
                }
            }

        }



        function flushBuffer(tempBuffer) {
            if(typeof tempBuffer === 'undefined' || tempBuffer.length === 0){
                tempBuffer = bufferStore;
                bufferStore = [];
            }

        
            var url = "/api/web/lists/getbytitle('Log')/items";

            var body = s43.rest.GetBodyStubToCreateListItem('Log');
            body["Title"] = document.location.href;
            body["Messages"] = tempBuffer.join(";#");
            s43.rest.Post(url, undefined, body).then(s43.rest.EmptyCallback, handleRejectedPromise);
        }

        function init(){  
            window.onerror = function (errorMsg, url, lineNumber) {
                s43.Logger.Error(new Error('An error occurred and was not caught: ' + errorMsg
                    + '.  Script file: ' + url + ' Line: ' + lineNumber)); 
                return true;
            };
                
            
          

        }

        function getModes(){
            return modes;
        }


        //#endregion Private Functions

        var publics = {
            Info                  : info,
            Warn                  : warn,
            Error                 : error,
            HandleRejectedPromise : handleRejectedPromise,
            Trace                 : trace,
            SetMode               : setMode,
            Assert                : assert,
            DebugLog              : debugLog,
            Buffer                : buffer,
            FlushBuffer           : flushBuffer,
            Init                  : init,
            Modes                 : getModes,
            BufferMax             : bufferMax
        };

        log("Log Manager instance initialized and ready for use");
        return publics;

     };

     s43.Logger = new s43.LogManager();
     s43.Logger.Init();
})();
