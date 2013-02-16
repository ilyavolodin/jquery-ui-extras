jquery-ui-extras
================

Plugins for jQuery UI

## Rotatable

Mostly works. Supports IE6+, FF, Chrome and Safari. Supports handles, helper (partially). Three events: start, rotate, stop.

Known issues: In IE6-8 when you display handles with negative margins, when the element is rotated, any part of the handle that's outside of the element will be cut off. Sometimes starting rotation on already rotated element might be a bit jumpy.
Destroy command, will destroy rotatable but will not remote rotatable class from the element.

## Draggable overlap

Will notify you every time draggable object is overlapping with something else.

Takes one parameter (items) and a callback (overlap). Items can take jQuery selector, a function, or jQuery object. If you are passing a function, then a function has to return an array of elements with the following signature: { top: int, right: int, bottom: int, left: int, element: jQuery object }.
overlap callback will be called with two parameters: first one is an array of objects, second one is an element that was dragged.
Each element in the array of objects will be overlapping with draggable element, it's signature will contain: { top: int, right: int, bottom: int, left: int, element: jQuery object, overlapRect: object with overlap coordinates }

## Draggable guidelines

Will snap to guidelines provided as well as will keep draggable object away from other objects

Sample signature:
````JavaScript
guidelines: {
    items: $(".someItems"),
    margins: $(".someItems"),
    snapTolerance: 10,
    snap: this.showSnaps
}
````
