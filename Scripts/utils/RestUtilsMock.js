Type.registerNamespace("s43");   //necessary if we want to support MDS!


s43.restMock = function () {
    "use strict";
    //#region private vars

    var _callCount = 0;
    var responseData;

    //#endregion private vars

    //#region Private Functions


    //Utility function to return a fulfilled promise, used only for testing and prototyping
    function _returnResolvedPromise() {
        _callCount = ++_callCount;
        var dfd = $.Deferred();
        
        dfd.resolve(responseData);
        return dfd.promise();
    }

    function _getBodyStubToCreateListItem(listName) {
        if(typeof listName !=='undefined' && listName.length !== 0){
            return {"__metadata": { "type": "SP.Data." + listName + "ListItem" }};
        }
        return {};
    }

    function _emptyCallback() { }

    function setResponseData(data){
        responseData = data;
    }

    

    //#endregion Private Functions

    var publics = {
        Get                            : _returnResolvedPromise,
        Post                           : _returnResolvedPromise,
        Delete                         : _returnResolvedPromise,
        ReturnResolvedPromise          : _returnResolvedPromise,   
        GetCallCount                   : function () { return _callCount; },
        GetBodyStubToCreateListItem    : _getBodyStubToCreateListItem,
        EmptyCallback                  : _emptyCallback,
        SetResponseData                : setResponseData
    };

    return publics;

};


