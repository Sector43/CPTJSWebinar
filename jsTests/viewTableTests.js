describe("viewTable", function () {
    var vt = undefined;
    var domRows = undefined; 
    var domHeaderTR = undefined;
    var originalHTML = undefined;
    var viewData = undefined;
    var newColumnLocation = 3;
    var colName = "IsLocked"; 
    

    //#region Setup
    beforeAll(function() {
        jasmine.getFixtures().fixturesPath = '../../../base/jsTests/Fixtures/';
        jasmine.getStyleFixtures().fixturesPath = '../../../base/jsTests/Fixtures/';
        jasmine.getJSONFixtures().fixturesPath = '../../../base/jsTests/Fixtures/';

        jasmine.getFixtures().preload('ViewTableFixture.html');

        
    });


    beforeEach(function () {
        s43.Logger.SetMode(s43.Logger.Modes().Off);
        loadFixtures('ViewTableFixture.html'); 
        originalHTML = $('#jasmine-fixtures').html(); 
        loadStyleFixtures("ViewTableStyleFixture.css");
        viewData = getJSONFixture("ViewTableDataFixture.json");
       
        domHeaderTR = $("tr.ms-viewheadertr");
        domRows = $("table.ms-listviewtable tbody").children();
        
        colName = "IsLocked";
        newColumnLocation = 3;

        vt = new s43.viewTable(jQuery, s43.Logger, s43.rest, {}, domHeaderTR, domRows, 'DemoList');
    });

    afterEach(function () {
        vt = undefined;
        domRows = undefined;
        domHeaderTR = undefined;
        originalHTML = undefined;
        viewData = undefined;
    });
    //#endregion Setup

    //#region Tests
    it("should be hidden on initial load", function(){
        expect($('.ms-listviewtable')).toBeHidden();
    });

        
    it("should hide target column if found", function () { 
        
        vt.updateViewForLockedValue(colName, viewData, newColumnLocation);

        expect($('div[name="' + colName + '"]')).not.toBeInDOM();
    });

    it("adds icon column as new column if view has locked items", function () { 
        
        vt.updateViewForLockedValue(colName, viewData, newColumnLocation);
       
        expect($('div[name="' + colName + 'Icon"]')).toBeInDOM();
        expect($('td[name="IconCell"]')).toBeInDOM();
    });

    it("adds icon column in proper location", function () { 
        
        vt.updateViewForLockedValue(colName, viewData, newColumnLocation);
       
        var cell = domRows[0].cells[newColumnLocation];
        if(viewData.Row[0][colName] === "Yes"){
            expect($(cell)).toHaveAttr('name', 'IconCell');
        }
        else{
            expect($(cell)).toHaveAttr('name', 'EmptyIconCell');
        }

    });

    it("doesn't add icon column as new column if view doesn't have locked items", function () { 
        viewData = getJSONFixture("ViewTableDataFixtureNoLockedItems.json");
        
        vt.updateViewForLockedValue(colName, viewData, newColumnLocation);
        expect($('div[name="' + colName + 'Icon"]')).not.toBeInDOM();
        expect($('td[name="IconCell"]')).not.toBeInDOM();
    });

   

    it("keeps original HTML if newColumnLocation paramater is invalid, NaN, or higher than view column count ", function () {
        vt.updateViewForLockedValue(colName, viewData, "x");

        var endingHTML = $('#jasmine-fixtures').html();
        expect(endingHTML).toBe(originalHTML.replace("display: none;", "display: table;"));
    });

    it("keeps original HTML if no items in View", function () {
        loadFixtures('ViewTableFixtureNoItems.html');
        originalHTML = $('#jasmine-fixtures').html();
        domHeaderTR = $("tr.ms-ms-viewheadertr");
        domRows = $("table.ms-listviewtable tbody").children();
        viewData = getJSONFixture("ViewTableDataFixtureNoItems.json");
        
        vt = new s43.viewTable(jQuery, s43.Logger, s43.rest, {}, domHeaderTR, domRows, 'DemoList');


        
        vt.updateViewForLockedValue(colName, viewData, newColumnLocation);

        var endingHTML = $('#jasmine-fixtures').html();
        expect(endingHTML).toBe(originalHTML);
    });

    it("keeps original HTML if undefined column name supplied", function () {
        vt.updateViewForLockedValue(undefined, viewData, newColumnLocation);
        var endingHTML = $('#jasmine-fixtures').html();
        expect(endingHTML).toBe(originalHTML.replace("display: none;", "display: table;"));
    });
    it("shows if undefined column name supplied", function(){ 
        vt = new s43.viewTable(jQuery, s43.Logger, s43.rest, {}, domHeaderTR, domRows, 'DemoList');
        vt.updateViewForLockedValue(undefined, viewData, newColumnLocation);  //forces error
        expect($('.ms-listviewtable')).toBeVisible();
    });

    it("shows if invalid viewData supplied", function(){ 
        
        vt.updateViewForLockedValue(colName, "", newColumnLocation);
        expect($('.ms-listviewtable')).toBeVisible();
    });

    it("keeps original HTML if error is thrown", function(){ 
             
        vt = new s43.viewTable(jQuery, s43.Logger, s43.rest, {}, undefined, undefined, 'DemoList');  //forces error
        var endingHTML = $('#jasmine-fixtures').html();
        
        expect(endingHTML).toBe(originalHTML.replace("display: none;", "display: table;"));
    });

    it("shows if error is thrown", function(){ 
        vt = new s43.viewTable(jQuery, s43.Logger, s43.rest, {}, domHeaderTR, domRows, 'DemoList');
        vt.updateViewForLockedValue();  //forces error
        expect($('.ms-listviewtable')).toBeVisible();
    });

    it("logs errors to the console", function(){
        //monkey-patch for capturing console messages in test
        var oldConsole = window.console;
        var lastMessage = "";
        window.console.log = function(msg){
            lastMessage = msg;
            
        };
        window.console.error = function(msg){
            lastMessage = msg;
            
        };
       
        s43.Logger.SetMode(s43.Logger.Modes().Debug);
        vt = new s43.viewTable(jQuery, s43.Logger, s43.rest, {}, undefined, undefined, 'DemoList');   //forces error
        expect(lastMessage.indexOf("Invalid viewTable configuration")).toBeGreaterThan(-1);
         window.console = oldConsole;
    });

    //#region REST tests

    it("calls server if DOM doesn't contain target column", function () {
        
            
        loadFixtures('ViewTableFixtureNoLockedColumn.html');
        var fakeResponseData = getJSONFixture("ServerResponse.json")
        viewData = getJSONFixture("ViewTableDataFixtureNoLockedColumn.json");
        var restMock = new s43.restMock();
        restMock.SetResponseData(fakeResponseData);
        domHeaderTR = $("tr.ms-viewheadertr");
        domRows = $("table.ms-listviewtable tbody").children();
        var mockContext = {"HttpRoot" : ""};
        vt = new s43.viewTable(jQuery, s43.Logger, restMock, mockContext, domHeaderTR, domRows, 'DemoList');   
        vt.updateViewForLockedValue(colName, viewData, newColumnLocation);
            
        expect(restMock.GetCallCount()).toBe(1);
        
        

    });

    it("adds icon column if server returns locked items", function () {
        
        loadFixtures('ViewTableFixtureNoLockedColumn.html');
        var fakeResponseData = getJSONFixture("ServerResponse.json")
        viewData = getJSONFixture("ViewTableDataFixtureNoLockedColumn.json");
        var restMock = new s43.restMock();
        restMock.SetResponseData(fakeResponseData);
        domHeaderTR = $("tr.ms-viewheadertr");
        domRows = $("table.ms-listviewtable tbody").children();
        var mockContext = {"HttpRoot" : ""};
        vt = new s43.viewTable(jQuery, s43.Logger, restMock, mockContext, domHeaderTR, domRows, 'DemoList');   
        vt.updateViewForLockedValue(colName, viewData, newColumnLocation);
            
        expect($('div[name="' + colName + 'Icon"]')).toBeInDOM();
        expect($("td[name='IconCell']")).toBeInDOM();
        
    });

    it("doesn't add icon column if server returns no locked items", function () {
        
        loadFixtures('ViewTableFixtureNoLockedColumn.html');
        var fakeResponseData = getJSONFixture("ServerResponseNoLockedItems.json")
        viewData = getJSONFixture("ViewTableDataFixtureNoLockedColumn.json");
        var restMock = new s43.restMock();
        restMock.SetResponseData(fakeResponseData);
        domHeaderTR = $("tr.ms-viewheadertr");
        domRows = $("table.ms-listviewtable tbody").children();
        var mockContext = {"HttpRoot" : ""};
        vt = new s43.viewTable(jQuery, s43.Logger, restMock, mockContext, domHeaderTR, domRows, 'DemoList');   
        vt.updateViewForLockedValue(colName, viewData, newColumnLocation);
            
        expect($('div[name="' + colName + 'Icon"]')).not.toBeInDOM();
        expect($("td[name='IconCell']")).not.toBeInDOM();
        
    });

    //#endregion REST Tests

    //#endregion Tests


});