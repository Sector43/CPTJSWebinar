///#source 1 1 /Scripts/utils/RestUtils.js
 (function () {
    "use strict"; 
     window.s43 = window.s43 || {};    //MDS Support: Type.registerNamespace("s43");
        

s43.restUtils = function () {
    "use strict";
    //#region private vars

    var _callCount = 0;

    //#endregion private vars

    //#region Private Functions
    function _getPromise(url, headers) {
        
        return _doCall(url, headers, "", "GET");
    }

    function _deletePromise(url, headers, eTag) {
        return _postPromiseInternal(url, headers, "", "DELETE", eTag);
    }

    function _postPromise(url, headers, body) {
        return _postPromiseInternal(url, headers, body);
    }

    function _postPromiseInternal(url, passedHeaders, body, action, eTag) {
        //local variable to store headers passed to actual AJAX call
        var localHeaders = {};

        //Serialize the body so it can be passed to the AJAX call and also so we can set the Content-Length header
        var bodyString = JSON.stringify(body);

        //Get each passed header into localHeaders
        if(passedHeaders){
            for (var key in passedHeaders) {
              if (passedHeaders.hasOwnProperty(key)) {
                localHeaders[key] = passedHeaders[key];
              }
            }
        }


        //Request Digest header
        localHeaders["X-RequestDigest"] = $("#__REQUESTDIGEST").val();

        //#region Content Length header (removed)
        /* Per the XMLHttpRequest spec (http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader-method),
            Content-Length must not be set in code.  Chrome will record an error if you try to.  IE will not.

        if (body) {
            localHeaders["Content-Length"] = bodyString.length;
        }
        else {
           localHeaders["Content-Length"] = 0;
        }

        */

        //Verb-tunneling for other verbs which may be blocked by firewalls
        if (action && action.length > 0) {
            localHeaders["X-HTTP-Method"] = action;

            //If-Match header, used passed value or default to *
            if (eTag && eTag.length > 0) {
                localHeaders["IF-MATCH"] = eTag;
            }
            else {
                localHeaders["IF-MATCH"] = "*";
            }
        }

        

        //#endregion

        
        //Make the call
        return _doCall(url, localHeaders, bodyString, "POST");
    }

    function _doCall(url, passedHeaders, bodyString, verb) {
        _callCount = ++_callCount;   //only for performance testing

        //Make sure we have an ACCEPT header, set it if not
        if (!passedHeaders){
            passedHeaders = {};
        }
        if( !passedHeaders.Accept || passedHeaders.Accept.length === 0) {
            passedHeaders["Accept"] = "application/json;odata=verbose";
        }

        var dfd = $.ajax({
            url: encodeURI(url),   //Make sure to encode the URI
            type: verb,
            contentType: "application/json;odata=verbose",
            data: bodyString,
            headers: passedHeaders
        });

        //Everything returns a Promise
        return dfd.promise();
    }

    //Utility function to return a fulfilled promise, used only for testing and prototyping
    function _returnResolvedPromise(data) {
        var dfd = $.Deferred();
        dfd.resolve(data);
        return dfd.promise();
    }

    function _getBodyStubToCreateListItem(listName) {
        if(typeof listName !=='undefined' && listName.length !== 0){
            return {"__metadata": { "type": "SP.Data." + listName + "ListItem" }};
        }
        return {};
    }

    function _emptyCallback(){}

    //#endregion Private Functions

    var publics = {
        Get                            : _getPromise,
        Post                           : _postPromise,
        Delete                         : _deletePromise,
        ReturnResolvedPromise          : _returnResolvedPromise,   
        GetCallCount                   : function () { return _callCount; },
        GetBodyStubToCreateListItem    : _getBodyStubToCreateListItem,
        EmptyCallback                  : _emptyCallback
    };

    return publics;

};

s43.rest = new s43.restUtils();
})();
///#source 1 1 /Scripts/utils/LogManager.js

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

