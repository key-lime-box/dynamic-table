/**=======================================================================================
 * DYNAMIC TABLE
 * 
 * https://github.com/key-lime-box/dynamic-table
 * 
 * Copyright (c) 2014, 2016 Key Lime Box
 *======================================================================================*/
/**=======================================================================================
 * The Dynamic Table is a grid that displays data in a similar way to a spreadsheet
 * but allows the data to be loaded from you backend and control over what can be
 * edited and how it is being saved.
 *======================================================================================*/
(function($) {

   var defaultCellStyle = "ui-dynamic-table-page-cell";
   
   /**====================================================================================
    * Container for the methods.
    *===================================================================================*/
   var methods = {
      
      /**=================================================================================
       * The initialization method which creates a new instance of the object.
       *================================================================================*/
      init: function(aOptions) {
      
         //Set default values
         var myOptions        = $.extend({
                                    fillParent        : true,
                                    rowHeight         : 35,
                                    headerHeight      : 35,
                                    pageSize          : 50,
                                    pageBuffer        : 1,
                                    showCounter       : false,
                                    showCheck         : false,
                                    changeColumns     : false,
                                    settingsHandler   : $.fn.dynamicTable.defaultSettingsHandler()
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

            myContainer.prop("tabindex", 0);
            
            myContainer.click(function(aEvent) {
               if (!$(aEvent.target).is(":focusable")) {
                  $(this).focus();
               }               
            });
            
            //Add a container for rows.
            var myRowContainer            = $("<div/>");
            myRowContainer.addClass       ("ui-dynamic-table-private-row-container");
            methods.private_initRowContainer (myContainer, myOptions);
            
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
            methods.private_handleResize({data : {component : myContainer}});

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
       * Initializes the basic properties of the row container
       *================================================================================*/ 
      private_initRowContainer : function (aComponent, aOptions) {
         var myRowContainer         = aComponent.children(".ui-dynamic-table-private-row-container").first();
         myRowContainer.css         ("position", "absolute");
         myRowContainer.css         ("overflow", "auto");
         myRowContainer.css         ("margin-top", aOptions.headerHeight);
      },

      /**=================================================================================
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

         $(window).on ("resize", {component : aContainer}, this.private_handleResize);
      },
      
      /**=================================================================================
       * Called when the component gets resized
       *================================================================================*/       
      private_handleResize: function(aEvent) {
       
         //console.log("resizing dynamic grid");
         
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
         myRowContainer.css("height", myInnerHeight - myOptions.headerHeight);
         myRowContainer.css("width", myInnerWidth);
         
         var myResizeIndicator   = myComponent.children(".ui-dynamic-table-resize-indicator").first();
         myResizeIndicator.css("height", myInnerHeight);         
         
         //Make the header the same width as the table 
         myComponent.children(".ui-dynamic-table-header").css("width", myComponent.width());
      },

      /**=================================================================================
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
       * This function picks up at scheduled intervals the need for generating new 
       * visible pages/rows.
       *================================================================================*/        
      private_handleScrollInterval : function (aComponent, aOptions)
      {
         var myTime                 = (new Date()).getTime();
      
         //Only if the options were flagged to refresh.
         if (aOptions.refreshVisible && myTime - aOptions.lastScrollTime > 10)
         {
            //console.log("refresh");
            
            //Reset the flag
            aOptions.refreshVisible = false;
            
            //Render the items that have now become visible.
            methods.private_renderVisible (aComponent);      
         }
      },
      
      /**=================================================================================
       * Renders the header so that it is fixed and not scrolling.
       *================================================================================*/         
      private_renderHeader : function(aContainer, aColumns, aHeaderHeight) {
         
         //Remove the existing header table.
         aContainer.children(".ui-dynamic-table-header").remove();

         var myData                    = aContainer.data("dynamicTable");
         var myOptions                 = myData.options;
         
         //Add a container div.
         var myHeaderContainer         = $("<div/>");
         myHeaderContainer.addClass    ("ui-dynamic-table-header");
         myHeaderContainer.css         ("width",      aContainer.width());
         myHeaderContainer.css         ("height",     aHeaderHeight);
         myHeaderContainer.css         ("overflow",   "hidden");
         myHeaderContainer.css         ("position",   "absolute");
         
         //Add the actual table into the container
         var myTable                   = $("<table/>");
         myTable.css                   ("height",     aHeaderHeight);
         
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
                  "      style=\"height:" + (aHeaderHeight) + "px;width:" + (myWidth + 1) + "px; line-height:" + (aHeaderHeight) + "px\"" +
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
               
               // //If this is the last column add 17 pixels to make up for the fact that
               // //we don't have a vertical scroll bar, but the main row container does.
               // if (i == aColumns.length - 1)
               // {
               //     myWidth            += 17;
               // }
               
               //Add the cell.
               var myCell = $(
                     "<td>" +
                     "   <div" +
                     "      id=\"ui-dynamic-table-header-cell-" + i + "\" " +
                     "      class=\"ui-dynamic-table-header-cell\" " +
                     "      style=\"height:" + (aHeaderHeight) + "px;width:" + (myWidth - 1)+ "px;line-height:" + (aHeaderHeight) + "px;\"" +
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
                        var mySort              = aEvent.data.sort;
                        var myData              = myComponent.data("dynamicTable");
                        var myOptions           = myData.options;
                        
                        var myColumn            = aEvent.data.column;
                        myColumn                = myOptions.columns[myColumn].field || myColumn;

                        //Sort the dataset
                        methods.private_sortBy(myComponent, myColumn, myData);
                        
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

                        //console.log("Filter");
                        
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

                     myData.options.settingsHandler.saveColumn(myColumn);
                  }
                  
               });               
               
               myRow.append(myCell);
               
            }
         }
         
         // Append settings
         if (myOptions.changeColumns) {
            var mySettingsCell = $(
               "<td>" +
               "   <div" +
               "      id=\"ui-dynamic-table-header-cell-" + i + "\" " +
               "      class=\"ui-dynamic-table-header-cell settings-header\" " +
               "      style=\"height:" + (aHeaderHeight) + "px;width:17px; line-height:" + (aHeaderHeight) + "px\"" +
               "   ><a href=\"javascript:void(0)\" class=\"ui-dynamic-table-header-settings\">+/-</a></div>" + 
               "</td>"
            ).appendTo(myRow);

            var mySettingsLink = mySettingsCell.find(".ui-dynamic-table-header-settings");

            mySettingsLink.on("click.dynamicTable", function(aEvent) {
               methods.private_showSettings(mySettingsCell, aContainer);
               return false;
            });
         }
         else {
            $(
               "<td>" +
               "   <div" +
               "      id=\"ui-dynamic-table-header-cell-" + i + "\" " +
               "      class=\"ui-dynamic-table-header-cell settings-header\" " +
               "      style=\"height:" + (aHeaderHeight) + "px;width:17px; line-height:" + (aHeaderHeight) + "px\"" +
               "   >&nbsp;</div>" + 
               "</td>"
            ).appendTo(myRow);
         }

         //Add the table.
         myHeaderContainer.append(myTable);
         
         //Insert the header as the first child.
         aContainer.prepend(myHeaderContainer);

         var myTableContainer =  aContainer.children(".ui-dynamic-table-private-row-container").first();
         myHeaderContainer.scrollLeft(myTableContainer.scrollLeft());
      },

      /**=================================================================================
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
                        var myRawValue       = methods.private_getCellValue(myData.data[r], c, myColumns[c])
                        var myValue          = methods.private_renderValue(myRawValue, myColumns[c]);
                        var myDynamicClass   = "";

                        if (myColumns[c].cssClass != null) {
                           if (typeof myColumns[c].cssClass === "function") {
                              myDynamicClass = myColumns[c].cssClass(myColumns[c], myRawValue, myValue); 
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
                        myHtml += 
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

            setTimeout(function() {
               methods.private_highlightSelected(aComponent);
            })
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
       * Returns the value of the given cell, either by index access or by using the
       * field attribute.
       *================================================================================*/       
      private_getCellValue : function(aRow, aIndex, aColumn) {
         return aRow[(aColumn.field || aIndex)];
      },

      /**=================================================================================
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
               return methods.private_renderDecimal(aValue.toFixed(2));
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
            
            if (myDate == null) {
               return "";
            }
            
            var myFormat         = null;
            
            if (aColumn.format != null && aColumn.format !== "default-decimal") {
               myFormat          = aColumn.format;
            }
            
            // Is moment.js loaded?
            if (window.moment) {
               
               myFormat          = myFormat || "DD-MMM-YYYY";
               
               return moment(myDate).format(myFormat);            
            }
            // Is date.js loaded?
            else if (Date.today) {
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
       * Parses the supplied value into a date.
       *================================================================================*/        
      private_parseDate : function (aValue) {
         
         var myDate           = null;
         
         //If we have a null return a null
         if (aValue == null || aValue == "null" || aValue == "")
         {
            myDate            = null;
         }
         //If the value is a string, parse it
         else if (typeof aValue === "string")
         {
            // Is moment.js present
            if (moment) {
               var myMoment      = moment(aValue);
               
               if (myMoment.isValid()) {
                  myDate         = myMoment.toDate();
               }
            }
            // Is moment.js present            
            else if (Date.today) {
               myDate            = Date.parse(aValue);
            }
            // Use default JS implementation
            else {
               var myMillis      = Date.parse(aValue);
               
               if (!isNaN(myMillis)) {
                  myDate         = new Date(myMillis);
               }
            }
         }
         //Otherwise wrap it in a date, as JSON passes dates as numbers.
         else
         {
            myDate            = new Date(aValue);
         }      
         
         return myDate;
      },
      
      /**=================================================================================
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
       * Sorts the data by a specific column.
       *================================================================================*/        
      private_sortBy : function (aComponent, aField, aData, aResort)
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
         
         //Do the actual sort
         myData.sort(methods.private_sortFunction(aField, aData));
         
         aComponent
            .find(".ui-dynamic-table-header-cell.ui-dynamic-table-sorted")
            .removeClass("ui-dynamic-table-sorted");         
                  
         aComponent
            .find("#ui-dynamic-table-header-cell-" + aField)
            .addClass("ui-dynamic-table-sorted");
      },
      
      /**=================================================================================
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
                  function(aEvent) {
                     methods.private_filterBy(aComponent, aColumn, aColumnIndex, aData, aCell);
                  });
            
            //Make an array of distinct values.
            var myValues            = new Array();
            
            for (var i = 0; i < aData.data.length; i++)
            {
               var myValue          = methods.private_getCellValue(aData.data[i], aColumnIndex, aColumn);

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
               var myDisplayValue = myValues[i];

               // Swallow HTML tags before displaying the value in the picklist.
               // This allows the content of cells to be HTML formatted while still 
               // giving a clear selection.
               if (typeof myDisplayValue === 'string' && myDisplayValue.match(".*<.*>.*")) {
                  myDisplayValue = $("<span>" + myDisplayValue + "</span>").text();
               }

               var myOption = $("<option>")
                  .prop("value", myValues[i])
                  .text(methods.private_renderValue(myDisplayValue, aColumn));
               
               mySelect.append(myOption);
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
               "      <a class=\"ui-dynamic-table-filter-search-clear\" href=\"javascript:void(0)\">Clear</a><br/>" +
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
                  function(aEvent) {
                     
                     aEvent.stopPropagation();

                     if ($.ui.keyCode.ENTER == aEvent.which)
                     {
                        methods.private_hideFilter(aEvent, aComponent);
                        return;
                     }
                      
                     //console.log("Key Up");
                     //Get the data
                     var myData        = aData;
                     
                     //If there is currently a time-out, reset it
                     if (myData.searchTimeout != null) 
                     {
                        clearTimeout(myData.searchTimeout);
                     } 
                     
                     //Create a new time out that calls the filterBy method.
                     myData.searchTimeout = setTimeout(function() {
                        
                        //console.log("Searching by string");
                        
                        methods.private_filterBy(aComponent, aColumn, aColumnIndex, aData, aCell);                        
                     }, 150);
                  });       
         
            var myClear            = myPopUp.find(".ui-dynamic-table-filter-search-clear");
            
            myClear.on (
                  "click.dynamicTable", 
                  function(aEvent) {
                  
                     myInput.val("");
                           
                     methods.private_filterBy(aComponent, aColumn, aColumnIndex, aData, aCell);                        
   
                     methods.private_hideFilter(aEvent, aComponent);
                  
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
               "   <div class=\"ui-dynamic-table-filter-date-range-blanks-box\">" +
               "      <input type=\"radio\" class=\"ui-dynamic-table-filter-date-range-blanks\" name=\"date-range-blanks\" value=\"all\"> All" +
               "      <input type=\"radio\" class=\"ui-dynamic-table-filter-date-range-blanks\" name=\"date-range-blanks\" value=\"blanks\"> Blanks" +
               "      <input type=\"radio\" class=\"ui-dynamic-table-filter-date-range-blanks\" name=\"date-range-blanks\" value=\"non-blanks\"> Non-Blanks" +
               "   </div>" +
               "   <div class=\"ui-dynamic-table-filter-date-range-box\">" +
               "      <div> " +
               "         <div style=\"padding-top: 3px; color: #ffffff; font-weight: bold\">Start Date (<a class=\"ui-dynamic-table-filter-date-range-start-clear\" href=\"javascript:void(0)\">Clear</a>):</div> " +
               "         <div class=\"ui-dynamic-table-filter-date-range-start\"></div> " +
               "      </div> " +
               "      <div> " +
               "         <div style=\"paddingR-top: 3px; color: #ffffff; font-weight: bold\">End Date (<a class=\"ui-dynamic-table-filter-date-range-end-clear\" href=\"javascript:void(0)\">Clear</a>):</div> " +
               "         <div class=\"ui-dynamic-table-filter-date-range-end\"></div> " +
               "      </div> " +
               "   </div> " +
               "</div>"
            );         
            
            //Get the date selects
            var mySelects = myPopUp.find(".ui-dynamic-table-filter-date-range-start, .ui-dynamic-table-filter-date-range-end");
            
            //Add the event handler to capture change events
            mySelects.datepicker({
               onSelect : function () {
                  methods.private_filterBy(aComponent, aColumn, aColumnIndex, aData, aCell);
               }
            });
            
            // Apply the blank filter
            var myBlanks = myPopUp.find(".ui-dynamic-table-filter-date-range-blanks")
               .change(function() {

                  myPopUp
                     .find(".ui-dynamic-table-filter-date-range-box")
                     .toggle(myBlanks.filter(":checked").val() == "all");

                  methods.private_filterBy(aComponent, aColumn, aColumnIndex, aData, aCell);
               });

            //Add the event handler to the start clear button.
            myPopUp.find(".ui-dynamic-table-filter-date-range-start-clear").on(
                  "click.dynamicTable", 
                  function(aEvent) {
                  
                      mySelects.filter(".ui-dynamic-table-filter-date-range-start")
                               .datepicker("setDate", null);
                      
                     methods.private_filterBy(aComponent, aColumn, aColumnIndex, aData, aCell);
                  }
            );
            
            //Add the event handler to the end clear button.
            myPopUp.find(".ui-dynamic-table-filter-date-range-end-clear").on(
                  "click.dynamicTable", 
                  function(aEvent) {
                     
                     mySelects.filter(".ui-dynamic-table-filter-date-range-end")
                     .datepicker("setDate", null);
                     
                     methods.private_filterBy(aComponent, aColumn, aColumnIndex, aData, aCell);
                  }
            );
           
            //If we have a current filter set the values.
            if (myCurrentFilter != null)
            {
               if (myCurrentFilter.type == "blanks" || myCurrentFilter.type == "non-blanks") {
                  myBlanks.filter("[value='" + myCurrentFilter.type + "']").prop("checked", true);
               }

               mySelects.filter(".ui-dynamic-table-filter-date-range-start")
                        .datepicker("setDate", myCurrentFilter.hasStart ? methods.private_parseDate(myCurrentFilter.startDate) : null);
               mySelects.filter(".ui-dynamic-table-filter-date-range-end")
                        .datepicker("setDate", myCurrentFilter.hasEnd ? methods.private_parseDate(myCurrentFilter.endDate) : null);
            }
            //Otherwise, clear them.
            else
            {
               myBlanks.filter("[value='all']").prop("checked", true);
               mySelects.filter(".ui-dynamic-table-filter-date-range-start")
                        .datepicker("setDate", null);
               mySelects.filter(".ui-dynamic-table-filter-date-range-end")
                        .datepicker("setDate", null);
            }
         }  
         
         //Display the pop-up.
         myPopUp.css("display", "block");
         //Place it at the bottom of the cell where the filter was invoked on.
         methods.private_positionPopUp(myPopUp, aComponent, aCell);
      },
      
      /**=================================================================================
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
         }
         else
         {
            // Remove all existing event handlers as these get resubscribed later on
            // with new context. We just want to return the raw component.
            myPopUp.find("*").off();
         }

         //Add an event listener that prevents click event from bubbling up
         myPopUp.on("click.dynamicTable", function(aEvent){
            aEvent.stopPropagation();
         });
         
         return myPopUp;
      },

      /**=================================================================================
       * Places a pop-up just below the cell that invoked it but confines it to the grid.
       *================================================================================*/
      private_positionPopUp : function (aPopUp, aComponent, aCell) {

         var myTop = aCell.offset().top + aCell.height() - 1;
         var myLeft = aCell.offset().left;

         var myMaxRight = aComponent.width() + aComponent.offset().left;

         if (myLeft  + aPopUp.width() > myMaxRight) {
            myLeft = myMaxRight - aPopUp.width();
         }

         aPopUp.offset({left: myLeft, top: myTop});
      },
      
      /**=================================================================================
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
       * Adds a specific filter to the chain of filters.
       *================================================================================*/        
      private_filterBy: function(aComponent, aColumn, aColumnIndex, aData, aCell) {
         
         var myField = aColumn.field || aColumnIndex;

         //Go through each of the active filters to see if the column has already one 
         //applied to it. If so remove that.
         for (var i = 0; i < aData.activeFilters.length; i++)
         {
            if (aData.activeFilters[i].field == myField)
            {
               aData.activeFilters.splice(i, 1);
               break;
            }
         }      
         
         var myColumnCell = aComponent.find("#ui-dynamic-table-header-cell-" + aColumnIndex);
         myColumnCell.removeClass("ui-dynamic-table-filtered");
         
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
                  field:         myField,
                  includeBlanks: myIncludeBlanks,
                  values:        myValue,
                  type:          aColumn.filterType
               });
               
               myColumnCell.addClass("ui-dynamic-table-filtered");
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
                  field:         myField,
                  value:         myValue.toLowerCase(),
                  type:          aColumn.filterType
               });
               
               myColumnCell.addClass("ui-dynamic-table-filtered");
            }
         }
         //If we have a date range
         else if (aColumn.filterType == "dateRange")
         {
             //Get the data
             var myStart            = aComponent.find(".ui-dynamic-table-filter-date-range-start").datepicker("getDate");
             var myEnd              = aComponent.find(".ui-dynamic-table-filter-date-range-end").datepicker("getDate");
             var myBlanksOnly       = aComponent.find(".ui-dynamic-table-filter-date-range-blanks:checked").val();
             
             //If there is data, add the filter now
             if (myBlanksOnly != "all") {
                aData.activeFilters.push({
                   field:         myField,
                   type:          myBlanksOnly,
                });

                myColumnCell.addClass("ui-dynamic-table-filtered");
             }
             else if (myStart != null || myEnd != null) {
                aData.activeFilters.push({
                   field:         myField,
                   type:          aColumn.filterType,
                   startDate:     myStart ? myStart.getTime() : methods.private_parseDate('1900-01-01').getTime(),
                   endDate:       myEnd   ? myEnd.getTime()   : methods.private_parseDate('2100-01-01').getTime(),
                   hasStart:      myStart != null,
                   hasEnd:        myEnd   != null
                });
                
                myColumnCell.addClass("ui-dynamic-table-filtered");
             }
         }
         
         //Apply the filter
         methods.private_applyFilter         (aData);
         
         //Applies the current sort again, if there is one
         if (aData.currentSort)
         {
            methods.private_sortBy           (aComponent, aData.currentSort, aData, true);
         }
         
         //Render placeholders
         methods.private_renderPlaceHolders  (aComponent, aData.options.rowHeight, aData.options.pageSize, aData.data.length);
         
         //Render the visible parts of the table 
         methods.private_renderVisible       (aComponent);

         //Re-render the filter list filter
         if (aColumn.filterType == "list" && mySelect.val().indexOf("-show-all") >= 0) {
            methods.private_showFilter       (aComponent, aColumn, aColumnIndex, aData, aCell)
         }
      },
      
      /**=================================================================================
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
               
               if (myFilter.type == "list") {
                  myInclude           = myInclude && (myFilter.values.indexOf(aItem[myFilter.field] + "") > -1 || (myFilter.includeBlanks && aItem[myFilter.field] == null));
               }
               else if (myFilter.type == "search") {
                  myInclude           = myInclude && aItem[myFilter.field] != null && aItem[myFilter.field].toLowerCase().indexOf(myFilter.value) >= 0;
               }
               else if (myFilter.type == "dateRange") {
                  var myDate          = methods.private_parseDate(aItem[myFilter.field]);
                  
                  myInclude           = myInclude && myDate != null 
                                        && myDate.getTime() >= myFilter.startDate 
                                        && myDate.getTime() < myFilter.endDate;
               }
               else if (myFilter.type == "blanks") {
                  myInclude            = myInclude && (aItem[myFilter.field] == null || aItem[myFilter.field] == '');
               }
               else if (myFilter.type == "non-blanks") {
                  myInclude            = myInclude && aItem[myFilter.field] != null && aItem[myFilter.field] != '';
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

      /**=================================================================================
       * Called when a cell gets clicked to dispatch the data and activate the editor
       * if needed.
       *================================================================================*/ 
      private_showSettings : function(aCell, aComponent) {

         methods.private_hideFilter(null, aComponent);

         var myData     = aComponent.data("dynamicTable");
         var myColumns  = myData.options.columns;

         var myHtml = 
            "<div class=\"ui-dynamic-table-filter ui-dynamic-table-settings\">" + 
            "  <ul></ul>" + 
            "</div>";

         var myPopUp = methods.private_getPopUp(
            aComponent,
            ".ui-dynamic-table-settings", 
            myHtml
         );

         var myInnerHtml = "";

         myColumns.forEach(function(aColumn, aIndex) {
            myInnerHtml +=
               "<li>" + 
               "  <label>" + 
               "     <input type=\"checkbox\" class=\"ui-dynamic-table-settings-column\" data-index=\"" + aIndex + "\"" + (aColumn.visible ? " checked" : "") + "> " + 
               aColumn.name + 
               "  </label>" + 
               "</li>";
         })

         myPopUp.find("ul").html(myInnerHtml);

         myPopUp.find(".ui-dynamic-table-settings-column")
            .off("change.dynamicTable")
            .on("change.dynamicTable", function(aEvent) {
               var myCheck       = $(this);
               var myIndex       = myCheck.data("index");
               var myIsChecked   = myCheck.is(":checked");

               myColumns[myIndex].visible = myIsChecked;
               
               myData.options.settingsHandler.saveColumn(myColumns[myIndex]);

               methods.private_renderHeader        (aComponent, myData.options.columns, myData.options.headerHeight);

               //Render placeholders
               methods.private_renderPlaceHolders  (aComponent, myData.options.rowHeight, myData.options.pageSize, myData.data.length);
               
               //Render the visible parts of the table 
               methods.private_renderVisible       (aComponent);
            });

         //Display the pop-up. 
         myPopUp.css("display", "block");
         //Place it at the bottom of the cell where the filter was invoked on.
         methods.private_positionPopUp(myPopUp, aComponent, aCell);
      },
      
      /**=================================================================================
       * Called when a cell gets clicked to dispatch the data and activate the editor
       * if needed.
       *================================================================================*/ 
      private_handleCellClick: function(aEvent) {
      
         var myComponent                 = aEvent.data.component;
         var myData                      = myComponent.data("dynamicTable");
         var myCell                      = $(aEvent.currentTarget);

         var myId                        = myCell.attr("id");
         
         if (myId.indexOf("ui-dynamic-table-page-counter-") === 0) {
            var myRow = myId.replace("ui-dynamic-table-page-counter-", "");
            var myTableLocation = [myRow, 0]
         }
         else {
            var myTableLocation          = myId.replace("ui-dynamic-table-page-cell-", "")
                                               .split("-");
         }

         methods.private_activateEditor  (myComponent, myCell, myTableLocation);
         
         methods.private_selectRow(myComponent, myCell, myTableLocation);
      },

      /**=================================================================================
       * Called when a cell gets doublecklicked to dispatch the data.
       *================================================================================*/ 
      private_handleCellDoubleClick: function(aEvent) {
      
         var myComponent                 = aEvent.data.component;
         var myData                      = myComponent.data("dynamicTable");
         var myCell                      = $(aEvent.currentTarget);
         var myId                        = myCell.attr("id");
         
         var myTableLocation             = myId.replace("ui-dynamic-table-page-cell-", "")
                                               .split("-");         
         if (myId.indexOf("ui-dynamic-table-page-counter-") === 0) {
            var myRow = myId.replace("ui-dynamic-table-page-counter-", "");
            var myTableLocation = [myRow, 0]
         }
         else {
            var myTableLocation          = myId.replace("ui-dynamic-table-page-cell-", "")
                                               .split("-");
         }

         myComponent.trigger({
            type: "rowDoubleClick", 
            row: myData.data[myTableLocation[0]]
         });             
      },
      
      /**=================================================================================
       * Called when a row gets selected either by mouse or keyboard to dispatch the data
       * and ensure the cell is in view.
       *================================================================================*/ 
      private_selectRow: function (aComponent, aCell, aTableLocation) {
      
         var myData              = aComponent.data("dynamicTable");
         var myRowNumber         = parseInt(aTableLocation);

         myData.location         = aTableLocation;

         var myRowTop            = myRowNumber * myData.options.rowHeight;
         var myRowBottom         = myRowTop + myData.options.rowHeight;

         var myContainer         = aComponent.children(".ui-dynamic-table-private-row-container");
         var myContainerBottom   = (myContainer.scrollTop() + myContainer.height()) - myData.options.headerHeight;
         var myContainerTop      = myContainer.scrollTop();
         
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

         methods.private_highlightSelected(aComponent)

         //Trigger the row select event
         aComponent.trigger({
            type: "rowSelect", 
            row: myData.data[myData.location[0]]
         });
      },

      /**=================================================================================
       * Called to do the actual highlighting of selected elements.
       *================================================================================*/ 
      private_highlightSelected : function(aComponent) {

         var myData        = aComponent.data("dynamicTable");
         var myLocation    = myData.location;

         if (!myLocation) {
            return;
         }

         var myCell        = aComponent.find("#ui-dynamic-table-page-cell-" + myLocation[0] + "-" + myLocation[1]);

         //Mark the current row as selected
         aComponent.find("tr.selected").removeClass("selected");
         
         var myRow               = myCell.closest("tr");
         myRow.addClass          ("selected");
         
      },

      /**=================================================================================
       * Processes key stokes
       *================================================================================*/ 
      private_handleKey: function(aEvent) {
         
         var myKey               = aEvent.which;
         
         var myComponent         = aEvent.data.component;
            
         // If this grid does not have the focus ignore the events
         if (!myComponent.is(":focus") && myComponent.find(":focus").length == 0) {
            return;
         }
         
         var myData              = myComponent.data("dynamicTable");
         
         // If we have no data there is no point in continuing...
         if (!myData.data) {
            return;
         }
         
         var myLocation          = myData.location;
         var myLocationChanged   = false;

         if (!myLocation)
         {
            //TODO the "1" as a cell is not logical, but gives trouble if set to 0
            myLocation           = [0, 1];
         }
         
         // Capture basic up and down movement
         if (myKey == $.ui.keyCode.UP ||
             myKey == $.ui.keyCode.DOWN) {
            if (myKey == $.ui.keyCode.UP) {
               myLocation[0]        = parseInt(myLocation[0]) - 1;
               
               if (myLocation[0] < 0)
               {
                  myLocation[0]     = 0;
               }
               
               myLocationChanged    = true;
            }
            else if (myKey == $.ui.keyCode.DOWN) {
               myLocation[0]        = parseInt(myLocation[0]) + 1;
               
               if (myLocation[0] >= myData.data.length)
               {
                  myLocation[0]     = myData.data.length - 1;
               }
               
               myLocationChanged    = true;
            }
         }
         // Search by content and select first matching
         else {
            var myInput = String.fromCharCode(myKey);

            if (myInput) {
               if (!myData.inputBuffer) {
                  myData.inputBuffer = new $.fn.dynamicTable.inputBuffer(1000);
               }

               myData.inputBuffer.append(myInput);

               var myBuffer = myData.inputBuffer.getBuffer().toUpperCase();

               var myCurrentIndex = -1;
               var myBestIndex = 9999999999999;

               for (var i = 0; i < myData.data.length; i++) {
                  var myIndex       = (i + parseInt(myLocation[0])) % myData.data.length;
                  var myRow         = myData.data[myIndex];
                  var myTestString  = null;

                  if (Array.isArray(myRow)) {
                     myTestString = myRow.join(",").toUpperCase();
                  }
                  else {
                     myTestString = JSON.stringify(myData.data[i]).toUpperCase();
                  }

                  var myTempIndex = myTestString.indexOf(myBuffer);

                  if (myTempIndex >= 0 && myTempIndex < myBestIndex) {
                     myCurrentIndex    = myIndex;
                     myBestIndex       = myTempIndex;
                  }
               }

               if (myCurrentIndex >= 0) {
                  myLocation[0] = myCurrentIndex;
                  myLocationChanged = true;
               }

            }
         }

         if (myLocationChanged) {
            methods.private_selectRow(
                  myComponent, 
                  $("#ui-dynamic-table-page-cell-" + myLocation[0] + "-" + myLocation[1]), 
                  myLocation
            );
         }
      },
      
      /**=================================================================================
       * Called when a cell gets seclect to activate the editor if it exists.
       *================================================================================*/ 
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
         
         if (myColumn && myColumn.editor)
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
      
      /**=================================================================================
       * Called when an editor finishes with editing to persist the data.
       *================================================================================*/ 
      private_editorCallback: function(aEditor, aType, aValue, aState){
         
         var myComponent               = aEditor.closest(".ui-dynamic-table");
         
         if (aType == "edit")
         {
            var myCell                 = myComponent.find("#ui-dynamic-table-page-cell-" + aState.rowIndex + "-" + aState.columnIndex);
            myCell.text(aValue);
            aState.row[aState.column.field || aState.columnIndex] = aValue;

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
                  //console.log("Checking column: " + i);
                  
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
      
      /**=================================================================================
       * Called when a row gets checked
       *================================================================================*/ 
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
         
         if ($(aEvent.target).is(":checked"))
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
       * Sets the data and column definitions for the table
       *================================================================================*/   
      data: function (aData, aColumns, aKeepFilters){
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
            if (!myData.activeFilters || !aKeepFilters) {
               myData.activeFilters = [];
            }
            
            //Get the options
            var myOptions        = myData.options;

            //Default the columns if they where specified.
            if (aColumns)
            {
               for (var i = 0; i < aColumns.length; i++)
               {
                  aColumns[i]    = $.extend({width:100, filterType: "list"}, aColumns[i]);
                  myOptions.settingsHandler.updateColumn(aColumns[i]);
               }
               
               myOptions.columns = aColumns;
            }

            // Apply existing filters
            methods.private_applyFilter         (myData);

            // Make sure the row container is properly sized
            methods.private_initRowContainer    ($(this), myOptions);
            methods.private_handleResize        ({data : {component : $(this)}});

            //Render the header
            methods.private_renderHeader        ($(this), myOptions.columns, myOptions.headerHeight);
            
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
       * Removes all filters from the dynamic table 
       *================================================================================*/            
      clearAllFilters : function() {
         return this.each(function() {

            var myContainer      = $(this);
            var myData           = myContainer.data("dynamicTable");

            myData.activeFilters = [];

            //Apply the filter
            methods.private_applyFilter         (myData);
            
            //Applies the current sort again, if there is one
            if (myData.currentSort)
            {
               methods.private_sortBy           (myContainer, myData.currentSort, myData, true);
            }

            //Render placeholders
            methods.private_renderPlaceHolders  (myContainer, myData.options.rowHeight, myData.options.pageSize, myData.data.length);
            
            //Render the visible parts of the table 
            methods.private_renderVisible       (myContainer);

            //Remove all filtered highlights
            myContainer
               .find(".ui-dynamic-table-filtered")
               .removeClass("ui-dynamic-table-filtered");
         })
      },
      
      /**=================================================================================
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
      
      /**=================================================================================
       * Returns all rows that have been checked.
       *================================================================================*/ 
      checkedRows : function () {
         var myData           = this.first().data("dynamicTable");
         return (myData.checkedRows != null ? myData.checkedRows : []);
      },

      /**=================================================================================
       * Returns an object that contains the basic counts of the table
       *================================================================================*/ 
      counts : function () {

         var myData           = this.first().data("dynamicTable");
         var myRows           = myData.data;
         var myOriginalRows   = myData.originalData;

         return {
            total: (myOriginalRows ? myOriginalRows.length : 0),
            filtered: (myRows ? myRows.length : 0)
         };

      },

      /**=================================================================================
       * Can be used to update options.
       *================================================================================*/ 
      option : function (aOption, aValue) {
         return this.each(function() {
            var myData              = $(this).data("dynamicTable");
            myData.options[aOption] = aValue;
         });
      },
      
      /**=================================================================================
       * Generates a static version of the Grid to an div and sends the command to
       * print that div. Hides the rest of the page.
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
    * The plugin method that gets added to the jQuery method object.
    *===================================================================================*/
   $.fn.dynamicTable = function(aMethod) {
      
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

   /**====================================================================================
    * Below are settings handlers which processe changes to setting such as column width 
    * and column visibility and allow them to be stored for the next time the user returns
    *===================================================================================*/

   /**====================================================================================
    * The default handler is a crude implementation using the local storage.
    *
    * @param {String} aPrefix
    *    The prefix to be used in from of the ID of the column, this is to avoid 
    *    collisions when using the localStorage.
    * @returns {DefaultSettingsHandler}
    *    Returns a new instance of a default settings handler.
    *===================================================================================*/
   $.fn.dynamicTable.defaultSettingsHandler = function(aPrefix) {

      var DefaultSettingsHandler = function(aPrefix) {

         var prefix = aPrefix || "dynamic-table.";
         var cache = {};

         function _extractId(aColumn) {
            var myId = (aColumn.id || aColumn.field || aColumn.name);

            if (myId) {
               return prefix + myId;
            }
         }

         this.saveColumn = function (aColumn) {
            if (!window.localStorage) {
               return;
            }

            var myId = _extractId(aColumn);

            if (!myId) {
               return;
            }

            var mySettings = {
               width : aColumn.width,
               visible : aColumn.visible
            };

            cache[myId] = mySettings;
            
            try {
               window.localStorage.setItem(myId, JSON.stringify(mySettings));
            }
            catch (aError) {
               console.log(aError);
            }
         }

         this.updateColumn = function(aColumn) {
            if (!window.localStorage) {
               return;
            }

            var myId = _extractId(aColumn);

            if (!myId) {
               return;
            }

            var mySettings = cache[myId];

            if (!mySettings) {
               var mySettingsString = null;
               
               try {
                  mySettingsString = window.localStorage.getItem(myId);
               }
               catch(aError) {
                  console.log(aError);
               }
               
               if (mySettingsString) {
                  mySettings = JSON.parse(mySettingsString);
                  cache[myId] = mySettings;
               }
            }

            if (mySettings) {
               aColumn.width = mySettings.width;
               aColumn.visible = mySettings.visible;
            }
         };
      };

      return new DefaultSettingsHandler(aPrefix);
   };

   /**====================================================================================
    * This settings handler does nothing when settings are required.
    *
    * @returns {Object}
    *    Returns an object which has the correct interface, but does nothing.
    *===================================================================================*/
   $.fn.dynamicTable.noopSettingsHandler = function() {
      return {
         saveColumn : function() {},
         updateColumn : function() {}
      }
   }

   /**====================================================================================
    * This settings handler is a wrapper which can be used to supply custom callbacks to
    * handle the setting yourself.
    *
    * @param {Function} aSaveColumn
    *    The callback to be called whenever a column is to be saved. The function takes
    *    one argument which is the column object.
    * @param {Function} aUpdateColumn
    *    The callback to be called whenever column data is to be updated from storage.The 
    *    function takes one argument which is the column object.
    * @returns {CallbackSettingsHandler}
    *    A new instance of a handler with your callbacks attached.
    *===================================================================================*/
   $.fn.dynamicTable.callbackSettingsHandler = function(aSaveColumn, aUpdateColumn) {
      var CallbackSettingsHandler = function(aSaveColumn, aUpdateColumn) {
         this.saveColumn   = aSaveColumn   || function() {};
         this.updateColumn = aUpdateColumn || function() {};
      };

      return new CallbackSettingsHandler(aSaveColumn, aUpdateColumn);
   }

   /**====================================================================================
    * This class/function allows the buffering of an input string until a certain time 
    * of inactivity is reached. At that point the buffer gets cleared.
    *
    * @param {Number} aTimeout
    *    The timeout in milliseconds after which the buffer clears
    *===================================================================================*/
   $.fn.dynamicTable.inputBuffer = function(aTimeout) {

      var buffer = "";
      var timeout = null;

      this.append = function(aString) {
         if (timeout) {
            clearTimeout(timeout)
         }

         buffer   += aString;
         timeout  = setTimeout(function() {
            buffer = "";
         }, aTimeout);
      }

      this.getBuffer = function() {
         return buffer;
      }
   }

})(jQuery);