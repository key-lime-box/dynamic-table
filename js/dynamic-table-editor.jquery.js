/**=======================================================================================
 * RESOURCE: dynamic-table-editor.jquery.js
 * 
 * This plugin extends the dynamic-table plugin by providing the code to configure
 * cell editors, which are essentially components which make it so that a cell can be
 * edited.  
 *======================================================================================*/
(function($) {

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
                                    type        : "text",
                                    firstBlank  : true
                              }, aOptions);
   
         //Set up each object 
         return this.each(function() {
            
            //Init variables
            var myEditor            = $(this);
            var myField             = null;
            var myData              = {};
            
            //Set the data object and store the options there
            myEditor.data           ("dynamicTableEditor", myData);
            myData.options          = myOptions;
            
            //Configure the style of the editor
            myEditor.addClass       ("ui-dynamic-table-editor");
            myEditor.css            ("display", "none");
            myEditor.css            ("position", "absolute");
            
            //If the type of editor is text...
            if (myOptions.type == "text")
            {
               //..append a text area
               myField              = $("<textarea class=\"ui-dynamic-table-editor-field\"/>");
               myEditor.append(myField);
            }
            //If the type is list...
            else if (myOptions.type == "list")
            {
               //Create a new list box
               var myValues         = myOptions.values;   
               var myHtml           = "<select class=\"ui-dynamic-table-editor-field\">";
               
               //Insert a first blank entry if specified in the options.
               if (myOptions.firstBlank)
               {
                  myHtml           += "   <option value=\"\"></option>";
               }
               
               //Add the values from the values option.
               for (var i = 0; i < myValues.length; i++)
               {
                  var myId          = (myOptions.idProperty    ? myValues[i][myOptions.idProperty]    : myValues[i]);
                  var myName        = (myOptions.nameProperty  ? myValues[i][myOptions.nameProperty]  : myValues[i]);
               
                  myHtml           += "   <option value=\""+ myId + "\">" + myName + "</option>";
               }
               
               myHtml              += "</select>";
               
               //Convert to jQuery object and append 
               myField              = $(myHtml);
               
               myEditor.append(myField);
            }
            //If the type is list...
            else if (myOptions.type == "date")
            {
               //..append a text area
               myField = $("<input class=\"ui-dynamic-table-editor-field\"/>").datepicker({
                  dateFormat: "dd-M-yy",
                  constraintInput: true
               });
               
               myEditor.append(myField);               
            }
            //If the type is list...
            else if (myOptions.type == "time")
            {
               //..append a text area
               myField = $("<input class=\"ui-dynamic-table-editor-field\"/>").timepicker({
                  timeFormat: "hh:mm TT",
                  constraintInput: true
               });
               
               myEditor.append(myField);               
            }
            //If the type is list...
            else if (myOptions.type == "dateTime")
            {
               //..append a text area
               myField = $("<input class=\"ui-dynamic-table-editor-field\"/>").datetimepicker({
                  dateFormat: "dd-M-yy",
                  timeFormat: "hh:mm TT",
                  constraintInput: true
               });
               
               myEditor.append(myField);               
            }
            //If the type is toggle...
            else if (myOptions.type == "toggle")
            {
               //..append clickable area
               myField              = $("<input type=\"hidden\" class=\"ui-dynamic-table-editor-field\"/>");
               
               myEditor.append(myField);  
               
               myEditor.on (
                  "click.dynamicTableEditor",
                  function (aEvent) {
                     methods.private_handleToggle($(this));
                  }
               )
            }
            
            //Add a change handler
            myField.on(
                  "change.dynamicTableEditor",
                  {component: myEditor},
                  function (aEvent) {
                     methods.private_saveData(aEvent.data.component);
                  }
            );
            
            //Add a keydown handler.
            myField.on(
                  "keydown.dynamicTableEditor",
                  {component: myEditor},
                  function (aEvent) {
                     
                     //console.log("Key Pressed: " + aEvent.which);
                     
                     //Initialize variables
                     var myEditor            = aEvent.data.component;
                     
                     var myReturn            = true;
                     var mySave              = false;
                     var myType              = null;
                     
                     //If the enter key was pressed...
                     if ($.ui.keyCode.ENTER == aEvent.which)
                     {
                        //... check whether shift was held or not and set the direction
                        //accordingly.
                        if (!aEvent.shiftKey) {
                           myType         = "down";
                        }
                        else {
                           myType         = "up";
                        }
                        //Prevent any further bubbling of the keyup event 
                        myReturn             = false;
                        //Dispatch a save event 
                        mySave               = true;
                     }
                     
                     //If the tab key was pressed 
                     else if ($.ui.keyCode.TAB == aEvent.which)
                     {
                        //... check whether shift was held or not and set the direction
                        //accordingly.
                        if (!aEvent.shiftKey) {
                           myType         = "right";
                        }
                        else {
                           myType         = "left";
                        }
                        //Prevent any further bubbling of the keyup event 
                        myReturn             = false;
                        //Dispatch a save event 
                        mySave               = true;
                     }
                     
                     //If the data should be saved, do that now.
                     if (mySave) 
                     {
                        methods.private_saveData(myEditor);
                     }
                     
                     //If we have a type...
                     if (myType != null)
                     {
                        var myField             = myEditor.children(".ui-dynamic-table-editor-field");
                        var myData              = myEditor.data("dynamicTableEditor");
                        var myState             = myData.state;
                        
                        //... and a table callback
                        if (myData.tableCallback)
                        {
                           //Call this now. This will notify the parent dynamic-table of
                           //the keyboard action.
                           myData.tableCallback(myEditor, myType, myField.val(), myState);
                        }
                     }
                     
                     aEvent.stopPropagation();
                     
                     return myReturn;
                  }
            );
            //Add a keypress handler.
            myField.on(
                  "keypress.dynamicTableEditor",
                  {component: myEditor},
                  function (aEvent) {
                     
                     if ($.ui.keyCode.TAB == aEvent.which ||
                           $.ui.keyCode.ENTER == aEvent.which)
                     {    
                        return false;
                     }
                     
                     return true;
                     
            });
         });      
      },

      /**=================================================================================
       * OPERATION: activate
       * 
       * Called by the parent table to activate the editor with all the data needed
       * to display the right data and position the editor
       *================================================================================*/      
      activate: function (aRectangle, aValue, aRow, aColumn, aRowIndex, aColumnIndex){
         return this.each(function () {
            
            //console.log("Editor activated");
            //console.log(aRectangle);
            
            //Initialize the variables
            var myEditor            = $(this);
            var myField             = myEditor.children(".ui-dynamic-table-editor-field");
            var myData              = myEditor.data("dynamicTableEditor");
            var myOptions           = myData.options;
            
            var myTop               = aRectangle.top - 1;
            var myLeft              = aRectangle.left;
            
            var myWidth             = aRectangle.width + 1;
            var myHeight            = aRectangle.height + 1;
            
            //Save the current state for later reference.
            myData.state = {
                  row:           aRow,
                  column:        aColumn,
                  rowIndex:      aRowIndex,
                  columnIndex:   aColumnIndex
            };            
            
            //Save the original value for later comparison
            myData.originalValue    = aValue;
            
            //If we have a text field simply set the text to the value
            if (myOptions.type === "text")
            {
               myField.val(aValue);
            }
            //If we have a list field...
            else if (myOptions.type === "list")
            {
               var myValues         = myOptions.values;
               var myIdValue        = null;
               
               //Loop through the values and select the matching one
               if (aValue)
               {
                  for (var i = 0; i < myValues.length; i++)
                  {
                     if ((myOptions.nameProperty != null && myValues[i][myOptions.nameProperty] == aValue) ||
                           myValues[i] == aValue)
                     {
                        if (myOptions.idProperty != null)
                        {
                           myIdValue      = myValues[i][myOptions.idProperty];
                        }
                        else
                        {
                           myIdValue      = myValues[i];
                        }
                        break;
                     }
                  }
               }
               
               myField.val(myIdValue);
               
               myTop       = myTop - 1;
            }
            else if (myOptions.type === "date" || myOptions.type === "time" || myOptions.type === "dateTime")
            {
               myField.val(aValue);
            }
            else if (myOptions.type === "toggle")
            {
               myField.val(aValue);
               
               methods.private_handleToggle(myEditor);
            }
            
            //Show the editor
            myEditor.css   ("display", "block");
            
            //Place and size the editor
            myEditor.offset({
               top: myTop, 
               left: myLeft
            });
            
            myEditor.css({
               width  : myWidth,
               height : myHeight
            });
            
            //Size the field
            myField .css({
               width  : myWidth,
               height : myHeight
            });
            
            //Set the focus on the field.
            myField.focus();
         });
      },

      /**=================================================================================
       * OPERATION: callback
       * 
       * Called by the parent table to subscribe a callback.
       *================================================================================*/       
      callback: function(aCallback) {
         return this.each(function(){
            $(this).data("dynamicTableEditor").tableCallback = aCallback;
         });
      },
      
      /**=================================================================================
       * OPERATION: private_handleToggle
       * 
       * Does method handles the special case where the editor toggles.
       *================================================================================*/
      private_handleToggle: function (aEditor) {
         
         var myData           = aEditor.data("dynamicTableEditor");
         var myOptions        = myData.options;
         var myField          = aEditor.children(".ui-dynamic-table-editor-field");
         
         var myValue          = myField.val();
         var myValues         = myOptions.values;
         
         if (myValues.length > 0) {
            
            var myIndex          = myValues.indexOf(myValue);
            
            myIndex++;
            
            if (myIndex >= myValues.length) {
               myIndex           = 0;
            }
            
            myField.val          (myValues[myIndex]);
            
            methods.private_saveData(aEditor);
         }
      },
      
      /**=================================================================================
       * OPERATION: private_saveData
       * 
       * Does all the needed dispatching to save the data.
       *================================================================================*/       
      private_saveData: function (aEditor) {
      
         //Init variables
         var myField          = aEditor.children(".ui-dynamic-table-editor-field");
         var myData           = aEditor.data("dynamicTableEditor");
         var myOptions        = myData.options;
         var myState          = myData.state;
         
         //console.log("Saving data");
         
         var myValue          = myField.val();
         
         //If we have an ID property, get the actual name value to be passed back as 
         //display value to the grid.
         if (myOptions.idProperty != null)
         {
            for (var i = 0; i < myOptions.values.length; i++)
            {
               if (myOptions.values[i][myOptions.idProperty] == myValue)
               {
                  myValue  = myOptions.values[i][myOptions.nameProperty];
               }
            }
         }         

         //Check if the value actually changed
         if ($.trim(myValue) != $.trim(myData.originalValue))
         {
            myData.originalValue = myValue;
            
            //If we have a table callback, call that now.
            if (myData.tableCallback)
            {
               myData.tableCallback(aEditor, "edit", myValue, myState);
            }
            
            //If we have an edit handler, call it now.
            if (myOptions.editHandler)
            {
               myOptions.editHandler(myField.val(), myState);
            }      
         }
      }
      
   };
   
   /**====================================================================================
    * OPERATION: dynamicTableEditor
    * 
    * The plugin method that gets added to the jQuery method object.
    *===================================================================================*/         
   $.fn.dynamicTableEditor = function(aMethod) {
      
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
         $.error( 'Method ' +  aMethod + ' does not exist on jQuery.dynamicTableEditor' );
      }    

   };
})(jQuery);