///#source 1 1 /Scripts/viewTable.js
(function () {
    "use strict"

      window.s43 = window.s43 || {};    //MDS Support: Type.registerNamespace("s43"); 

    
    s43.viewTable = function ($, logger, rest, spContext, domHeaderTR, domRows, listName) {

        var targetViewColumnIdx = -1;
        var headerDivIdx = -1;
        var isValid = true;
        

        if (!validate()) {
            logger.Error("Invalid viewTable configuration - validation failed"); 
            isValid = false;
            showListView();
        }

         function validate(){
            try{
                if (typeof $ === "undefined") {
                    $=jQuery;
                }
                if (
                    typeof domHeaderTR === "undefined"
                    || typeof domRows === "undefined"
                    || typeof $ === "undefined"
                    || typeof domRows.length === "undefined"
                    || domHeaderTR[0].nodeName !== "TR"
                    || typeof rest ===" undefined"
                    || typeof spContext === "undefined"
                   )
                {
                    return false;
                }
                return true; 
            }
            catch(err){
                logger.Error(err);
            }
            return false;
        }

        
        //#region View Processing
        function updateViewForLockedValue(columnName, viewData, newColumnLocation) {
            //#region validate and dump out early if it fails
            if (
                !isValid
                || domRows.length < 1
                || domRows[0].cells.length === 0
                || typeof columnName === "undefined"
                || columnName.length === 0
                || typeof viewData === "undefined"
                || !($.isArray(viewData.Row))
                || isNaN(newColumnLocation)
                || newColumnLocation < 0
                || newColumnLocation > domRows[0].cells.length + 1
                || parseInt(newColumnLocation).toString() !== newColumnLocation.toString()
                )
            {
                showListView();
                return;
            }
            //#endregion
            try {
            
                if(removeTargetColumn(columnName)){
                   ProcessedLockedFromDomData(viewData, columnName, newColumnLocation);
                }
                else{
                    ProcessLockedFromServerData(viewData, columnName, listName, newColumnLocation);
                }
            }
            catch(err){
                logger.Error(err);
            }
            finally{
                showListView();
            }
        }

        function removeTargetColumn(columnName) {
            findTargetColumnIndex(columnName);

            if (targetViewColumnIdx === -1) {
                logger.Info("Column " + columnName + " not found in view.");
                return false;
            }

            var headerth = $(domHeaderTR).children()[targetViewColumnIdx];
            var targetDiv = $(headerth).children()[headerDivIdx];
            
            $(targetDiv).parent('th').remove(); 

            //remove cells from viewBody for target column 
            $(domRows).each(
                function(){
                    var bodyCell = $(this).children()[targetViewColumnIdx];
                    if(typeof bodyCell !== "undefined"){
                        if ($(bodyCell).hasClass("ms-vb-lastCell")){
                            $(bodyCell).prev().addClass("ms-vb-lastCell"); 
                        }

                        $(bodyCell).remove();  
                    }
                }
            );
            return true;
    
        }
        

        
  
        function showListView() {
            //don't use jQuery in case it is not available
            var nodes = document.getElementsByClassName("ms-listviewtable");
            if(nodes.length > 0){
                nodes[0].style.display = "table";
            }
        }

    
       
        function findTargetColumnIndex(columnName){
            $(domHeaderTR).children().each(                 
                function (index1) {
                    // 'this' is a cell within the header
                    var divs = $(this).children();
                    $(divs).each(
                        function (index2) {
                            if ($(divs[index2]).attr('name') === columnName) {
                                targetViewColumnIdx = index1; 
                                headerDivIdx = index2;
                                return false;
                            }
                        }
                    )
                }
            );
        }


        //#endregion View Processing

        //#region DOM functions

        function ProcessedLockedFromDomData(viewData, columnName, newColumnLocation){
             var lockedIDs = convertDomDataToLockedIDsArray(viewData, columnName);
             addLockedColumnToDom(columnName, lockedIDs, newColumnLocation);
        }

        function addLockedColumnToDom(columnName, lockedIDs, newColumnLocation){
            var columnAdded = false; 
            var newCellHtml = '';
            var cell = undefined;
            if(!($.isArray(lockedIDs)) || lockedIDs.length === 0){
                return;
            }


            $(domRows).each(
                function(index){
                    var itemId = (domRows[index].id).split(',')[1];  //SP HTML has a value of "0,itemID,0" as id attribute
                    if(typeof itemId !== "undefined" && !(isNaN(itemId))){
                        if ($.inArray(Number(itemId), lockedIDs) > -1) {
                            newCellHtml = "<td name='IconCell' class='ms-cellstyle'><img style='border: 0px' src='/_layouts/15/images/lockoverlay.png' /></td>";
                            columnAdded = true;                        
                        }
                        else{
                            newCellHtml = "<td name='EmptyIconCell' class='ms-cellstyle'>&nbsp;</td>";
                        }
                        cell = $(this).find('td').eq(newColumnLocation);
                        if(typeof cell !== "undefined"){
                            cell.before(newCellHtml);
                        }
                    }
                }
            );
            if (columnAdded) {
                cell = $(domHeaderTR).find('th').eq(newColumnLocation);
                if(typeof cell !== "undefined"){
                    cell.before("<th class='ms-headerCellStyleIcon ms-vh-icon' scope='col' ><div name='" + columnName + "Icon' </div></th>");
                }
                
               
            }

        }

        function convertDomDataToLockedIDsArray(viewData, columnName){
            var retVal = [];
            for (var i = 0; i < domRows.length; i++)
            {
                var oneRow = viewData.Row[i];

                if(typeof oneRow !== "undefined" && oneRow[columnName] === "Yes"){
                    var itemId = (domRows[i].id).split(',')[1];
                    if(typeof itemId !== "undefined" && !(isNaN(itemId))){
                        retVal.push(Number(itemId));
                    }
                }
            }
            return retVal;
        }


        //#endregion DOM functions

        //#region Server functions
        function ProcessLockedFromServerData(viewData, columnName, listName, newColumnLocation){
            var visibleItemIDs = GetViewItemIDsFromDom(viewData);
            
            var query = GetQueryForVisibleItems(visibleItemIDs, columnName);
            var body = {"query" : {
                                "__metadata":  { "type": "SP.CamlQuery" } , 
                                "ViewXml": 
                                "'"  + query + "'"
                            }
                        };

            var url = spContext.HttpRoot + "/_api/web/Lists/GetByTitle('" + listName + "')/GetItems?$select=Id";
           

            rest.Post(url, undefined, body).then(
                function(data){ProcessServerData(columnName, data, newColumnLocation);},
                logger.HandleRejectedPromise);
        }

        function ProcessServerData(columnName, data, newColumnLocation){
            if(typeof data !== "undefined" && typeof data.d !== "undefined" && typeof data.d.results !== "undefined"){
                var lockedIDs = convertResultsToLockedIDsArray(data.d.results);
                addLockedColumnToDom(columnName, lockedIDs, newColumnLocation);  
            }

        }


        function GetQueryForVisibleItems(visibleItemIDs, columnName){
            var queryStringBegin = "<View><Query><Where><And><In><FieldRef Name='ID' /><Values>";
            var queryStringEnd = "</Values></In><Eq><FieldRef Name='" + columnName + "' /><Value Type='Integer'>1</Value></Eq></And></Where></Query></View>";
            var queryStringMiddle = ""
            $(visibleItemIDs).each(function(){
                queryStringMiddle += "<Value Type='Integer'>" + this.toString() + "</Value>";
            });

            return queryStringBegin + queryStringMiddle + queryStringEnd;
        }

        function GetViewItemIDsFromDom(viewData){
            var retVal = [];
            for (var i = 0; i < viewData.Row.length; i++)
            {
                retVal.push(viewData.Row[i].ID);
            }
            return retVal;
        }

        function convertResultsToLockedIDsArray(results){
            var retVal = [];
            for (var i = 0; i < results.length; i++)
            {
                retVal.push(Number(results[i].ID));
            }
            return retVal;

            
        }


        //#endregion Server functions
        
       
        var publics = {
            "updateViewForLockedValue"     : updateViewForLockedValue
        }

        return publics;
    }

})();

///#source 1 1 /Scripts/App.js
(function () { 
    "use strict"; 

    window.s43 = window.s43 || {}; //MDS Support: Type.registerNamespace("s43"); 
    s43.customizeView = function () {
        if(typeof window.jQuery !== "undefined"){
        
            try{ 
                if(typeof ctx !== "undefined" && typeof ctx.ListTitle !== "undefined" && ctx.ListTitle.toLowerCase() === "demolist"){
                    var domHeaderTR = jQuery("tr.ms-viewheadertr");
                    var domRows = jQuery("table.ms-listviewtable tbody").children(); 
   
                    if(typeof s43 !== "undefined" && typeof s43.viewTable === "function"){
                        var vt = new s43.viewTable(jQuery, s43.Logger, s43.rest, ctx, domHeaderTR, domRows, 'DemoList');
                        var colName = "IsLocked";
                        var newColumnIndex = 3;
                        vt.updateViewForLockedValue(colName, ctx.ListData, newColumnIndex);
                    }
                }
            }
            catch(err){
                s43.Logger.Error(err);
            }
        
        }
    }

    _spBodyOnLoadFunctionNames.push('s43.customizeView');
    
})();


