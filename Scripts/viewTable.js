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
