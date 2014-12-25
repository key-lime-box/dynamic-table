# Dynamic Grid - JQuery Plug-in

## Introduction

The dynamic grid was developed as part of an internal project, as we could not 
quite find a javascript datagrid to suit our needs. What we were looking for was 
a grid that handles very similar to an Spreadsheet application, but was more 
able to be integrated into the general application flow.

I am now open sourcing it as I hope it is of use to other developers on the web.

## Features

 * Spreadsheet feel
 * Load data via AJAX
 * Paged scrolling (handles easily tens of thousands of lines)
 * Filters and Sorting
 * Editable fields
 * Events on select
 * jQuery UI based
 
## Prerequirements

 * jQuery
 * jQuery UI
 * moment.js
 
If you are using Bootstrap the JQuery-Bootstrap project is recommended to make 
the components look more like Bootstrap.
 
## Getting Started

### 1) Initialize Plug-in

To initialize the component select an empty element, preferably a `<div>`
and apply the jQuery plug-in:

```javascript
    // Initialize table
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
 * `type` (default: `"string"`) : The datatype of the columns. Options are: `string`, `date`, 'number'
   and `boolean`.
 * `visible` (default: `false`): Whether or not the column is visible or not. This allows for
   hiddend data columns, such as ID fields etc.
 * `filterType` (default: `list`): The type of filter to display for the column.
   Options are: `list`, `search` and `dateRange`.
 * `width` (default: `100`): The width of the column in pixels.
 * `format`: The format used for columns, such as date an number columns. The
   format is based on the moment.js format.