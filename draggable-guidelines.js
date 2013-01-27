$.ui.plugin.add("draggable", "guidelines", {
    start: function (event, ui)
    {
        //format for snap guidelines is { position: x/y, snapSide: [top, right, bottom, left], element: $(), size: {top, left}, offset: {top, left} }
        //format for snap margins is { position: x/y, snapSide: [top, right, bottom, left], element: $(), size: {top, left}, offset: {top, left} }

        var i = $(this).data("draggable"), o = i.options;
        if (typeof (o.guidelines.items) === "function")
        {
            i.items = o.guidelines.items.apply(this);
        }
        else if ($.isArray(o.guidelines.items))
        {
            i.items = o.guidelines.items;
        }
        if (typeof (o.guidelines.margins) === "function")
        {
            i.margins = o.guidelines.margins.apply(this);
        }
        else if ($.isArray(o.guidelines.margins))
        {
            i.margins = o.guidelines.margins;
        }

        i.dragElementSize = { width: $(this).width(), height: $(this).height() };
    },
    drag: function (event, ui)
    {
        if (event.shiftKey)
        {
            return;
        }
        var data = $(this).data("draggable");
        var options = data.options;
        var snapTolerance = options.guidelines.snapTolerance ? options.guidelines.snapTolerance : 2;
        var currentItem = { top: ui.offset.top, right: data.dragElementSize.width + ui.offset.left, bottom: data.dragElementSize.height + ui.offset.top, left: ui.offset.left };
        var sides = ["top", "right", "bottom", "left"];
        var snaps = [];
        for (var i = 0, l = sides.length; i < l; i++)
        {
            var sideSnaps = $.grep(data.items, function(item) {
                return item.snapSide === sides[i];
            });
            var marginSnaps = $.grep(data.margins, function (item) {
                return item.snapSide === sides[i];
            });
            var j, len;
            for (j = 0, len = sideSnaps.length; j < len; j++)
            {
                if (Math.abs(currentItem[sides[i]] - sideSnaps[j].position) <= snapTolerance)
                {
                    //found a guideline for a snap
                    switch (sides[i])
                    {
                        case "top":
                            ui.position.top = data._convertPositionTo("relative", { top: sideSnaps[j].position, left: 0 }).top;
                            break;
                        case "bottom":
                            ui.position.top = data._convertPositionTo("relative", { top: sideSnaps[j].position, left: 0 }).top - data.dragElementSize.height;
                            break;
                        case "right":
                            ui.position.left = data._convertPositionTo("relative", { left: sideSnaps[j].position, top: 0 }).left - data.dragElementSize.width;
                            break;
                        case "left":
                            ui.position.left = data._convertPositionTo("relative", { left: sideSnaps[j].position, top: 0 }).left;
                            break;
                        default:
                            break;
                    }
                    snaps.push(sideSnaps[j]);
                }
            }

            for (j = 0, len = marginSnaps.length; j < len; j++)
            {
                var oppositeSide = (i + 2) > 3 ? (i - 2) : (i + 2);
                if (Math.abs(currentItem[sides[oppositeSide]] - marginSnaps[j].position) <= snapTolerance)
                {
                    if (sides[i] === "top" || sides[i] === "bottom")
                    {
                        if (Math.min(currentItem.right, marginSnaps[j].offset.left + marginSnaps[j].size.width) - Math.max(currentItem.left, marginSnaps[j].offset.left) <= 0)
                        {
                            continue;
                        }
                    }
                    else
                    {
                        if (Math.min(currentItem.bottom, marginSnaps[j].offset.top + marginSnaps[j].size.height) - Math.max(currentItem.top, marginSnaps[j].offset.top) <= 0)
                        {
                            continue;
                        }
                    }
                    //found margin for a snap
                    switch (sides[i])
                    {
                        case "top":
                            ui.position.top = data._convertPositionTo("relative", { top: marginSnaps[j].position - snapTolerance, left: 0 }).top - data.dragElementSize.height;
                            break;
                        case "bottom":
                            ui.position.top = data._convertPositionTo("relative", { top: marginSnaps[j].position + snapTolerance, left: 0 }).top;
                            break;
                        case "right":
                            ui.position.left = data._convertPositionTo("relative", { left: marginSnaps[j].postion + snapTolerance, top: 0 }).left;
                            break;
                        case "left":
                            ui.position.left = data._convertPositionTo("relative", { left: marginSnaps[j].position - snapTolerance, top: 0 }).left - data.dragElementSize.width;
                            break;
                        default:
                            break;
                    }
                }
            }
        }

        //clear old guides
        $(".draggable-snap-guidelines").remove();

        var draggableOffset = ui.helper.offset();

        //render guides
        $.each(snaps, function ()
        {
            var snappedToOffset = this.offset;
            var snappedToSize = this.size;
            var snappedToSides = { top: snappedToOffset.top, right: snappedToOffset.left + snappedToSize.width, bottom: snappedToOffset.top + snappedToSize.height, left: snappedToOffset.left };
            var draggableSides = { top: draggableOffset.top, right: draggableOffset.left + data.dragElementSize.width, bottom: draggableOffset.top + data.dragElementSize.height, left: draggableOffset.left };
            if (snappedToSides[this.snapSide] !== draggableSides[this.snapSide])
            {
                return;
            }

            var snapGuideline = $("<div class='draggable-snap-guidelines'></div>");
            this.element.parent().append(snapGuideline);

            var guidePosition;

            switch (this.snapSide)
            {
                case "top":
                    guidePosition = data._convertPositionTo("relative", { top: draggableOffset.top, left: Math.min(snappedToOffset.left + snappedToSize.width, draggableOffset.left + data.dragElementSize.width) });
                    snapGuideline.css({
                        "top": guidePosition.top,
                        "left": guidePosition.left,
                        "width": Math.abs(Math.max(snappedToOffset.left, draggableOffset.left) - Math.min(snappedToOffset.left + snappedToSize.width, draggableOffset.left + data.dragElementSize.width))
                    });
                    snapGuideline.addClass("draggable-snap-guidelines-horizontal");
                    break;
                case "bottom":
                    guidePosition = data._convertPositionTo("relative", { top: draggableOffset.top + data.dragElementSize.height, left: Math.min(snappedToOffset.left + snappedToSize.width, draggableOffset.left + data.dragElementSize.width) });
                    snapGuideline.css({
                        "top": guidePosition.top,
                        "left": guidePosition.left,
                        "width": Math.abs(Math.max(snappedToOffset.left, draggableOffset.left) - Math.min(snappedToOffset.left + snappedToSize.width, draggableOffset.left + data.dragElementSize.width))
                    });
                    snapGuideline.addClass("draggable-snap-guidelines-horizontal");
                    break;
                case "left":
                    guidePosition = data._convertPositionTo("relative", { top: Math.min(snappedToOffset.top + snappedToSize.height, draggableOffset.top + data.dragElementSize.height), left: draggableOffset.left });
                    snapGuideline.css({
                        "top": guidePosition.top,
                        "left": guidePosition.left,
                        "height": Math.abs(Math.max(snappedToOffset.top, draggableOffset.top) - Math.min(snappedToOffset.top + snappedToSize.height, draggableOffset.top + data.dragElementSize.height))
                    });
                    snapGuideline.addClass("draggable-snap-guidelines-vertical");
                    break;
                case "right":
                    guidePosition = data._convertPositionTo("relative", { top: Math.min(snappedToOffset.top + snappedToSize.height, draggableOffset.top + data.dragElementSize.height), left: draggableOffset.left + data.dragElementSize.width });
                    snapGuideline.css({
                        "top": guidePosition.top,
                        "left": guidePosition.left,
                        "height": Math.abs(Math.max(snappedToOffset.top, draggableOffset.top) - Math.min(snappedToOffset.top + snappedToSize.height, draggableOffset.top + data.dragElementSize.height))
                    });
                    snapGuideline.addClass("draggable-snap-guidelines-vertical");
                    break;
                default:
                    break;
            }
        });
        if (options.guidelines.snap)
        {
            options.guidelines.snap.call(this, snaps, event.target);
        }
    },
    stop: function (event, ui)
    {
        $(".draggable-snap-guidelines").remove();
    }
});