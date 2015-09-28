# Dynamic Table - jQuery Plug-in

## Introduction

The *Dynamic Table* is a table that displays data in a similar way to a spreadsheet
but allows the data to be loaded from your backend and control over what can be
edited and how it is being saved.

It allows advanced filtering and sorting as well as interaction with your 
application.

## Features

 * Spreadsheet feel
 * Load data via AJAX
 * Paged scrolling (handles easily tens of thousands of lines)
 * Filters and Sorting
 * Editable fields
 * Events on select
 * jQuery UI based
 
## Prerequisites

 * jQuery
 * jQuery UI
 * moment.js (if you are planning on displaying dates)
 
If you are using Bootstrap the JQuery-Bootstrap project is recommended to make 
the components look more like Bootstrap.
 
## Getting Started

[Working sample](sample/index.html)
that goes with this introduction.

### 0) Import

First import the `dynamic-table.jquery.js` and any dependencies.

### 1) Initialize Plug-in

To initialize the component select an empty element, preferably a `<div>`
and apply the jQuery plug-in:

```javascript
    $("#sample-grid").dynamicTable({
        fillParent : false,
        showCounter: true
    });
```

Available options are:

 * `fillParent` (default: `true`): Automatically keeps the grid the same size as 
   the parent object this is usefull for any sort of full screen applications.
 * `showCounter` (default: `false`): Displays a counter column as the first 
   column, which gives the row number.
 * `showCheck` (default: `false`): Displays a checkmark at the beginning of the 
   row, that allows the selection of multiple rows. Only works when the counter
   column is also visible.
 * `rowHeight` (default: `35`): The height of rows in pixels.


### 2) Define Columns

Next you define the columns as an array of column definitions

```javascript
var myColumns = [{
                    name       : "Name",
                    type       : "string",
                    visible    : true,
                    filterType : "search",
                    width      : 200
                },
                [...]
                ]
```

Available options are:

 * `name`: The name of the column.
 * `type` (default: `"string"`) : The datatype of the columns. Options are: `string`, `date`, `number`
   and `boolean`.
 * `visible` (default: `false`): Whether or not the column is visible or not. This allows for
   hiddend data columns, such as ID fields etc.
 * `filterType` (default: `list`): The type of filter to display for the column.
   Options are: `list`, `search` and `dateRange`.
 * `width` (default: `100`): The width of the column in pixels.
 * `format`: The format used for columns, such as date an number columns. The
   format is based on the moment.js format.
 * `editor`: Instance of the editor used to allow this cell to be edited.
 * `cssClass` : Specify a css class that is applied to this column. If a string is 
    supplied the class is applied to all columns. Alternatively a function can be supplied
    that returns the class dynamically. The function is of the following format 
    `function(aColumn, aValue, aDisplayValue)`. The `aColumn` parameter
    gets passed the column data, the`aValue` parameter gets passed the original value
    and the `aDisplayValue` gets passed the string which is to be rendered.
    
   
### 3) Getting the data

You can get the data using an AJAX call (`$.getJSON()`) or generate it in your
JavaScript.

The format expected is an Array, that contains an array for every row. The
grid will map every element in the row array to the column at the same index.

To hide items in the array, add invisible columns to the column list.

Sample data:

```javascript
var myData = [
                [10001, "Bill Smith", new Date(1956, 3, 12), "United States", "Texas", "English"],
                [10002, "Michael Jones", new Date(1975, 7, 23), "United States", "Florida", "English"],
                [10003, "Heinz Mayer", new Date(1972, 8, 2), "Germany", "Bayern", "German"],
                [10004, "Mary Miller", new Date(1981, 1, 6), "United States", "California", "English"],
                [10005, "Jose Gonzalez", new Date(1959, 1, 6), "Mexico", null, "Spanish"],
             ];
```

### 4) Putting it all together

Now that we have our element on the page, our columns and our data we just need
to load it all into the table:

```
$("#sample-grid").dynamicTable("data", myData, myColumns);
```

## Interacting with the table

To allow your application to interact with the table, it dispatches two events:

 * `rowSelect`: Dispatched when the row gets selected either by keyboard
   interaction or single click.
 * `rowDoubleClick`: Dispached when the row gets double-clicked.
 
The `event` parameter gets a `row` property attached, which contains the original
data of the affected row.

```javascript
$("#sample-grid").on("rowSelect", function(aEvent) {
    $("#selected-data").html("You selected <strong>" + aEvent.row[1] + "</strong>");     
});  
```

## Editing content

So far we have only dealt with content loaded from the database that the user
cannot interact with. 

This is done by *editors*. These are not natively part of the plugin and come as
separate plug-in: `dynamic-table-editor.jquery.js`

So first you have to import this file.

To instanciate an editor call the following:

```javascript
var myEditor = $("<div/>").dynamicTableEditor({
    type : "text",
    editHandler: function(aData) {
        // Save here:
        //$.post(
        //    ...
        //);
    }
});
```

The following options are available:

 * `type` (default: `text`): The type of editor. Available types are:
    * `text`: Simple text field.
    * `list`: Select list
    * `date`: Datepicker
 * `editHandler`: The function that gets called when an edit is complete. This
   is the point where you save the data back to the server or wherever.
   This function gets called with two arguments: 
    * `value`: The value of the editor
    * `context`: Object that contains data on the current column and row.

For `list` editors only:

 * `values`: A list of values to be rendered into the list.
 * `firstBlank` (default: `true`): Whether to render the first item of the list as blank item.
 * `idProperty`: If the values are a complex object, this defines which property
   is the ID that gets returned when selected.
 * `nameProperty`: If the values are a complex object, this defines which property
   is the name that gets shown

Sample `list` editor:

```javascript
var myEditor = $("<div/>").dynamicTableEditor({
    type : "list",
    values : [{id : 1, name : "Option #1"}, {id : 2, name : "Option #2"}, {id : 3, name : "Option #3"}],
    idProperty : "id",
    nameProperty : "name",
    editHandler: function(aData) {
        // ...
    }
});
```

 
