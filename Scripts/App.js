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

