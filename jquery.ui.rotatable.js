(function($)
{
    $.widget("ui.rotatable", $.ui.mouse, {
        version: "1.10.0",
        widgetEventPrefix: "rotate",
        options: {
            addClasses: true,
            appendTo: "parent",
            cursor: "auto",
            handle: false,
            helper: "original",
            opacity: "false",
           
            //callbacks
            rotate: null,
            start: null,
            stop: null
        },
        _create: function()
        {
            if (this.options.addClasses)
            {
                this.element.addClass("ui-rotatable");
            }
            if (this.options.disabled)
            {
                this.element.addClass("ui-rotatable-disabled");
            }

            this.handles = this.options.handles || (!$('.ui-rotatable-handle', this.element).length ? "e,s,se" : { n: '.ui-rotatable-n', e: '.ui-rotatable-e', s: '.ui-rotatable-s', w: '.ui-rotatable-w', se: '.ui-rotatable-se', sw: '.ui-rotatable-sw', ne: '.ui-rotatable-ne', nw: '.ui-rotatable-nw' });
            if (this.handles.constructor == String)
            {

                if (this.handles == 'all')
                {
                    this.handles = 'n,e,s,w,se,sw,ne,nw';
                }
                var n = this.handles.split(","); this.handles = {};

                for (var i = 0; i < n.length; i++)
                {

                    var handle = $.trim(n[i]), hname = 'ui-rotatable-' + handle;
                    var axis = $('<div class="ui-rotatable-handle ui-resizable-handle ' + hname + '"></div>');

                    // Apply zIndex to all handles - see #7960
                    axis.css({ zIndex: this.options.zIndex });

                    //Insert into internal handles object and append to element
                    this.handles[handle] = axis;
                    this.element.append(axis);
                }
            }

            this._mouseInit();
        },
       
        _destroy: function()
        {
            this.element.removeClass("ui-rotatable ui-rotatable-rotating ui-rotatable-disabled");
            this._mouseDestroy();
        },
       
        _mouseCapture: function(event)
        {
            var o = this.options;

            var handle = false;
            if (o.handles)
            {
                for (var i in this.handles)
                {
                    if ($(this.handles[i])[0] == event.target)
                    {
                        handle = true;
                    }
                }
            }
            else
            {
                handle = true;
            }

            return !this.options.disabled && handle;
        },
       
        _mouseStart: function(event)
        {
            var o = this.options;

            this.helper = this._createHelper(event);

            this.helper.addClass("ui-rotatable-rotating");

            this._cacheHelperAngle();

            this.originalAngle = this.angle = this._getRotationAngle();

            if (this._trigger("start", event) === false)
            {
                this._clear();
                return false;
            }

            this._cacheHelperProportions();

            this._cacheCenterPoint();

            this.mouseStartPosition = { 'x': event.pageX, 'y': event.pageY };

            this._mouseDrag(event, true);

            return true;
        },
        
        _mouseDrag: function(event, noPropagation)
        {
            this.angle = parseInt(this._generateAngle(event) * (180 / Math.PI) - 90);

            this.angle = this.angle < 0 ? 360 + this.angle : this.angle;

            if (!noPropagation)
            {
                var ui = this._uiHash();
                if (this._trigger("rotate", event, ui) === false)
                {
                    this._mouseUp({});
                    return false;
                }

                this.angle = ui.angle;
            }

            var me = this;

            var setIEAngle = function (angle)
            {
                //fix IE8 bug where handles stay unrotated. This helps, but only partually
                //any part of the handles that are outside of the rotatable element
                //will be cut off. Might need to wrap element into container and rotate container
                if (me.helper.css("z-index") === "auto")
                {
                    me.helper.css("z-index", 1);
                }
                this.helper = me.helper[0];
                var rad = Math.PI / 180;
                this._angle = angle;
                    
                var _rad = angle * rad;
                costheta = Math.cos(_rad);
                sintheta = Math.sin(_rad);
                this.helper.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11='1.0', sizingmethod='auto expand')";
                var fil = this.helper.filters.item("DXImageTransform.Microsoft.Matrix");
                fil.M11 = costheta;
                fil.M12 = -sintheta;
                fil.M21 = sintheta;
                fil.M22 = costheta;
                this.helper.style.marginLeft = -(this.helper.offsetWidth - this.helper.clientWidth) / 2 + "px";
                this.helper.style.marginTop = -(this.helper.offsetHeight - this.helper.clientHeight) / 2 + "px";
            };

            var prefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' ');
            var supportTranform = false;
            for (var i = 0; i < prefixes.length; i++)
            {
                if (document.createElement('div').style[prefixes[i]] !== undefined)
                {
                    supportTranform = true;
                    break;
                }
            }


            if (!supportTranform)
            {
                setIEAngle(this.angle);
            }

            //set angle
            this.helper.css({
                '-webkit-transform': 'rotate(' + this.angle + 'deg)',
                '-moz-transform': 'rotate(' + this.angle + 'deg)',
                '-ms-transform': 'rotate(' + this.angle + 'deg)',
                '-o-transform': 'rotate(' + this.angle + 'deg)',
                'transform': 'rotate(' + this.angle + 'deg)'
            });

            return false;
        },
        
        _mouseStop: function(event)
        {
            if (this._trigger("stop", event) !== false)
            {
                this._clear();
            }
            return false;
        },
        
        _mouseUp: function(event)
        {
            return $.ui.mouse.prototype._mouseUp.call(this, event);
        },
        
        _getHandle: function(event)
        {
            var handle = !this.options.handles || !$(this.options.handles, this.element).length ? true : false;
            $(this.options.handles, this.element).find("*").addBack().each(function() {
                if (this === event.target)
                {
                    handle = true;
                }
            });

            return handle;
        },
        
        _createHelper: function(event)
        {
            var o = this.options,
                helper = $.isFunction(o.helper) ? $(o.helper.apply(this.element[0], [event])) : (o.helper === "clone" ? this.element.clone().removeAttr("id") : this.element);

            if(!helper.parents("body").length) {
                helper.appendTo((o.appendTo === "parent" ? this.element[0].parentNode : o.appendTo));
            }

            if(helper[0] !== this.element[0] && !(/(fixed|absolute)/).test(helper.css("position"))) {
                helper.css("position", "absolute");
            }

            return helper;
        },
        
        _cacheHelperProportions: function() {
            this.helperProportions = {
                width: this.helper.outerWidth(),
                height: this.helper.outerHeight()
            };
        },

        _cacheCenterPoint: function ()
        {
            var helperOffset = this.helper.offset();
            this.centerPoint = {
                x: helperOffset.left + this.helperProportions.width / 2,
                y: helperOffset.top + this.helperProportions.height / 2
            };
        },

        _cacheHelperAngle: function() {
            this.helperAngle = this._getRotationAngle();
        },

        _generateAngle: function(event) {
            //this is where we figure out new angle
            var mouse_coords = { 'x': event.pageX, 'y': event.pageY };
            return angle = this._positionToAngle(mouse_coords);
        },
        
        _clear: function() {
            this.helper.removeClass("ui-rotatable-rotating");
            if(this.helper[0] !== this.element[0] && !this.cancelHelperRemoval) {
                this.helper.remove();
            }
            this.helper = null;
            this.cancelHelperRemoval = false;
        },

        // From now on bulk stuff - mainly helpers

        _trigger: function(type, event, ui) {
            ui = ui || this._uiHash();
            $.ui.plugin.call(this, type, [event, ui]);
            //The absolute position has to be recalculated after plugins
            if(type === "rotate") {
                //this.positionAbs = this._convertPositionTo("absolute");
            }
            return $.Widget.prototype._trigger.call(this, type, event, ui);
        },

        _positionToAngle: function(position) {
            var x = position.x - this.centerPoint.x,
                y = position.y - this.centerPoint.y,
                hyp = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
                angle = Math.acos(x / hyp);
            if (y < 0)
            {
                angle = 2 * Math.PI - angle;
            }
            return angle;
        },

        plugins: {},

        _uiHash: function() {
            return {
                helper: this.helper,
                angle: this.angle,
                originalAngle: this.originalAngle
            };
        },

        _getRotationAngle: function()
        {
            var angle;
            var matrix = this.helper.css("-webkit-transform") ||
                this.helper.css("-moz-transform") ||
                this.helper.css("-ms-transform") ||
                this.helper.css("-o-transform") ||
                this.helper.css("transform");
            if (matrix && matrix !== 'none')
            {
                var values = matrix.split('(')[1].split(')')[0].split(',');
                var a = values[0];
                var b = values[1];
                angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
            }
            else
            {
                angle = 0;
            }
            return angle;
        }
    });

    $.ui.plugin.add("rotatable", "snap", {
        rotate: function(event, ui)
        {
            var i = $(this).data("rotatable"), o = i.options;
            var angle = o.snap.angle ? o.snap.angle : 15;
            if (!o.snap.angle)
            {
                return;
            }
            var snapTolerance = o.snap.tolerance ? o.snap.tolerance : 2;
            var diff = Math.abs(ui.angle % angle);
            if (diff === 0 || diff < snapTolerance || angle - diff < snapTolerance)
            {
                var newAngle = diff === 0 ? ui.angle : diff < snapTolerance ? ui.angle - diff : ui.angle + angle - diff;
                ui.angle = newAngle;
            }
        }
    });
})(jQuery);
