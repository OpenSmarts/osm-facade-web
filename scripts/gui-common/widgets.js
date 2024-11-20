( function () {
    window.SCROLLING = false;
    function scroll(event) {
        window.SCROLLING = true;
    }
    function unscroll(event) {
        window.SCROLLING = false;
    }
    window.addEventListener("scroll", scroll);
    window.addEventListener("scrollend", unscroll);
})();

/**
 * The base Widget class.  Represents an interactible
 * value-producing object in the browser, like an input.
 * @template {*} T
*/
class Widget extends EventTarget{
    /** @type {object} */
    #value = {};

    /** @type {HTMLElement} */
    element = null;

    /** @type {boolean} */
    #inactive = false;
    
    /**
     * Construct a new widget
     */
    constructor ()
    {
        super();
        this.element = document.createElement("div");
        this.element.classList.add("widget");

        this.element.addEventListener("mousedown", this.#emitMouseEvent.bind(this));
        this.element.addEventListener("mouseup", this.#emitMouseEvent.bind(this));
        this.element.addEventListener("mousemove", this.#emitMouseEvent.bind(this));
        this.element.addEventListener("mouseleave", this.#emitMouseEvent.bind(this));
        this.element.addEventListener("mouseenter", this.#emitMouseEvent.bind(this));

        this.element.addEventListener("click", this.#emitMouseEvent.bind(this));

        this.element.addEventListener("touchstart", this.#emitTouchEvent.bind(this));
        this.element.addEventListener("touchend", this.#emitTouchEvent.bind(this));
        this.element.addEventListener("touchmove", this.#emitTouchEvent.bind(this));
        this.element.addEventListener("touchcancel", this.#emitTouchEvent.bind(this));

        this.element.addEventListener("contextmenu", this.#emitContextEvent.bind(this));
    }

    /**
     * Get a specific property of the widget, or "value" if none is supplied.
     * @param {string} [id]
     * @returns {*}
     */
    get(id = "value")
    {
        return this.#value[id];
    }

    /** @param {T} v */
    set(v)
    {
        this.#value["value"] = v;
        this.#emitChangeEvent("value");
    }

    /**
     * @param {string} id
     * @param {*} v
     * @param {boolean} [emit]
     */
    setId(id, v, emit = false)
    {
        this.#value[id] = v;
        if (emit)
            this.#emitChangeEvent(id);
        else if (id == "value")
            this.update();
    }

    /** @param {boolean} i */
    setInactive (i)
    {
        this.element.classList.toggle("inactive", i);
        this.#inactive = i;
    }

    /** @returns {boolean} */
    getInactive ()
    {
        return this.#inactive;
    }

    #emitChangeEvent(id)
    {
        this.dispatchEvent(new CustomEvent("change", {detail: {widget: this, changed: id}}));
    }

    /** @param {MouseEvent} event */
    #emitMouseEvent(event)
    {
        if (this.#inactive)
            this.dispatchEvent(new CustomEvent("inactive", {detail: {widget: this, event: new MouseEvent(event.type, event)}}));
        else
            this.dispatchEvent(new MouseEvent(event.type, event));
    }

    /** @param {TouchEvent} event */
    #emitTouchEvent(event)
    {
        //if (window.SCROLLING)
        //    return;

        if (event.type == "touchstart")
            this.element.classList.add("touch");
        else if (event.type == "touchend" || event.type == "touchcancel")
            this.element.classList.remove("touch");

        if (this.#inactive)
            this.dispatchEvent(new CustomEvent("inactive", {detail: {widget: this, event: new TouchEvent(event.type, event)}}));
        else
            this.dispatchEvent(new TouchEvent(event.type, event));

        event.preventDefault();
    }

    /** @param {Event} event */
    #emitContextEvent(event)
    {
        if (this.#inactive)
            this.dispatchEvent(new CustomEvent("inactive", {detail: {widget: this, event: new Event(event.type, event)}}));
        else
            this.dispatchEvent(new Event(event.type, event));
        event.preventDefault();
    }

    update() {}
}

/**
 * Represents a basic button widget
 * @extends Widget<boolean>
*/
class WidgetButton extends Widget
{
    /** @type {number} */
    #pressing = 0;

    #touching = {count: 0};

    #gone = 0;

    #bound = null;

    constructor (tv = true, fv = false)
    {
        super();
        this.element.classList.add("button");
        this.addEventListener("mousedown", this.#press);
        this.addEventListener("mouseup", this.#unpress);
        this.addEventListener("mouseleave", this.#leave);
        this.addEventListener("mouseenter", this.#enter);
        this.addEventListener("touchstart", this.#touchstart);
        this.addEventListener("touchend", this.#touchend);
        this.#bound = this.#unpress.bind(this);
        this.setId("true", tv);
        this.setId("false", fv);
        this.set(fv);
    }

    /** @param {MouseEvent} event */
    #press(event)
    {
        this.#pressing |= (1 << event.button);
        this.set(this.get("true"));
    }

    #unpress (event)
    {
        if (((1 << event.button) & this.#pressing) == 0)
            return;

        this.#pressing -= (1 << event.button);
        if (this.#pressing == 0)
        {
            this.set(this.get("false"));
            if (this.#gone)
            {
                this.#gone = 0;
                window.removeEventListener("mouseup", this.#bound);
            }
        }
    }

    /** @param {MouseEvent} event */
    #leave(event)
    {
        if (this.#pressing == 0)
            return;
        this.#gone = 1;
        window.addEventListener("mouseup", this.#bound);
    }

    /** @param {MouseEvent} event */
    #enter(event)
    {
        if (this.primed == 0)
            return;
        this.#gone = 0;
        window.removeEventListener("mouseup", this.#bound);
    }

    /**
     * @param {TouchEvent} event 
     */
    #touchend(event)
    {
        for(let i of event.changedTouches)
        {
            if (this.#touching[i.identifier] == 1)
            {
                delete this.#touching[i.identifier];
                this.#touching.count--;
            }
        }

        if (this.#touching.count == 0)
            this.set(this.get("false"));
    }

    /**
     * @param {TouchEvent} event 
     */
    #touchstart(event)
    {
        if (this.#touching.count == 0)
            this.set(this.get("true"));

        for(let i of event.changedTouches)
        {
            this.#touching.count++;
            this.#touching[i.identifier] = 1;
        }
    }

    setId(id, v, emit = false)
    {
        if (id == "false" || id == "true")
        {
            if (this.get() == this.get(id))
                super.setId("value", v);
        }
        super.setId(id, v, emit);
    }
}

/**
 * A toggle widget, similar to a WidgetCheckbox, but meant
 * to be used for on/off power states.
 * @extends Widget<*>
 */
class WidgetToggle extends Widget
{
    /** @type {number} */
    #primed = 0;

    /** @type {number} */
    #gone = 0;

    #bound = null;

    constructor (value = false, tv = true, fv = false)
    {
        super();
        this.element.classList.add("button");
        this.element.classList.add("toggle");
        this.addEventListener("mousedown", this.#prime);
        this.addEventListener("mouseup", this.#toggle);
        this.addEventListener("mouseleave", this.#leave);
        this.addEventListener("mouseenter", this.#enter);
        this.addEventListener("change", this.update);
        this.addEventListener("touchend", this.#touchend);
        this.#bound = this.#toggle.bind(this);
        super.setId("false", fv);
        super.setId("true", tv);
        this.set(value);
    }

    /** @param {MouseEvent} event */
    #prime(event)
    {
        this.#primed |= (1 << event.button);
    }

    /** @param {MouseEvent} event */
    #toggle(event)
    {
        if (this.#gone)
        {
            this.#primed = 0;
            this.#gone = 0;
            window.removeEventListener("mouseup", this.#bound);
        }
        if (((1 << event.button) & this.#primed) == 0)
            return;

		if (this.get() == this.get("true"))
        	this.set(this.get("false"));
		else
			this.set(this.get("true"));
		
		this.update();
        this.#primed -= (1 << event.button);
    }

	update()
	{
        this.element.classList.toggle("active", this.get() == this.get("true"));
	}

    /** @param {MouseEvent} event */
    #leave(event)
    {
        if (this.#primed == 0)
            return;
        this.#gone = 1;
        window.addEventListener("mouseup", this.#bound);
    }

    /** @param {MouseEvent} event */
    #enter(event)
    {
        if (this.#primed == 0)
            return;
        this.#gone = 0;
        window.removeEventListener("mouseup", this.#bound);
    }

    /** @param {TouchEvent} event */
    #touchend(event)
    {
        if (event.changedTouches.length < 1)
            return;

        let rect = this.element.getBoundingClientRect();

        for (let i of event.changedTouches)
        {
            if (i.clientX < rect.right &&
                i.clientX > rect.left &&
                i.clientY > rect.top &&
                i.clientY < rect.bottom
            ) {
                if (this.get() == this.get("true"))
                    this.set(this.get("false"));
                else
                    this.set(this.get("true"));
                return;
            }
        }
    }

    setId(id, v, emit = false)
    {
        if (id == "false" || id == "true")
        {
            if (this.get() == this.get(id))
                super.setId("value", v);
        }
        super.setId(id, v, emit);
    }
}

/**
 * Effectively the same as a WidgetToggle, just with a more
 * "checkbox" look and feel
 * @extends WidgetToggle
 */
class WidgetCheckbox extends WidgetToggle {

    constructor(value = false, tv = true, fv = false)
    {
        super(value, tv, fv);
        this.element.classList.remove("toggle");
        this.element.classList.add("checkbox");
    }
}

/**
 * Base class for widgets where mouse movement should be considered
 * whenever the mouse is within the widget bounds.  Helps
 * to make sure that if the mouse starts clicking and then moves
 * somewhere outside the widget, the widget still picks up on that
 * mouse activity until the "mouseup" event occurs.
 * @extends Widget<T>
 * @template T
 */
class WidgetDragable extends Widget
{
    /** @type {number} */
    #primed = 0;

    /** @type {number} */
    #gone = 0;

    /** @type {(e: MouseEvent) => void} */
    #m_up = null;
    /** @type {(e: MouseEvent, b: number) => void} */
    #m_move = null;

    #touches = {count: 0};

    /** @type {number} */
    #max_t;


    /**
     * Constructor
     */
    constructor (max_t = 2)
    {
        super();

        this.#m_up = this.#unpress.bind(this);
        this.#m_move = this.#move.bind(this);
        
        this.addEventListener("mousedown", this.#press);
        this.addEventListener("mousemove", this.#move);
        this.addEventListener("mouseup", this.#unpress);
        this.addEventListener("mouseleave", this.#leave);
        this.addEventListener("mouseenter", this.#enter);

        this.addEventListener("touchstart", this.#touch);
        this.addEventListener("touchend", this.#touch);
        this.addEventListener("touchmove", this.#touch);
        this.addEventListener("touchcancel", this.#touch);

        this.#max_t = max_t;
    }

    /** @param {MouseEvent} event */
    #press(event)
    {
        this.#primed |= (1 << event.button);
        this.#move(event);
    }

    /** @param {MouseEvent} event */
    #unpress(event)
    {
        if (((1 << event.button) & this.#primed) == 0)
            return;
        this.#primed -= (1 << event.button);
        this.#move(event);
        if (this.#primed == 0)
        {
            if (this.#gone)
            {
                this.#gone = 0;
                window.removeEventListener("mouseup", this.#m_up);
                window.removeEventListener("mousemove", this.#m_move);
            }
        }
    }

    /** @param {MouseEvent} event */
    #move(event)
    {
        this.move(event, this.#primed, this.#gone);
    }

    /** @param {MouseEvent} event */
    #leave(event)
    {
        if (this.#primed == 0)
            return;
        this.#gone = 1;
        window.addEventListener("mouseup", this.#m_up);
        window.addEventListener("mousemove", this.#m_move);
    }

    /** @param {MouseEvent} event */
    #enter(event)
    {
        if (this.#primed == 0)
            return;
        this.#gone = 0;
        window.removeEventListener("mouseup", this.#m_up);
        window.removeEventListener("mousemove", this.#m_move);
    }

    /**
     * @param {TouchEvent} event 
     */
    #touch(event)
    {
        if (event.type == "touchstart")
        {
            if (this.#touches.count < this.#max_t)
            {
                this.#touches[event.changedTouches[0].identifier] = 1;
                this.#touches.count++;
            }
            else
                return;
        }

        if (event.type == "touchend")
        {
            if (this.#touches[event.changedTouches[0].identifier] == 1)
            {
                delete this.#touches[event.changedTouches[0].identifier];
                this.#touches.count--;
            }
        }

        let out = [];
        for(let t of event.changedTouches)
        {
            if (this.#touches[t.identifier] == 1)
                out.push(t);
        }

        this.touch(event.type, out);
    }
}

/**
 * A basic slider widget.  Handles both vertical and horizontal sliders.
 * @extends WidgetDragable<number>
 */
class WidgetSlider extends WidgetDragable
{
    /** @type {HTMLElement} */
    #detail = null;
    /** @type {(e: HTMLElement, v: number, p: number) => void} */
    #u_detail = null;

    /** @type {number} */
    #tmpNum = 0;


    /**
     * Constructor
     * @param {number} [max] Value the slider represents at maximum
     * @param {number} [min] Value the slider represents at minimum
     * @param {number} [step] Step amount
     * @param {number} [precision] Decimal places to keep
     * @param {boolean} [percent] Whether to show a percentage instead of the raw number
     */
    constructor (value = 5, min = 1, max = 10, step = 0.1, precision = 1, percent = false)
    {
        super(1);
        this.element.classList.add("slider");
        let fill = document.createElement("div");
        fill.classList.add("fill");
        this.element.appendChild(fill);

        this.#detail = document.createElement("div");
        this.#detail.classList.add("detail");
        this.element.appendChild(this.#detail);

        this.#u_detail = this.#update_detail.bind(this);

        this.addEventListener("change", this.#change);

        super.setId("max", max);
        super.setId("min", min);
        super.setId("step", step);
        super.setId("prec", precision);
        super.setId("perc", percent);
        this.set(value);
    }

    #common_move(x, y)
    {
        let rect = this.element.getBoundingClientRect();
        let top = 0, bot = 0, point = 0;
        if (this.element.classList.contains("h"))
        {
            top = rect.right;
            bot = rect.left;
            point = x;
        }
        else
        {
            top = rect.bottom;
            bot = rect.top;
            point = top - y + bot;
        }

        let min = this.get("min"), max = this.get("max"), step = this.get("step");
        if (point < bot && this.#tmpNum != min)
            this.#tmpNum = min;
        else if (point > top && this.#tmpNum != max)
            this.#tmpNum = max;
        else if (bot < point && point < top)
        {
            let v = ((point - bot) / (top - bot)) * (max - min) + min;
            let r = v % step;
            v -= v % step;
            if (r >= step / 2)
                v += step;
            this.#tmpNum = v;
        }
        this.update();
    }

    /** 
     * @param {MouseEvent} event
     * @param {number} btns
     * @param {boolean} gone
     */
    move(event, btns, gone)
    {
        if (btns == 0)
        {
            if (event.type == "mouseup")
                this.set(this.#tmpNum);
            return;
        }

        this.#common_move(event.clientX, event.clientY);
    }

    /**
     * @param {"touchstart" | "touchend" | "touchmove"} type 
     * @param {Touch[]} touches 
     */
    touch(type, touches)
    {
        if (type == "touchend")
        {
            this.set(this.#tmpNum);
        }

        if (touches.length < 1)
            return;

        this.#common_move(touches[0].clientX, touches[0].clientY);
    }

    #change ()
    {
        this.#tmpNum = this.get();
        this.update();
    }

    update()
    {
        let min = this.get("min"), max = this.get("max"), perc = this.get("perc");
        if (this.#tmpNum < min || max < this.#tmpNum)
            this.#tmpNum = Math.min(Math.max(this.#tmpNum, min), max);
        let percent = (this.#tmpNum - min) / (max - min);

        this.#u_detail(this.#detail, this.#tmpNum, percent, perc);
        this.element.style.setProperty("--percent", percent);
    }

    #update_detail(el, val, percent)
    {
        let perc = this.get("perc"), prec = this.get("prec");
        if (perc)
            el.innerText = `${Math.trunc(percent * 100)}%`;
        else
            el.innerText = `${Math.trunc(Math.pow(10, prec) * val) / Math.pow(10, prec)}`
    }

    setDetailUpdater(updater)
    {
        this.#u_detail = updater;
    }

    setId(id, v, emit = false)
    {
        super.setId(id, v, emit);
        if (id == "max" || id == "min" || id == "step")
        {
            this.update();
        }
    }
}

/**
 * Like a slider, but shows color temperature instead.
 * @extends WidgetSlider
 */
class WidgetColorTemp extends WidgetSlider 
{
    /** @type {Color} */
    static ORANGE = Color.from_rgb(250, 160, 100);
    /** @type {Color} */
    static WHITE = new Color(1, 1, 1);
    /** @type {Color} */
    static BLUE = Color.from_rgb(190, 200, 255);

    constructor (value = 2700)
    {
        super(value, 2700, 6000, 100);
        this.element.classList.replace("slider", "color-temp");

        this.setDetailUpdater(this.#update_detail.bind(this));
    }

    /**
     * Update the detail for the color temp slider
     * @param {HTMLElement} el 
     * @param {number} val 
     * @param {number} percent 
     */
    #update_detail(el, val, percent)
    {
        let out = null;
        if (percent < 0.85)
            out = WidgetColorTemp.ORANGE.interpolate(WidgetColorTemp.WHITE, percent / 0.85);
        else
            out = WidgetColorTemp.WHITE.interpolate(WidgetColorTemp.BLUE, (percent - 0.85) / 0.15);
        this.element.style.setProperty("--detail", out.rgb());
    }
}

/**
 * Like a slider, but shows light/dark scale instead.
 * @extends WidgetSlider
 */
class WidgetColorLight extends WidgetSlider 
{
    /** @type {Color} */
    WHITE = new Color(1, 1, 1);
    /** @type {Color} */
    BLACK = new Color(0, 0, 0);

    constructor (value = 1)
    {
        super(value, 0, 1, 0.01);
        this.element.classList.replace("slider", "color-light");

        this.setDetailUpdater(this.#update_detail.bind(this));
    }

    /**
     * Update the detail for the color temp slider
     * @param {HTMLElement} el 
     * @param {number} val 
     * @param {number} percent 
     */
    #update_detail(el, val, percent)
    {
        let out = this.BLACK.interpolate(this.WHITE, percent);
        this.element.style.setProperty("--detail", out.rgb());
    }
}

/**
 * Lets the user easily pick a color based on the HSV color wheel.
 * Pair with a WidgetColorLight to allow for arbitrary lightness values
 * as well.
 * @extends WidgetDragable<Color>
 */
class WidgetColorWheel extends WidgetDragable
{
    /** @type {Color} */
    #tmpColor = null;
    /** @type {HTMLElement} */
    #detail = null;

    /**
     * Constructor
     * @param {Color} color
     */
    constructor (value = Color.from_rgb(255, 255, 255))
    {
        super(1);
        this.element.classList.add("color-wheel");

        this.#detail = document.createElement("div");
        this.#detail.classList.add("detail");
        this.element.appendChild(this.#detail);

        this.addEventListener("change", this.update);
        this.set(value);
    }

    #common_move(x, y)
    {
        let rect = this.element.getBoundingClientRect();
        
        // Points
        let tmpX = x - rect.width / 2;
        let tmpY = rect.bottom - y + rect.top - rect.height / 2;
        
        // Percents
        tmpX = (tmpX - rect.left) / ((rect.right - rect.left) / 2);
        tmpY = (tmpY - rect.top) / ((rect.bottom - rect.top) / 2);

        // Normalized
        let mag = Math.sqrt(tmpX * tmpX + tmpY * tmpY);
        if (mag > 1)
        {
            tmpX /= mag;
            tmpY /= mag;
            mag = 1;
        }

        this.element.style.setProperty("--pos-x", tmpX);
        this.element.style.setProperty("--pos-y", tmpY);
        this.#update_detail(tmpX, tmpY, mag);
    }

    /** 
     * @param {MouseEvent} event
     * @param {number} btns
     */
    move(event, btns)
    {
        if (btns == 0)
        {
            if (event.type == "mouseup")
                this.set(this.#tmpColor);
            return;
        }

        this.#common_move(event.clientX, event.clientY);
    }

    /**
     * @param {"touchstart" | "touchend" | "touchmove"} type 
     * @param {Touch[]} touches 
     */
    touch(type, touches)
    {
        if (type == "touchend")
        {
            this.set(this.#tmpColor);
        }

        if (touches.length < 1)
        {
            return;
        }

        this.#common_move(touches[0].clientX, touches[0].clientY);
    }

    update ()
    {
        this.#tmpColor = this.get();

        let m = this.#tmpColor.hsv_mag();
        let a = this.#tmpColor.hsv_angle();

        this.element.style.setProperty("--detail", this.#tmpColor.rgb());
        this.element.style.setProperty("--pos-x", Math.cos(a) * m);
        this.element.style.setProperty("--pos-y", Math.sin(a) * m);
    }

    #update_detail(x, y, mag)
    {
        if (x == 0)
        {
            if (y > 0)
                this.#tmpColor = Color.from_hsv(Math.PI / 2, mag, 1);
            else
                this.#tmpColor = Color.from_hsv(-Math.PI / 2, mag, 1);
        }
        else if (x < 0)
            this.#tmpColor = Color.from_hsv(Math.atan(y / x) + Math.PI, mag, 1);
        else
            this.#tmpColor = Color.from_hsv(Math.atan(y / x), mag, 1);

        this.element.style.setProperty("--detail", this.#tmpColor.rgb());
    }
}

/**
 * @typedef {object} ThermSpec
 * @property {number} temp
 * @property {number} gague
 */

/**
 * @extends Widget<ThermSpec>
 */
class WidgetThermostat extends Widget
{
    /** @type {HTMLElement} */
    #gague = null;

    /** @type {HTMLElement} */
    #temp = null;

    /**
     * Constructor
     * @param {number} value Current set point
     * @param {number} gague Current temperature being read from sensor(s)
     * @param {number} [dev] The deviation of the arch (how far in degrees (temperature) from the middle to each end of the arc)
     * @param {Color} [cold_col] The color the arch will display when in "cold" temperatures
     * @param {Color} [temp_col] The color the arch will display when in "temperate" temperatures
     * @param {Color} [warm_col] The color the arch will display when in "hot" temperatures
     * @param {number} [ct] The point at which we swap from cold to temperate
     * @param {number} [tw] The point at which we swap from temperate to warm
     */
    constructor(
        value,
        gague,
        dev = 7,
        cold_col = Color.from_rgb(0, 133, 255),
        temp_col = Color.from_rgb(18, 229, 82),
        warm_col = Color.from_rgb(255, 149, 0),
        ct = -2,
        tw = 2
    ) {
        super();

        this.element.classList.add("thermostat");
        this.element.appendChild(document.createElement("arch"));

        this.#temp = document.createElement("temp");
        this.element.appendChild(this.#temp);

        this.#gague = document.createElement("gague");
        this.element.appendChild(this.#gague);

        this.addEventListener("change", this.update);

        super.setId("deviation", dev);
        super.setId("cold", cold_col);
        super.setId("temp", temp_col);
        super.setId("warm", warm_col);
        super.setId("ct", ct);
        super.setId("tw", tw);
        super.setId("gague", gague);
        this.set(value);
    }

    update()
    {
        /** @type {ThermSpec} */
        let temp = this.get(), gague = this.get("gague");
        this.#gague.innerText = `${Math.fround(gague)}`;
        this.#temp.innerText = `${Math.fround(temp)}°`;

        // Generate a percentage relative to the deviation
        let div = (gague - temp) / this.get("deviation");
        // Normalize into range of 0 - 1
        div = div / 2 + 0.5;
        div = Math.min(1, Math.max(div, 0));
        
        this.element.style.setProperty("--percent", div);

        /** @type {Color} */
        let color = null;
        let r = gague - temp;
        if (r >= this.get("tw"))
            color = this.get("warm");
        else if (r >= this.get("ct"))
            color = this.get("temp");
        else
            color = this.get("cold");
        this.element.style.setProperty("--detail", color.rgb());
    }

    setId(id, v, emit = false)
    {
        super.setId(id, v, emit);
        if (id == "deviation" || id == "cold" || id == "temp" || id == "warm" || id == "ct" || id == "tw" || id == "gague")
        {
            this.update();
        }
    }
}

/**
 * A group of buttons from which any value can be selected.
 * May allow for more than one selection.
 * @extends Widget<any[]>
 */
class WidgetSelectButton extends Widget
{
	/** @type {Array<WidgetToggle>} */
	#swgs = [];

	/** @type {Array<any>} */
	#svls = [];

	/** @type {Array<number>} */
	#selected = [];

	/** @type {number} */
	#maxSelections = 1;

	/** @type {boolean} */
	#removeLastOver = true;

	
	/** @type {(e: CustomEvent) => void} */
	#binder = null;

	/**
	 * Constructor
	 * @param {number} max Maximum allowed to select
	 * @param {boolean} remove Behaviour when user selects over the maximum. If true, remove the oldest selection to make room.  If false, lock out selections until user removes one.
	 */
	constructor(max = 1, remove = true)
	{
		super();
		this.element.classList.add("sel-button");

		this.#binder = this.#selection_change.bind(this);

		this.#maxSelections = max;
		this.#removeLastOver = remove;
	}

	#update_val()
	{
		let out = [];
		for(let i = 0; i < this.#selected.length; i++)
		{
			out.push(this.#svls[this.#selected[i]]);
		}
		this.set(out);
	}

	#selection_add(idx)
	{
		if (this.#selected.length < this.#maxSelections)
		{
			this.#selected.push(idx);
		}
		else if (this.#removeLastOver)
		{
			if(this.#selected.length > 0)
			{
				let swap = this.#selected.shift();
                this.#swgs[swap].removeEventListener("change", this.#binder);
			    this.#swgs[swap].set(-swap - 1);
                this.#swgs[swap].addEventListener("change", this.#binder);
			}
			this.#selected.push(idx);
		}
		else
		{
            this.#swgs[idx].removeEventListener("change", this.#binder);
			this.#swgs[idx].set(-idx - 1);
            this.#swgs[idx].addEventListener("change", this.#binder);
		}
		
		if (!this.#removeLastOver && this.#selected.length >= this.#maxSelections)
		{
			for (let i = 0; i < this.#swgs.length; i++)
			{
				if (this.#swgs[i].get() < 0)
				{
					this.#swgs[i].setInactive(true);
				}
			}
		}

		this.#update_val();
	}

	#selection_remove(idx)
	{
		for(let i = 0; i < this.#selected.length; i++)
		{
			if (this.#selected[i] == idx)
			{
				this.#selected.splice(i, 1);
				i--;
			}
		}

		if (this.#selected.length == this.#maxSelections - 1 && this.#removeLastOver == false)
		{
			for (let i = 0; i < this.#swgs.length; i++)
			{
				if (this.#swgs[i].get() < 0)
				{
					this.#swgs[i].setInactive(false);
				}
			}
		}

		this.#update_val();
	}

	#selection_change(event)
	{
		let idx = Math.abs(event.detail.widget.get()) - 1;
		if (event.detail.widget.get() < 0)
		{
			this.#selection_remove(idx);
		}
		else
		{
			this.#selection_add(idx);
		}
	}
	
	/**
	 * Add a new selection with the given
	 * innerHTML and value when selected
	 * @param {string} inner Inner HTML of the selection button
	 * @param {*} val Value emitted when this value is selected
	 * @returns {number} The index of the new option
	 */
	addOption(inner, val)
	{
		this.#swgs.push(new WidgetToggle());
		let idx = this.#swgs.length;
		this.#swgs[idx - 1].setId("true", idx);
		this.#swgs[idx - 1].setId("false", -idx);
		this.element.appendChild(this.#swgs[idx - 1].element);
		this.#swgs[idx - 1].element.innerHTML = inner;
		this.#swgs[idx - 1].element.classList.remove("toggle");
		this.#swgs[idx - 1].addEventListener("change", this.#binder);
		this.#svls.push(val);
        return idx;
	}

	delOption(index)
	{
		this.#swgs[index].element.remove();
		this.#swgs[index].removeEventListener("change", this.#binder);
		this.#swgs.splice(index, 1);
		this.#svls.splice(index, 1);

		let need_update = false;
		for (let i = 0; i < this.#selected.length; i++)
		{
			if (this.#selected[i] == index)
			{
				this.#selected.splice(index, 1);
				need_update = true;
				i--;
			}
			else if (this.#selected[i] > index)
			{
				this.#selected[i]--;
			}
		}

		if (needs_update)
		{
            if (!this.#removeLastOver && this.#selected.length == this.#maxSelections - 1)
            {
                for (let i = 0; i < this.#swgs.length; i++)
                {
                    this.#swgs[i].setInactive(false);
                }
            }
			this.#update_val();
		}
	}

	indexOf(val)
	{
		return this.#svls.indexOf(val);
	}
}

/**
 * @extends WidgetDragable<number>
 */
class WidgetScrubber extends WidgetDragable
{
    /** @type {HTMLElement} */
    #detail = null;
    /** @type {HTMLElement} */
    #fill = null;

    #binder = null;

    /** @type {number} */
    #tmpNum = 0;
    #percent = 0;

    /** @type {number} */
    #interval = null;

    /** @type {number} */
    #zone = 0;

    /**
     * 
     * @param {number} value Starting value
     * @param {number} max Maximum value
     * @param {number} min Minimum value
     * @param {number} step Step increace/decrease per zone
     * @param {number} zones Zones on either side of the zero-point
     * @param {number} speed Speed per value change (ms)
     */
    constructor(value = 5, max = 10, min = 1, step = 0.5, zones = 2, speed = 350, spring = 1.5)
    {
        super(1);
        
        this.element.classList.add("scrubber");

        this.#fill = document.createElement("div");
        this.#fill.classList.add("fill");
        this.element.appendChild(this.#fill);

        this.#detail = document.createElement("div");
        this.#detail.classList.add("detail");
        this.element.appendChild(this.#detail);

        this.element.style.setProperty("--percent", 0);

        super.setId("max", max);
        super.setId("min", min);
        super.setId("step", step);
        super.setId("zones", zones);
        super.setId("speed", speed);
        super.setId("spring", spring);
        super.setId("value", value);

        this.#binder = this.#i_update.bind(this);
        this.#detail.innerText = this.get();
    }

    #clear()
    {
        let a = this.#interval;
        if (this.#interval != null)
        {
            this.#interval = null;
            clearInterval(a);
        }
    }

    #common_move(x, y)
    {
        let rect = this.element.getBoundingClientRect();
        let point = 0, dist = 0;
        if (this.element.classList.contains("h"))
        {
            dist = rect.width / 2;
            point = x - (rect.left + dist);
        }
        else
        {
            dist = rect.height / 2;
            point = (rect.top + dist) - y;
        }

        if (dist != 0)
            this.#percent = point / dist;
        else
            this.#percent = 0;

        this.update();
    }

    /** 
     * @param {MouseEvent} event
     * @param {number} btns
     * @param {boolean} gone
     */
    move(event, btns, gone)
    {
        if (btns == 0)
        {
            if (event.type == "mouseup")
            {
                if (this.#interval != null)
                    this.#clear();
                this.#zone = 0;
                this.set(this.#tmpNum);
                this.element.style.setProperty("--percent", 0);
            }
                
            return;
        }
        else if (event.type == "mousedown")
        {
            this.#tmpNum = this.get();
        }

        this.#common_move(event.clientX, event.clientY);
    }
    
    /**
     * @param {"touchstart" | "touchend" | "touchmove"} type 
     * @param {Touch[]} touches 
     */
    touch(type, touches)
    {
        if (type == "touchend")
        {
            if (this.#interval != null)
                this.#clear();
            this.#zone = 0;
            this.set(this.#tmpNum);
            this.element.style.setProperty("--percent", 0);
        }
        else if (type == "touchstart")
        {
            this.#tmpNum = this.get();
        }

        if (touches.length < 1)
            return;

        this.#common_move(touches[0].clientX, touches[0].clientY);
    }

    #f_update()
    {
        let zones = this.get("zones");
        if (this.#fill.children.length != zones * 2 + 1)
        {
            while (this.#fill.firstElementChild != null)
                this.#fill.firstElementChild.remove();
    
            
            for (let i = -zones; i <= zones; i++)
            {
                let z = document.createElement("div");
                z.className = "zone";
                z.style.setProperty("--zone", i);
                this.#fill.appendChild(z);
            }
    
            this.#fill.style.setProperty("--zones", zones);
        }
        
        for(let i = 0; i < this.#fill.children.length; i++)
        {
            if (i == zones + this.#zone)
                this.#fill.children[i].classList.add("active");
            else
                this.#fill.children[i].classList.remove("active");
        }
    }

    update()
    {
        let zones = this.get("zones"), spring = this.get("spring");
        this.#f_update();

        let percent = Math.min(Math.max(this.#percent / spring, -1), 1);
        this.#zone = Math.round(percent * zones);

        this.element.style.setProperty("--percent", percent);
        if (this.#interval == null && this.#zone != 0)
        {
            this.#interval = setInterval(this.#binder, this.get("speed"));
        }
    }

    #i_update()
    {
        if (this.#zone == 0 && this.#interval != null)
            this.#clear();

        let step = this.get("step"), max = this.get("max"), min = this.get("min");

        this.#tmpNum = Math.max(Math.min(this.#tmpNum + this.#zone * step, max), min);

        this.#detail.innerText = this.#tmpNum;
    }

    setId(id, v, emit = false)
    {
        super.setId(id, v, emit);
        if (id == "max" || id == "min" || id == "step" || id == "zones" || id == "spring")
        {
            this.update();
        }
        else if (id == "speed" && this.#interval != null)
        {
            let a = this.#interval;
            this.#interval = setInterval(this.#binder, v);
            clearInterval(a);
        }
    }
}
