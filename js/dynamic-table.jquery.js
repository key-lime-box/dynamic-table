/**=======================================================================================
 * RESOURCE: table.jquery.js
 * 
 * This is a plugin written to extend a datagrid to be able to be sorted, filtered
 * automatic scrolling etc.
 *======================================================================================*/
(function($) {

   var defaultCellStyle = "ui-dynamic-table-page-cell";
   
   /**====================================================================================
    * ATTRIBUTE: methods
    * 
    * Container for the methods.
    *===================================================================================*/
   var methods = {
      
      /**=================================================================================
       * OPERATION: init
       * 
       * The initialization method which creates a new instance of the object.
       *================================================================================*/
      init: function(aOptions) {
      
         //Set default values
         var myOptions        = $.extend({
                                    fillParent  : true,
                                    rowHeight   : 35,
                                    pageSize    : 50,
                                    pageBuffer  : 1,
                                    showCounter : false,
                                    showCheck   : false
                              }, aOptions);
   
         //Set up each object 
         return this.each(function() {
            
            var myContainer            = $(this);
            
            //Set a class
            myContainer.addClass       ("ui-dynamic-table");
            
            //Save the options
            myContainer.data("dynamicTable", {options: myOptions});
            
            //Make it so the container scrolls.
            myContainer.css("overflow", "hidden");
            //myContainer.css("position", "absolute");

            //Add a container for rows.
            var myRowContainer         = $("<div/>");
            myRowContainer.addClass    ("ui-dynamic-table-private-row-container");
            myRowContainer.css         ("position", "absolute");
            myRowContainer.css         ("overflow", "auto");
            myRowContainer.css         ("margin-top", myOptions.rowHeight);
            myRowContainer.css         ("height", $(this).parent().innerHeight() - myOptions.rowHeight);
            myRowContainer.css         ("width", $(this).parent().innerWidth());
            
            $(this).append(myRowContainer);
            
            //Add a scroll event listener so we can render only the items that 
            //are currently visible. This function only flags for an update.
            myRowContainer.bind("scroll.dynamicTable", {component: myContainer}, methods.private_handleScroll);
            
            //At an interval of 500ms pick up any scroll events and check if we now
            //need to render anything.
            setInterval(function(){methods.private_handleScrollInterval(myContainer, myOptions);}, 250);
            
            //Add resize listener.
            //$(window).on("resize.dynamicTable", {component: myContainer}, methods.private_handleResize);
            
            methods.private_initResizeListener(myContainer);
            
            //Listen to any clicks to close open windows
            $(window).on("click.dynamicTable", {component: myContainer}, methods.private_hideFilter);

            //Listen to all keyboard events.
            $(window).on("keydown.dynamicTable", {component: myContainer}, methods.private_handleKey);

            //Listen to clicks on cells to activate editors if present
            myContainer.on("click.dynamicTable", "div.ui-dynamic-table-page-cell", {component: myContainer}, methods.private_handleCellClick);

            //Listen to double clicks on cells to dispatch any outside listener to this.
            myContainer.on("dblclick.dynamicTable", "div.ui-dynamic-table-page-cell", {component: myContainer}, methods.private_handleCellDoubleClick);

            //Listen to any row checks
            myContainer.on("change.dynamicTable", "input.ui-dynamic-table-row-check", {component: myContainer}, methods.private_handleRowCheck);
         });      
      },
      
      /**=================================================================================
       * OPERATION: private_initResizeListener
       * 
       * As resize events are not quite that easy to handle, the following function 
       * handles most of the initialization needed
       *================================================================================*/           
      private_initResizeListener : function (aContainer) {

         var myCounter              = 0;
         
         function checkAddedToDom () {
            // Check if we are part of the DOM
            if ($.contains(document, aContainer[0])) {

               // Then listen for resize events on the parent. This is using the MutationObserver
               // which is the MDN recommended way of doing this.
               var myParent      = aContainer.parent(); 
               var myParentRect  = {
                     width    : myParent.innerWidth(),
                     height   : myParent.innerHeight()
               }
               
               var myObserver = new MutationObserver(function(aMutations) {
                  
                  if (myParentRect.width != myParent.innerWidth() || myParentRect.height != myParent.innerHeight()) {
                     myParentRect  = {
                           width    : myParent.innerWidth(),
                           height   : myParent.innerHeight()
                     }
                     
                     methods.private_handleResize({
                        data : {component : aContainer}
                     });
                  }
               });
               
               myObserver.observe(myParent[0], {
                  attributes : true
               });
               
               // First Resize this so we fit
               methods.private_handleResize({
                  data : {component : aContainer}
               });
            }
            // Recheck max 10 times. Generally the item is part of the DOM at the end of
            // code execution so only one time is needed.
            else if (myCounter < 10) {
               setTimeout (checkAddedToDom, 0);
               myCounter++;
            }
         }
         
         checkAddedToDom();
      },
      
      /**=================================================================================
       * OPERATION: private_handleResize
       * 
       * Called when the component gets resized
       *================================================================================*/       
      private_handleResize: function(aEvent) {
       
         console.log("resizing dynamic grid");
         
         //Get the component that is affected.
         var myComponent            = aEvent.data.component;
         
         //Get the options
         var myOptions              = myComponent.data("dynamicTable").options;
         
         var myInnerHeight          = myComponent.height();
         var myInnerWidth           = myComponent.width();
         
         //If fill parent is specified, fill it now.
         if (myOptions.fillParent)
         {
            myInnerHeight           = myComponent.parent().innerHeight() - (myComponent.offset().top - myComponent.parent().offset().top);
            myInnerWidth            = myComponent.parent().innerWidth();
         
            myComponent.css("height", myInnerHeight);
            myComponent.css("width",  myInnerWidth);
         }
         
         //console.log({width: myInnerWidth, height: myInnerHeight});
         
         var myRowContainer      = myComponent.children(".ui-dynamic-table-private-row-container").first();
         myRowContainer.css("height", myInnerHeight - myOptions.rowHeight);
         myRowContainer.css("width", myInnerWidth);
         
         var myResizeIndicator   = myComponent.children(".ui-dynamic-table-resize-indicator").first();
         myResizeIndicator.css("height", myInnerHeight);         
         
         //Make the header the same width as the table 
         myComponent.children(".ui-dynamic-table-header").css("width", myComponent.width());
      },

      /**=================================================================================
       * OPERATION: private_handleScroll
       * 
       * Called when the datagrid content gets scrolled.
       *================================================================================*/        
      private_handleScroll: function(aEvent) {
         
         //Get the component that is affected.
         var myComponent      = aEvent.data.component;
         
         //Get the options
         var myOptions        = myComponent.data("dynamicTable").options;
         
         //Mark the items as needing a refresh
         //This gets picked up at intervals by "private_handleScrollTimeout".
         myOptions.refreshVisible   = true;
         myOptions.lastScrollTime   = (new Date()).getTime();
         
         //Get the header and the container so that they can be scrolled in parallel. 
         var myHeader               = myComponent.children(".ui-dynamic-table-header").first();
         var myContainer            = myComponent.children(".ui-dynamic-table-private-row-container").first();
         
         //Scroll the header to the same position as the container.
         myHeader.scrollLeft(myContainer.scrollLeft());
      },

      /**=================================================================================
       * OPERATION: private_handleScrollTimeout
       * 
       * This function picks up at scheduled intervals the need for generating new 
       * visible pages/rows.
       *================================================================================*/        
      private_handleScrollInterval : function (aComponent, aOptions)
      {
         var myTime                 = (new Date()).getTime();
      
         //Only if the options were flagged to refresh.
         if (aOptions.refreshVisible && myTime - aOptions.lastScrollTime > 10)
         {
            console.log("refresh");
            
            //Reset the flag
            aOptions.refreshVisible = false;
            
            //Render the items that have now become visible.
            methods.private_renderVisible (aComponent);      
         }
      },
      
      /**=================================================================================
       * OPERATION: private_renderHeader
       * 
       * Renders the header so that it is fixed and not scrolling.
       *================================================================================*/         
      private_renderHeader : function(aContainer, aColumns, aRowHeight) {
         
         //Remove the existing header table.
         aContainer.children(".ui-dynamic-table-header").remove();

         var myOptions                 = aContainer.data("dynamicTable").options;
         
         //Add a container div.
         var myHeaderContainer         = $("<div/>");
         myHeaderContainer.addClass    ("ui-dynamic-table-header");
         myHeaderContainer.css         ("width",      aContainer.width());
         myHeaderContainer.css         ("height",     aRowHeight);
         myHeaderContainer.css         ("overflow",   "hidden");
         myHeaderContainer.css         ("position",   "absolute");
         
         //Add the actual table into the container
         var myTable                   = $("<table/>");
         myTable.css                   ("height",     aRowHeight);
         
         //Add one row.
         var myRow                     = myTable.append("<tr/>");
         
         if (myOptions.showCounter)
         {
            var myWidth          = (myOptions.showCheck ? 60 : 40);
         
            myRow.append(
                  "<td>" +
                  "   <div" +
                  "      id=\"ui-dynamic-table-header-cell-" + i + "\" " +
                  "      class=\"ui-dynamic-table-header-cell counter-header\" " +
                  "      style=\"height:" + (aRowHeight) + "px;width:" + (myWidth + 1) + "px; line-height:" + (aRowHeight) + "px\"" +
                  "   >&nbsp;</div>" + 
                  "</td>"                  
            );
         }
         
         //For each column...
         for (var i = 0; i < aColumns.length; i++)
         {
            //If the column is visible.
            if (aColumns[i].visible)
            {
               var myWidth             = aColumns[i].width;
               
               //If this is the last column add 17 pixels to make up for the fact that
               //we don't have a vertical scroll bar, but the main row container does.
               if (i == aColumns.length - 1)
               {
                   myWidth            += 17;
               }
               
               //Add the cell.
               var myCell = $(
                     "<td>" +
                     "   <div" +
                     "      id=\"ui-dynamic-table-header-cell-" + i + "\" " +
                     "      class=\"ui-dynamic-table-header-cell\" " +
                     "      style=\"height:" + (aRowHeight) + "px;width:" + (myWidth - 1)+ "px;line-height:" + (aRowHeight) + "px;\"" +
                     "   > " + 
                     "      <div class=\"ui-dynamic-table-header-cell-resize\"></div>" +
                     "      <div " + 
                     "         class=\"ui-dynamic-table-header-cell-function\" " +
                     "      >" +
                     "         <div class=\"ui-dynamic-table-header-cell-filter\"></div>" +
                     "         <div class=\"ui-dynamic-table-header-cell-sort\"></div>" +
                     "      </div> " + aColumns[i].name +
                     "    </div>" + 
                     "</td>"
               );   
               
               //Get the sort button
               var mySort                 = myCell.find(".ui-dynamic-table-header-cell-sort");
               
               //TODO: Unbind???
               //Handle the functionality of the sort button
               mySort.on(
                     "click.dynamicTable", 
                     {component: aContainer, column: i, sort: mySort},
                     function(aEvent) {
                        
                        //console.log("Sort");
                        
                        //Get the basic variables
                        var myComponent         = aEvent.data.component;
                        var myColumn            = aEvent.data.column;
                        var mySort              = aEvent.data.sort;
                        var myData              = myComponent.data("dynamicTable");
                        var myOptions           = myData.options;
                        
                        //Sort the dataset
                        methods.private_sortBy(myColumn, myData);
                        
                        //Render the place holders
                        methods.private_renderPlaceHolders(myComponent, myOptions.rowHeight, myOptions.pageSize, myData.data.length);
                        
                        //Render all visible pages
                        methods.private_renderVisible(myComponent);
                        
                        //Remove the up and down classes from any other sort fields
                        myComponent.find(".ui-dynamic-table-header-cell-sort.up, .ui-dynamic-table-header-cell-sort.down")
                                   .removeClass("up")
                                   .removeClass("down");
                        
                        //Add the up or down class to the current sort field.
                        if (myData.isDescending)
                        {
                           mySort.addClass("up");
                        }
                        else
                        {
                           mySort.addClass("down");
                        }
                        
                        return false;
                        
                     });
               
               var myFilter               = myCell.find(".ui-dynamic-table-header-cell-filter");
               
               myFilter.on(
                     "click.dynamicTable", 
                     {component: aContainer, column: aColumns[i], columnIndex: i, cell: myCell},
                     function(aEvent) {

                        console.log("Filter");
                        
                        var myComponent         = aEvent.data.component;
                        var myColumn            = aEvent.data.column;
                        var myColumnIndex       = aEvent.data.columnIndex;
                        var myCell              = aEvent.data.cell;
                        var myData              = myComponent.data("dynamicTable");                        
                        
                        methods.private_showFilter(myComponent, myColumn, myColumnIndex, myData, myCell);
                        
                        return false;
                        
                     });
               
               var myResize               = myCell.find(".ui-dynamic-table-header-cell-resize");
               
               myResize.on(
                     "mousedown.dynamicTable",
                     {component: aContainer, column: aColumns[i], columnIndex: i, cell: myCell, resize: myResize},
                     function(aEvent) {

                        var myCell           = aEvent.data.cell;
                        
                        //console.log("Resize mouse down" + [myCell.offset().left, 0, $(window).width(), 0]);
                        
                        myResize.draggable("option", "containment", [myCell.offset().left, 0, $(window).width(), 0]);
                        
                     }
               );
               
               myResize.draggable({
                  containment: aContainer,
                  appendTo: aContainer,
                  helper: function(){
                     
                     var myCellResizeIndicator         = $("<div/>");
                     myCellResizeIndicator.addClass    ("ui-dynamic-table-resize-indicator");
                     myCellResizeIndicator.css         ("height", aContainer.innerHeight());                            
                     
                     return myCellResizeIndicator;
                  },
                  drag: function(aEvent, aUi)
                  {
                     var myCell                        = $(aEvent.target).closest(".ui-dynamic-table-header-cell");
                     myCell.css({width: Math.max(aUi.offset.left - myCell.offset().left, 40)});
                  },
                  stop: function(aEvent, aUi)
                  {
                     var myCell              = $(aEvent.target).closest(".ui-dynamic-table-header-cell");
                     var myIndex             = parseInt(myCell.attr("id").replace("ui-dynamic-table-header-cell-", ""));
                     
                     var myTd                = myCell.closest("td");
                     var myTdIndex           = myTd.index();         
                     
                     var myData              = aContainer.data("dynamicTable");
                     var myColumn            = myData.options.columns[myIndex];
                     
                     myColumn.width          = Math.max(aUi.offset.left - myCell.offset().left, 40) + 1;
                     
                     //console.log("Width: " + Math.max(aUi.offset.left - myCell.offset().left, 40));
                     
                     var myOtherCells        = aContainer.find("table.ui-dynamic-table-page td:nth-child(" + myTdIndex + ") .ui-dynamic-table-page-cell");
                     
                     //console.log(myOtherCells);
                     
                     myOtherCells.css({width : myColumn.width - 1});
                  }
                  
               });               
               
               myRow.append(myCell);
               
            }
         }
         
         //Add the table.
         myHeaderContainer.append(myTable);
         
         //Insert the header as the first child.
         aContainer.prepend(myHeaderContainer);
      },

      /**=================================================================================
       * OPERATION: private_renderPlaceHolders
       * 
       * Renders place holders for each of the pages so we can scroll naturally.
       *================================================================================*/        
      private_renderPlaceHolders : function (aComponent, aRowHeight, aPageSize, aLength)
      {
         //Get the data object.
         var myData              = aComponent.data("dynamicTable");
         
         //Create a placeholder mask, which is essentially a bit mask with a bit for each
         //page set to false if it was not rendered and to true if it was rendered.
         //This way we don't have to search the DOM every time to find out if this was done
         //or not.
         myData.placeholderMask  = new Array();
         
         //Hide all open editors.
         aComponent.find(".ui-dynamic-table-editor").css("display", "none");
         
         //Get row container
         var myRowContainer      = aComponent.children(".ui-dynamic-table-private-row-container").first();
      
         //Remove all existing placeholders
         myRowContainer.children(".ui-dynamic-table-private-placeholder").remove();
         myRowContainer.children(".ui-dynamic-table-page").remove();
         
         //Initialize variables.
         var myNumPages          = Math.floor(aLength / aPageSize);
         var myRest              = aLength % aPageSize;
         var myPageHeight        = aRowHeight * aPageSize;
         var myPageIndex         = 0;
         
         var myColumns           = myData.options.columns;
         var myWidth             = 0;
         
         for (var i = 0; i < myColumns.length; i++)
         {
            if (myColumns[i].visible)
            {
               myWidth             += myColumns[i].width;
            }
         }
         
         //For each full page render the placeholde now.
         while(myPageIndex < myNumPages)
         {
            methods.private_renderPlaceHolder(myRowContainer, myPageIndex, myPageHeight, myWidth);
            myData.placeholderMask.push(false);
            myPageIndex++;
         }
         
         //If we have a rest render that placeholder.
         if (myRest > 0)
         {
            myData.placeholderMask.push(false);
            methods.private_renderPlaceHolder(myRowContainer, myPageIndex, aRowHeight * myRest, myWidth);
         }
      },

      /**=================================================================================
       * OPERATION: private_renderPlaceHolder
       * 
       * Renders an individual placeholder.
       *================================================================================*/         
      private_renderPlaceHolder : function (aContainer, aPageIndex, aHeight, aWidth)
      {
         aContainer.append("<div " +
                           "   id=\"ui-dynamic-table-private-page-" + aPageIndex + "\"" +
                           "   class=\"ui-dynamic-table-private-placeholder\"" +
                           "   style=\"height:"+ aHeight + "px;width:"+ aWidth + "px;margin:0px\"" +
                           "/></div>");          
      },

      /**=================================================================================
       * OPERATION: private_renderVisible
       * 
       * Renders a the visible rows.
       *================================================================================*/        
      private_renderVisible : function(aComponent) {
         
         //console.log("private_renderVisible: myData: " + aComponent.data("dynamicTable"));
         //var myStartTime            = (new Date()).getTime();
      
         //console.log("Render Visible Start ==========================================");
         //console.log("Preparing Data: " + ((new Date()).getTime() - myStartTime));
      
         //Get the global data.
         var myData                 = aComponent.data("dynamicTable");
         var myOptions              = myData.options;
         var myMask                 = myData.placeholderMask;
         var myColumns              = myOptions.columns;
         
         //Get the container
         var myContainer            = aComponent.children(".ui-dynamic-table-private-row-container").first();
         
         //Calculate the basic values.
         var myPageHeight           = myOptions.pageSize * myOptions.rowHeight;
         var myCurrentPage          = Math.floor(myContainer.scrollTop() / myPageHeight);
         var myStartPage            = Math.max(0, myCurrentPage - myOptions.pageBuffer); 
         var myEndPage              = Math.min(myMask.length, myCurrentPage + myOptions.pageBuffer);
         
         //console.log("myPageHeight: " + myPageHeight + " myCurrentPage: " + myCurrentPage + " myStartPage: " + myStartPage + " myEndPage: " + myEndPage);
        // console.log(myMask);
         
         var myHtml                 = "";
         var myPlaceholderIds       = [];
         
         //console.log("Beginning Loop: " + ((new Date()).getTime() - myStartTime));
         
         //For each of the pages in range...
         for (var i = myStartPage; i <= myEndPage; i++)
         {
            //Check that it was not already rendered
            if(!myMask[i])
            {
               //console.log("Rendering Page " + i + ": " + ((new Date()).getTime() - myStartTime));
               //console.log("rendering page: " + i);
               
               //Mark it as now rendered
               myMask[i]                  = true;
               
               //Create a table
               myHtml                    += "<table class=\"ui-dynamic-table-page\">";
               
               //Calculate the range of rows of this page
               var myStartRow             = (i * myOptions.pageSize);
               var myEndRow               = Math.min(myStartRow + myOptions.pageSize - 1, myData.data.length -1);
               
               //console.log("Rendering Rows:" + ((new Date()).getTime() - myStartTime));
               
               //For each row in range..
               for (var r = myStartRow; r <= myEndRow; r++)
               {
                  //console.log("rendering row: " + r);
                  //console.log("Rendering Row " + r +  ":" + ((new Date()).getTime() - myStartTime));
                  //Create the row
                  myHtml                  += "<tr>";
                  
                  if (myOptions.showCounter)
                  {
                     var myWidth          = (myOptions.showCheck ? 60 : 40);
                     
                     myHtml   += "<td>" +
                                 "   <div" +
                                 "      id=\"ui-dynamic-table-page-counter-" + r + "\"" +
                                 "      class=\"ui-dynamic-table-page-cell counter\" " +
                                 "      style=\"height:" + (myOptions.rowHeight) + "px;width:" + myWidth + "px; line-height: " + (myOptions.rowHeight) + "px\"" +
                                 "   > ";
                     
                     if (myOptions.showCheck)
                     {
                        myHtml+= "      <div style=\"float:left\">" +
                        		   "         <input type=\"checkbox\" id=\"ui-dynamic-table-row-check-" + r + "\" class=\"ui-dynamic-table-row-check\"/>" +
                        		   "      </div>"; 
                     }
                     
                     myHtml   += (r + 1) +  
                                 "    </div>" + 
                                 "</td>";
                  }
                  
                  //For each column...
                  for (var c = 0; c < myColumns.length; c++)
                  {
                     //If the column is visible...
                     if (myColumns[c].visible)
                     {
                        var myValue          = methods.private_renderValue(myData.data[r][c], myColumns[c]);
                        var myDynamicClass   = "";

                        if (myColumns[c].cssClass != null) {
                           if (typeof myColumns[c].cssClass === "function") {
                              myDynamicClass = myColumns[c].cssClass(myColumns[c], myData.data[r][c], myValue); 
                           }
                           else {
                              myDynamicClass = myColumns[c].cssClass;
                           }
                           
                           if (myDynamicClass != null) {
                              myDynamicClass    = " " + myDynamicClass;
                           }
                           else {
                              myDynamicClass    = "";
                           }
                        }
                        
                        //Add a cell.
                        myHtml              += 
                              "<td>" +
                              "   <div" +
                              "      id=\"ui-dynamic-table-page-cell-" + r + "-" + c + "\" " +
                              "      class=\"" + defaultCellStyle + myDynamicClass + " " + myColumns[c].type + "\" " +
                              "      style=\"height:" + (myOptions.rowHeight) + "px;width:" + (myColumns[c].width - 1) + "px; line-height: " + (myOptions.rowHeight) + "px;\"" +
                              "   >" + myValue + "</div>" + 
                              "</td>"
                        ;                                          
                     }
                  }
                  
                  myHtml                    += "</tr>";
                  
               }
               
               myHtml                       += "</table>";
               
               myPlaceholderIds.push(i);
               
               //console.log("Rendering Page " + i + " Complete: " + ((new Date()).getTime() - myStartTime));
            }
         }
         
         
         //console.log("Appending Data:" + ((new Date()).getTime() - myStartTime));

         if (myPlaceholderIds.length > 0)
         {
            //console.log("Insert new:" + ((new Date()).getTime() - myStartTime));
            var myFirst                      = myContainer.children("#ui-dynamic-table-private-page-" + myPlaceholderIds[0]);
            $(myHtml).insertBefore(myFirst);
            
            //console.log("Remove placeholder:" + ((new Date()).getTime() - myStartTime));
            
            for (var i = 0; i < myPlaceholderIds.length; i++)
            {
               myContainer.children("#ui-dynamic-table-private-page-" + myPlaceholderIds[i]).remove();
            }
         }
         
         //Get the actual placeholder
         //console.log("Complete:" + ((new Date()).getTime() - myStartTime));
      },
      
      /**=================================================================================
       * OPERATION: private_renderValue
       * 
       * Renders a value from it's raw fromat to a human readable string.
       *================================================================================*/         
      private_renderValue : function (aValue, aColumn)
      {
         //If the value is null or a string of "null" return a blank string
         if (aValue == null || aValue == "null")
         {
            return "";
         }
         //If the column has a type of number...
         else if (aColumn.type == "number")
         {
            //And if this is a decimal, format it.
            if (aColumn.format === "default-decimal")
            {
               return "$" + methods.private_renderDecimal(aValue.toFixed(2));
            }
            else if (aColumn.format === "time")
            {
               return Math.floor(aValue / 60) + ":" + ("0" + Math.abs(aValue % 60)).slice(-2);
            }
            //Otherwise simply return it.
            return aValue.toString();
         }
         //If this is a date.
         else if (aColumn.type == "date")
         {
            //Parse the date into a JS object
            var myDate           = methods.private_parseDate(aValue);
            
            var myFormat         = null;
            
            if (aColumn.format != null && aColumn.format !== "default-decimal") {
               myFormat          = aColumn.format;
            }
            
            // Is moment.js loaded?
            if (moment) {
               myFormat          = myFormat || "DD-MMM-YYYY";
               
               return moment(myDate).format(myFormat);            
            }
            // Is date.js loaded?
            else if (Date.parse) {
               myFormat          = myFormat || "dd-MMM-yyyy";
               
               return myDate.toString(myFormat);
            }
            else {
               return myDate.toString();
            }
         }
         //If this value is a boolean, translate it to yes and no.
         else if (aColumn.type == "boolean")
         {
            return (aValue == true || aValue == "Y" || aValue == 1 ? "Yes" : "No");
         }
         //Everything else return it as string
         else
         {
            return aValue.toString();
         }
      },
      
      /**=================================================================================
       * OPERATION: private_parseDate
       * 
       * Parses the supplied value into a date.
       *================================================================================*/        
      private_parseDate : function (aValue) {
         
         var myDate           = null;
         
         //If we have a null return a null
         if (aValue == null || aValue == "null")
         {
            myDate            = null;
         }
         //If the value is a string, parse it
         if (typeof aValue === "string")
         {
            myDate            = Date.parse(aValue);
         }
         //Otherwise wrap it in a date, as JSON passes dates as numbers.
         else
         {
            myDate            = new Date(aValue);
         }      
         
         return myDate;
      },
      
      /**=================================================================================
       * OPERATION: private_renderDecimal
       * 
       * Renders a decimal including injecting 1000's separators
       *================================================================================*/          
      private_renderDecimal : function (aValue) {
         aValue += '';
         x = aValue.split('.');
         x1 = x[0];
         x2 = x.length > 1 ? '.' + x[1] : '';
         var rgx = /(\d+)(\d{3})/;
         while (rgx.test(x1)) {
                 x1 = x1.replace(rgx, '$1' + ',' + '$2');
         }
         return x1 + x2;      
      },
      
      /**=================================================================================
       * OPERATION: private_sortBy
       * 
       * Sorts the data by a specific column.
       *================================================================================*/        
      private_sortBy : function (aField, aData, aResort)
      {
         //Get the actual row data.
         var myData              = aData.data;
      
         //If we are already sorting on the current field toggle the asc/desc
         if (aData.currentSort == aField && !aResort)
         {
            aData.isDescending   = !aData.isDescending;
         }
         //Otherwise set the default values.
         else
         {
            aData.isDescending   = false;
            aData.currentSort    = aField;
         }
         
         //If there is no data, return.
         if (myData.length == 0)
         {
             return;
         }
         
         //Do the actuak sort
         myData.sort(methods.private_sortFunction(aField, aData));
      },
      
      /**=================================================================================
       * OPERATION: private_sortFunction
       * 
       * Creates a sort function.
       *================================================================================*/  
      private_sortFunction: function (aField, aData) {
         
         return function (a, b) {
            
            //Get the fields.
            var myAField            = aField != null ? a[aField] : a;
            var myBField            = aField != null ? b[aField] : b;
            var myResult            = 0;
            
            //If field a does not exist
            if (myAField == null && myBField)
            {
               myResult             = 1;
            }
            //If field b does not exist
            else if (myAField && myBField == null)
            {
               myResult             = -1;
            }
            //If both do not exists
            else if (myAField == null && myBField == null)
            {
               myResult             = 0;
            }
            //Otherwise
            else
            {
               //If both fields are numbers
               if (!isNaN(myAField) && !isNaN(myBField))
               {
                  myResult             = myAField - myBField;
               }
               //If both fields are dates
               else if (myAField instanceof Date && myBField instanceof Date)
               {
                  myResult             = myAField.getTime() - myBField.getTime();
               }
               //Otherise compare as string.
               else
               {
                  myAField             = myAField.toString().toLowerCase();
                  myBField             = myBField.toString().toLowerCase();
                  
                  if (myAField < myBField)
                  {
                     myResult             = -1;
                  }
                  else if (myBField < myAField)
                  {
                     myResult             = 1;
                  }
                  else
                  {
                     myResult             = 0;
                  }
               }
            }
            
            //If the sort is desc reverse the result
            if (aData && aData.isDescending)
            {
                myResult                 *= -1;
            }
            
            //Return the result
            return myResult;   
         };
      },
      
      /**=================================================================================
       * OPERATION: private_showFilter
       * 
       * This function opens a filter pop up for a specific column.
       *================================================================================*/        
      private_showFilter: function(aComponent, aColumn, aColumnIndex, aData, aCell)
      {
         //TODO finalize this
         methods.private_hideFilter(null, aComponent);
         
         //Set this column as the current filter
         aData.currentFilter     = aColumn;
         
         //Initialize variables
         var myPopUp             = null;
         var myCurrentFilter     = null;
         
         //Create an activeFilters variable if none exists
         if (!aData.activeFilters)
         {
            aData.activeFilters  = [];
         }
         
         //Go through each of the active filters
         for (var i = 0; i < aData.activeFilters.length; i++)
         {
            //And see if we already have an existing filter
            if (aData.activeFilters[i].field == aColumnIndex)
            {
               myCurrentFilter          = aData.activeFilters[i];
               break;
            }
         }      
                
         //If the type is a list
         if (aColumn.filterType == "list")
         {
            myPopUp = methods.private_getPopUp(
               aComponent,
               ".ui-dynamic-table-filter-list", 
               "<div class=\"ui-dynamic-table-filter ui-dynamic-table-filter-list\"> " +  
               "   <select " +  
               "      class=\"ui-dynamic-table-filter-list-select\" " +
               "      multiple=\"multiple\" " + 
               "   ></select> " +
               "</div>"  
            );
         
            //Get the existing select and empty it out.
            var mySelect            = myPopUp.find(".ui-dynamic-table-filter-list-select");
            mySelect.empty();
            
            //Clean off any old event listener.
            mySelect.off("change.dynamicTable");
            //Add one with the new context.
            mySelect.on (
                  "change.dynamicTable", 
                  {component:    aComponent,
                   column:       aColumn,
                   columnIndex:  aColumnIndex,
                   data:         aData}, 
                  function(aEvent) {
                     methods.private_filterBy(
                        aEvent.data.component, 
                        aEvent.data.column, 
                        aEvent.data.columnIndex, 
                        aEvent.data.data
                     );
                  });
            
            //Make an array of distinct values.
            var myValues            = new Array();
            
            for (var i = 0; i < aData.data.length; i++)
            {
               var myValue          = aData.data[i][aColumnIndex];
            
               if (myValues.indexOf(myValue) == -1 && myValue != null)
               {
                  myValues.push(myValue);
               }
            }
            
            //Sort these values.
            myValues.sort(methods.private_sortFunction());
            
            //Inject standard filter option.
            mySelect.append("<option value='-show-all'>Show All</option>");
            mySelect.append("<option value='-blanks'>Blanks</option>");
            
            //Inject the values
            for (var i = 0; i < myValues.length; i++)
            {
                mySelect.append("<option value='" + myValues[i] + "'>" + methods.private_renderValue(myValues[i], aColumn) + "</option>");
            }
            
            //Set any current selections 
            if (myCurrentFilter != null)
            {
               mySelect.val(myCurrentFilter.values);
            }
         }
         //If this is a search type filter
         else if (aColumn.filterType == "search")
         {
            //Get the pop up
            myPopUp = methods.private_getPopUp(
               aComponent,
               ".ui-dynamic-table-filter-search", 
               "<div class=\"ui-dynamic-table-filter ui-dynamic-table-filter-search\"> " +  
               "   <div style=\"padding: 3px; color: #ffffff; font-weight: bold\">" +
               "      <a class=\"ui-dynamic-table-filter-search-clear\" href=\"javascript:return true\">Clear</a><br/>" +
               "   </div>" + 
               "   <input " + 
               "     class=\"ui-dynamic-table-filter-search-input\" " +
               "     type=\"text\" " +
               "   /> " + 
               "</div>"
            );
            
            //Get the search input
            var myInput            = myPopUp.find(".ui-dynamic-table-filter-search-input");
            
            //Unregister any open events
            myInput.off("keyup.dynamicTable");
            //Register a new event
            myInput.on (
                  "keyup.dynamicTable", 
                  {component:    aComponent,
                   column:       aColumn,
                   columnIndex:  aColumnIndex,
                   data:         aData}, 
                  function(aEvent) {
                     
                     if ($.ui.keyCode.ENTER == aEvent.which)
                     {
                        methods.private_hideFilter(aEvent, aEvent.data.component);
                        return;
                     }
                      
                     //console.log("Key Up");
                     //Get the data
                     var myData        = aEvent.data;
                     
                     //If there is currently a time-out, reset it
                     if (myData.searchTimeout != null) 
                     {
                        clearTimeout(myData.searchTimeout);
                     } 
                     
                     //Create a new time out that calls the filterBy method.
                     myData.searchTimeout = setTimeout(function() {
                        
                        //console.log("Searching by string");
                        
                        methods.private_filterBy(
                           aEvent.data.component, 
                           aEvent.data.column, 
                           aEvent.data.columnIndex, 
                           aEvent.data.data
                        );                        
                     }, 150);
                  });       
         
            var myClear            = myPopUp.find(".ui-dynamic-table-filter-search-clear");
            
            myClear.on (
                  "click.dynamicTable", 
                  {component:    aComponent,
                   column:       aColumn,
                   columnIndex:  aColumnIndex,
                   data:         aData}, 
                  function(aEvent) {
                  
                     console.log("Clear Click");
                         
                     myInput.val("");
                           
                     methods.private_filterBy(
                              aEvent.data.component, 
                              aEvent.data.column, 
                              aEvent.data.columnIndex, 
                              aEvent.data.data
                           );                        
   
                     methods.private_hideFilter(aEvent, aEvent.data.component);
                  
                  });                   
            
            //If there is a current value on the filter 
            //fill out the filter input
            if (myCurrentFilter != null)
            {
               myInput.val(myCurrentFilter.value);
            }
            //Otherwise, make sure it is blank
            else
            {
               myInput.val("");
            }
            
            setTimeout(function() {
               myInput.focus();
               myInput.select();
            }, 100);
         }
         //If the filter is of type date range
         else if (aColumn.filterType == "dateRange")
         {
            //Get the pop-up
            myPopUp = methods.private_getPopUp(
               aComponent,
               ".ui-dynamic-table-filter-date-range", 
               "<div class=\"ui-dynamic-table-filter ui-dynamic-table-filter-date-range\"> " +
               "   <div> " +
               "      <div style=\"padding-top: 3px; color: #ffffff; font-weight: bold\">Start Date (<a class=\"ui-dynamic-table-filter-date-range-start-clear\" href=\"javascript:return true\">Clear</a>):</div> " +
               "      <div class=\"ui-dynamic-table-filter-date-range-start\"></div> " +
               "   </div> " +
               "   <div> " +
               "      <div style=\"padding-top: 3px; color: #ffffff; font-weight: bold\">End Date (<a class=\"ui-dynamic-table-filter-date-range-end-clear\" href=\"javascript:return true\">Clear</a>):</div> " +
               "      <div class=\"ui-dynamic-table-filter-date-range-end\"></div> " +
               "   </div> " +
               "</div>"
            );         
            
            //Get the date selects
            var mySelects           = myPopUp.find(".ui-dynamic-table-filter-date-range-start, .ui-dynamic-table-filter-date-range-end");
            
            //Add the event handler to capture change events
            mySelects.datepicker({
               onSelect : function () {
                  methods.private_filterBy(aComponent, aColumn, aColumnIndex, aData);
               }
            });
            
            //Add the event handler to the start clear button.
            myPopUp.find(".ui-dynamic-table-filter-date-range-start-clear").on(
                  "click.dynamicTable", 
                  {component:    aComponent,
                   column:       aColumn,
                   columnIndex:  aColumnIndex,
                   data:         aData}, 
                  function(aEvent) {
                  
                      mySelects.filter(".ui-dynamic-table-filter-date-range-start")
                               .datepicker("setDate", null);
                      
                     methods.private_filterBy(
                         aEvent.data.component, 
                         aEvent.data.column, 
                         aEvent.data.columnIndex, 
                         aEvent.data.data
                     );                            
                  }
            );
            
            //Add the event handler to the end clear button.
            myPopUp.find(".ui-dynamic-table-filter-date-range-end-clear").on(
                  "click.dynamicTable", 
                  {component:    aComponent,
                   column:       aColumn,
                   columnIndex:  aColumnIndex,
                   data:         aData}, 
                  function(aEvent) {
                     
                     mySelects.filter(".ui-dynamic-table-filter-date-range-end")
                     .datepicker("setDate", null);
                     
                     methods.private_filterBy(
                           aEvent.data.component, 
                           aEvent.data.column, 
                           aEvent.data.columnIndex, 
                           aEvent.data.data
                     );                            
                  }
            );
           
            //If we have a current filter set the values.
            if (myCurrentFilter != null)
            {
               mySelects.filter(".ui-dynamic-table-filter-date-range-start")
                        .datepicker("setDate", myCurrentFilter.hasStart ? methods.private_parseDate(myCurrentFilter.startDate) : null);
               mySelects.filter(".ui-dynamic-table-filter-date-range-end")
                        .datepicker("setDate", myCurrentFilter.hasEnd ? methods.private_parseDate(myCurrentFilter.endDate) : null);
            }
            //Otherwise, clear them.
            else
            {
               mySelects.filter(".ui-dynamic-table-filter-date-range-start")
                        .datepicker("setDate", null);
               mySelects.filter(".ui-dynamic-table-filter-date-range-end")
                        .datepicker("setDate", null);
            }
         }  
         
         //Display the pop-up.
         myPopUp.css("display", "block");
         //Place it at the bottom of the cell where the filter was invoked on.
         myPopUp.offset({left: aCell.offset().left, top: aCell.offset().top + aCell.height() - 1});
      },
      
      /**=================================================================================
       * OPERATION: private_getPopUp
       * 
       * Gets the existing pop-up or creates a new one.
       *================================================================================*/       
      private_getPopUp : function(aComponent, aClass, aHtml)
      {
         //Try to get the existing pop up
         var myPopUp                = aComponent.children(aClass);
         
         //Check if it exists and use it...
         if (myPopUp.length == 0)
         {
            myPopUp = $(aHtml);
            
            aComponent.append(myPopUp);
            
            //Add an event listener that prevents click event from bubbling up
            myPopUp.on("click.dynamicTable", function(aEvent){
               return false;
            });
         }      
         
         return myPopUp;
      },
      
      /**=================================================================================
       * OPERATION: private_hideFilter
       * 
       * Called to hide a filter
       *================================================================================*/        
      private_hideFilter: function(aEvent, aComponent)
      {
         //console.log("Any click");
         
         //Get the component 
         var myComponent         = aComponent;
         
         //If there is none get it from the event.
         if (myComponent == null)
         {
            myComponent          = aEvent.data.component;
         }
         
         //Hide all filter pop-ups
         var myFilters           = myComponent.children(".ui-dynamic-table-filter");
         myFilters.css("display", "none");
      },      
      
      /**=================================================================================
       * OPERATION: private_filterBy
       * 
       * Adds a specific filter to the chain of filters.
       *================================================================================*/        
      private_filterBy: function(aComponent, aColumn, aColumnIndex, aData) {
         
         //Go through each of the active filters to see if the column has already one 
         //applied to it. If so remove that.
         for (var i = 0; i < aData.activeFilters.length; i++)
         {
            if (aData.activeFilters[i].field == aColumnIndex)
            {
               aData.activeFilters.splice(i, 1);
               break;
            }
         }      
         
         //If the type is list
         if (aColumn.filterType == "list")
         {
            //Get the data
            var mySelect            = aComponent.find(".ui-dynamic-table-filter-list-select");
            var myValue             = mySelect.val();
            var myIncludeBlanks     = myValue.indexOf("-blanks") > -1;
            
            //Unless "show all" was selected, add the filter now.
            if (myValue.indexOf("-show-all") == -1)
            {
               aData.activeFilters.push({
                  field:         aColumnIndex,
                  includeBlanks: myIncludeBlanks,
                  values:        myValue,
                  type:          aColumn.filterType
               });
            }
         }
         //If the type is search
         else if (aColumn.filterType == "search")
         {
            //Get the value
            var myValue            = aComponent.find(".ui-dynamic-table-filter-search-input").val();
         
            //If a value is spefied, add the filter now.
            if (myValue != null && jQuery.trim(myValue) != "")
            {
               aData.activeFilters.push({
                  field:         aColumnIndex,
                  value:         myValue.toLowerCase(),
                  type:          aColumn.filterType
               });            
            }
         }
         //If we have a date range
         else if (aColumn.filterType == "dateRange")
         {
             //Get the data
             var myStart            = aComponent.find(".ui-dynamic-table-filter-date-range-start").datepicker("getDate");
             var myEnd              = aComponent.find(".ui-dynamic-table-filter-date-range-end").datepicker("getDate");
             
             //If there is data, add the filter now
             if (myStart != null || myEnd != null)
             {
                aData.activeFilters.push({
                   field:         aColumnIndex,
                   type:          aColumn.filterType,
                   startDate:     myStart ? myStart.getTime() : methods.private_parseDate('1900-01-01').getTime(),
                   endDate:       myEnd   ? myEnd.getTime()   : methods.private_parseDate('2100-01-01').getTime(),
                   hasStart:      myStart != null,
                   hasEnd:        myEnd   != null
                });            
             }
         }
         
         //Apply the filter
         methods.private_applyFilter         (aData);
         
         //Applies the current sort again, if there is one
         if (aData.currentSort)
         {
            methods.private_sortBy              (aData.currentSort, aData, true);
         }
         
         //Render placeholders
         methods.private_renderPlaceHolders  (aComponent, aData.options.rowHeight, aData.options.pageSize, aData.data.length);
         
         //Render the visible parts of the table 
         methods.private_renderVisible       (aComponent);
      },
      
      /**=================================================================================
       * OPERATION: private_applyFilter
       * 
       * Actually does the filtering of the dataset
       *================================================================================*/ 
      private_applyFilter: function(aData)
      {
         //For each item in the original dataset
         aData.data = jQuery.grep(aData.originalData, function(aItem, aIndex){
            
            //By default we include
            var myInclude           = true;
            
            //Check each of the active filters
            for (var i = 0; i < aData.activeFilters.length; i++)
            {
               var myFilter        = aData.activeFilters[i];
               
               if (myFilter.type == "list")
               {
                  myInclude           = myInclude && (myFilter.values.indexOf(aItem[myFilter.field] + "") > -1 || (myFilter.includeBlanks && aItem[myFilter.field] == null));
               }
               else if (myFilter.type == "search")
               {
                  myInclude           = myInclude && aItem[myFilter.field] != null && aItem[myFilter.field].toLowerCase().indexOf(myFilter.value) >= 0;
               }
               else if (myFilter.type == "dateRange")
               {
                  myInclude           = myInclude && aItem[myFilter.field] != null 
                                        && methods.private_parseDate(aItem[myFilter.field]).getTime() >= myFilter.startDate 
                                        && methods.private_parseDate(aItem[myFilter.field]).getTime() < myFilter.endDate;
               }
            }
            
            //Return whether or not the item is to be included.
            return myInclude;
         }); 
         
         aData.checkedRows   = [];
         
         if (aData.options.listChange)
         {
            aData.options.listChange(aData.data);
         }
      },
      
      private_handleCellClick: function(aEvent) {
      
         var myComponent                 = aEvent.data.component;
         var myData                      = myComponent.data("dynamicTable");
         var myCell                      = $(aEvent.currentTarget);
         var myId                        = myCell.attr("id");
         
         var myTableLocation             = myId.replace("ui-dynamic-table-page-cell-", "")
                                               .split("-");
         
         methods.private_activateEditor  (myComponent, myCell, myTableLocation);
         
         methods.private_selectRow(myComponent, myCell, myTableLocation);
      },

      private_handleCellDoubleClick: function(aEvent) {
      
         var myComponent                 = aEvent.data.component;
         var myData                      = myComponent.data("dynamicTable");
         var myCell                      = $(aEvent.currentTarget);
         var myId                        = myCell.attr("id");
         
         var myTableLocation             = myId.replace("ui-dynamic-table-page-cell-", "")
                                               .split("-");         
      
         myComponent.trigger({
            type: "rowDoubleClick", 
            row: myData.data[myTableLocation[0]]
         });             
      },
      
      private_selectRow: function (aComponent, aCell, aTableLocation) {
      
         var myData                      = aComponent.data("dynamicTable");
         
         //Mark the current row as selected
         aComponent.find("tr.selected").removeClass("selected");
         
         var myRow                       = aCell.closest("tr");
         myRow.addClass                  ("selected");
         
         //Trigger the row select event
         aComponent.trigger({
            type: "rowSelect", 
            row: myData.data[aTableLocation[0]]
         });         
         
         myData.location                 = aTableLocation;
         
         var myContainer                 = aComponent.children(".ui-dynamic-table-private-row-container");

         var myRowBottom                 = (myContainer.scrollTop() + myRow.offset().top + myRow.height()) - myContainer.offset().top;
         var myContainerBottom           = (myContainer.scrollTop() + myContainer.height()) - myRow.height();
         
         var myRowTop                    = (myContainer.scrollTop() + myRow.offset().top) - myContainer.offset().top;
         var myContainerTop              = myContainer.scrollTop();
         
         if (myRowBottom > myContainerBottom)
         {
            var myDifference              = myRowBottom - myContainerBottom;
            
            myContainer.scrollTop(myContainer.scrollTop() + myDifference);
         }
         else if (myRowTop < myContainerTop)
         {
            var myDifference              = myContainerTop - myRowTop;
            
            myContainer.scrollTop(myContainer.scrollTop() - myDifference);         
         }
      },
      
      private_handleKey: function(aEvent) {
         
         var myKey               = aEvent.which;
         
         if (myKey != $.ui.keyCode.UP &&
             myKey != $.ui.keyCode.DOWN)
         {
            return;
         }
         
         var myComponent         = aEvent.data.component;
         var myData              = myComponent.data("dynamicTable");
         var myLocation          = myData.location;
         var myLocationChanged   = false;
         
         if (!myLocation)
         {
            //TODO the "1" as a cell is not logical, but gives trouble if set to 0
            myLocation           = [0, 1];
         }
         
         if (myKey == $.ui.keyCode.UP)
         {
            myLocation[0]        = parseInt(myLocation[0]) - 1;
            
            if (myLocation[0] < 0)
            {
               myLocation[0]     = 0;
            }
            
            myLocationChanged    = true;
         }
         else if (myKey == $.ui.keyCode.DOWN)
         {
            myLocation[0]        = parseInt(myLocation[0]) + 1;
            
            if (myLocation[0] >= myData.data.length)
            {
               myLocation[0]     = myData.data.length - 1;
            }
            
            myLocationChanged    = true;
         }
         
         if (myLocationChanged)
         {
            console.log(myLocation);
            console.log($("#ui-dynamic-table-page-cell-" + myLocation[0] + "-" + myLocation[1]));
            
            methods.private_selectRow(
                  myComponent, 
                  $("#ui-dynamic-table-page-cell-" + myLocation[0] + "-" + myLocation[1]), 
                  myLocation
            );
         }
         
      },
      
      private_activateEditor: function(aComponent, aCell, aTableLocation) {
         
         var myComponent                 = aComponent;
         var myData                      = myComponent.data("dynamicTable");
         var myColumns                   = myData.options.columns;
         var myRows                      = myData.data;
         var myTableLocation             = aTableLocation;
         var myCell                      = aCell;
         
         var myColumn                    = myColumns[myTableLocation[1]];
         var myRow                       = myRows[myTableLocation[0]];

         //Hide all open editors.
         myComponent.find(".ui-dynamic-table-editor").css("display", "none");         
         
         if (myColumn.editor)
         {
            var myEditor                 = myColumn.editor;
            var myRectangle = {
               top    : myCell.offset().top,    
               left   : myCell.offset().left,
               width  : myCell.outerWidth(),
               height : myCell.outerHeight()
            };
            
            if (myEditor.parent().length == 0)
            {
               var myRowContainer        = myComponent.children(".ui-dynamic-table-private-row-container");
               myRowContainer.prepend    (myEditor);
               
               myEditor.dynamicTableEditor("callback", methods.private_editorCallback);
            }
            
            myEditor.dynamicTableEditor(
                  "activate", 
                  myRectangle, 
                  $.trim(myCell.text()), 
                  myRow, 
                  myColumn, 
                  parseInt(myTableLocation[0]), 
                  parseInt(myTableLocation[1])
            );
         }
      },
      
      private_editorCallback: function(aEditor, aType, aValue, aState){
         
         var myComponent               = aEditor.closest(".ui-dynamic-table");
         
         if (aType == "edit")
         {
            var myCell                 = myComponent.find("#ui-dynamic-table-page-cell-" + aState.rowIndex + "-" + aState.columnIndex);
            myCell.text(aValue);
            
            var myDynamicClass   = null;

            if (aState.column.cssClass != null) {
               if (typeof aState.column.cssClass === "function") {
                  //TODO we should get the real value, not just the formatted value
                  myDynamicClass = aState.column.cssClass(aState.column, null, aValue); 
               }
               else {
                  myDynamicClass = aState.column.cssClass;
               }
            }
            
            myCell.removeClass   ();
            myCell.addClass      (defaultCellStyle);
            
            if (myDynamicClass != null) {
               myCell.addClass   (myDynamicClass);
            }
            
         }
         else if (aType == "down" || aType == "up" || aType == "left" || aType == "right")
         {
            var myData                 = myComponent.data("dynamicTable");
            var myColumns              = myData.options.columns;
            var myRowIndex             = aState.rowIndex;
            var myColumnIndex          = aState.columnIndex;
            
            if (aType == "down")
            {
               myRowIndex              = Math.min(myRowIndex + 1, myData.data.length -1);
            }
            else if (aType == "up")
            {
               myRowIndex              = Math.max(myRowIndex - 1, 0);
            }
            else if (aType == "left")
            {
               for (var i = myColumnIndex - 1; i >= 0; i--)
               {
                  if(myColumns[i].editor != null)
                  {
                     myColumnIndex     = i;
                     break;
                  }
               }
            }
            else if (aType == "right")
            {
               for (var i = myColumnIndex + 1; i < myColumns.length; i++)
               {
                  console.log("Checking column: " + i);
                  
                  if(myColumns[i].editor != null)
                  {
                     myColumnIndex     = i;
                     break;
                  }
               }
            }
            
            var myCell                 = myComponent.find("#ui-dynamic-table-page-cell-" + myRowIndex + "-" + myColumnIndex);
            
            methods.private_activateEditor(myComponent, myCell, [myRowIndex, myColumnIndex]);
            
            if (aType == "up" || aType == "down")
            {
               methods.private_selectRow(myComponent, myCell, [myRowIndex, myColumnIndex]);            
            }
         }
      },
      

      private_handleRowCheck : function (aEvent)      {
      
         var myComponent         = aEvent.data.component;
         var myData              = myComponent.data("dynamicTable");
         var myTargetId          = $(aEvent.target).attr("id");
         var myRowNumber         = parseInt(myTargetId.replace("ui-dynamic-table-row-check-", ""));
         
         if (myData.checkedRows == null)
         {
            myData.checkedRows   = [];
         }
         
         var myRow               = myData.data[myRowNumber];
         
         if ($(aEvent.target).attr("checked"))
         {
            myData.checkedRows.push(myRow);
         }
         else
         {
            for (var i = 0; i < myData.checkedRows.length; i++)
            {
               if (myRow === myData.checkedRows[i])
               {
                  myData.checkedRows.splice(i, 1);
               }
            }
         }
         
         methods.private_selectRow(myComponent, $(aEvent.target).closest("td"), [myRowNumber, 1]);
      },
      
      /**=================================================================================
       * OPERATION: list
       * 
       * Sets the list data of the datagrid
       *================================================================================*/   
      data: function (aData, aColumns){
         return this.each(function() {
            
            //Get the actual data
            var myData           = $(this).data("dynamicTable");
            
            //Set the new row data
            myData.data          = aData;
            //Keep a copy, so we can fall back to this after we filtered the thing.
            myData.originalData  = aData;
            //Reset the checked rows
            myData.checkedRows   = [];
            //Reset any ongoing filters
            myData.activeFilters = [];
            
            //Get the options
            var myOptions        = myData.options;
            
            //Default the columns if they where specified.
            if (aColumns)
            {
               for (var i = 0; i < aColumns.length; i++)
               {
                  aColumns[i]    = $.extend({width:100, filterType: "list"}, aColumns[i]);
               }
               
               myOptions.columns = aColumns;
            }
            
            //Render the header
            methods.private_renderHeader        ($(this), myOptions.columns, myOptions.rowHeight);
            
            //Render placeholders
            methods.private_renderPlaceHolders  ($(this), myOptions.rowHeight, myOptions.pageSize, aData.length);
            
            //Render the visible table content
            methods.private_renderVisible       ($(this));
            
            if (myOptions.listChange)
            {
               myOptions.listChange(aData);
            }
            
         });        
      },
      
      /**=================================================================================
       * OPERATION: updateRow
       * 
       * Updates a row of data without re-rendering the entire table as the "data" 
       * function would do.
       *================================================================================*/         
      updateRow : function (aRowNumber, aRowData) {
         return this.each(function() {
            //Get the actual data
            var myContainer      = $(this);
            var myData           = myContainer.data("dynamicTable");
            var myRows           = myData.data;
            var myColumns        = myData.options.columns;
            
            myRows[aRowNumber]   = aRowData;
            
            for (var i = 0; i < myColumns.length; i++) {
               if (myColumns[i].visible) {
                  var myCell           = myContainer.find("#ui-dynamic-table-page-cell-" + aRowNumber + "-" + i + "");
                  var myContent        = myCell.find(".ui-dynamic-table-page-cell-content");
                  
                  var myDynamicClass   = null;

                  if (myColumns[i].cssClass != null) {
                     if (typeof myColumns[i].cssClass === "function") {
                        //TODO we should get the real value, not just the formatted value
                        myDynamicClass = myColumns[i].cssClass(myColumns[i], null, aRowData[i]); 
                     }
                     else {
                        myDynamicClass = myColumns[i].cssClass;
                     }
                  }
                  
                  myCell.removeClass   ();
                  myCell.addClass      (defaultCellStyle);
                  
                  if (myDynamicClass != null) {
                     myCell.addClass   (myDynamicClass);
                  }                  
                  
                  myContent.html(methods.private_renderValue(aRowData[i], myColumns[i]));
               }
            }
            
         });
      },
      
      checkedRows : function () {
         
         var myData           = this.first().data("dynamicTable");
         return (myData.checkedRows != null ? myData.checkedRows : []);
      },

      option : function (aOption, aValue) {
         return this.each(function() {
            var myData              = $(this).data("dynamicTable");
            myData.options[aOption] = aValue;
         });
      },
      
      /**=================================================================================
       * OPERATION: print
       * 
       * Generates a static version of the Grid to an iframe and sends the command to
       * print that iframe to the browser.
       *================================================================================*/           
      print : function () {
         var myComponent         = $(this);
         var myData              = myComponent.data("dynamicTable");
         var myRows              = myData.data;
         var myColumns           = myData.options.columns;
         
         var myHtml              = "";//"<html><head></head><body>";
         myHtml                 += "   <table>";
         myHtml                 += "      <thead>";
         myHtml                 += "         <tr>";
         
         for (var c = 0; c < myColumns.length; c++) {
            
            if (!myColumns[c].visible) {
               continue;
            }
            
            myHtml              += "            <th>" + myColumns[c].name + "</th>"
         }
         
         myHtml                 += "         </tr>";
         myHtml                 += "      </thead>";
         myHtml                 += "      <tbody>";
         
         for (var r = 0; r < myRows.length; r++) {
            
            myHtml              += "         <tr>";
            
            for (var c = 0; c < myColumns.length; c++) {
               
               if (!myColumns[c].visible) {
                  continue;
               }

               var myValue       = methods.private_renderValue(myRows[r][c], myColumns[c]);
               myHtml           += "            <td style=\"width:" + myColumns[c].width + "px\" class=\"" + myColumns[c].type + "\">" + myValue + "</td>";
            }
            
            myHtml              += "         <tr>";
         }
         
         myHtml                 += "      </tbody>";
         myHtml                 += "   </table>";
         //myHtml                 += "</body></html>";
         
         // We attach a canvas to the document that covers the entirety of the page 
         // in print mode and then can be printed. 
         var myPrintCanvas       = $("<div class=\"ui-dynamic-table-print\">")
                                    .html(myHtml)
                                    .appendTo("body");
         
         window.print();
         
         myPrintCanvas.remove();
         
         //Iframe print, has it's issues, but may come in handy.
         /*var myIframe            = myComponent.find(".js-print-frame");
         
         if (myIframe.length === 0) {
            myIframe = $("<iframe/>").css({
               position : "absolute",
               zIndex: 5000,
               width: 400,
               height: 200,
               backgroundColor: "#ffffff",
               //visibility : "hidden"
            }).appendTo("body")
            .load(populateIframe);
         }
         else {
            populateIframe();
         }

         // We make a separate function here as there are two different routes this can
         // take. If the iframe exists we can just go ahead. If we just created it, we 
         // need to wate for it to load.
         function populateIframe() {
            myIframe.contents().find("html").html(myHtml);
         }*/
      }
   };
   
   /**====================================================================================
    * OPERATION: dynamicTable
    * 
    * The plugin method that gets added to the jQuery method object.
    *===================================================================================*/         
   $.fn.dynamicTable       = function(aMethod) {
      
      if ( methods[aMethod] && typeof aMethod === "string" && aMethod.indexOf("private_") == -1) 
      {
         return methods[ aMethod ].apply( this, Array.prototype.slice.call( arguments, 1 ));
      } 
      else if ( typeof aMethod === 'object' || ! aMethod ) 
      {
         return methods.init.apply( this, arguments );
      } 
      else 
      {
         $.error( 'Method ' +  aMethod + ' does not exist on jQuery.dynamicTable' );
      }    

   };
})(jQuery);