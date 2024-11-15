/**
 * The base Widget class.  Represents an interactible
 * value-producing object in the browser, like an input.
 * @template {*} T
*/
class Widget extends EventTarget{
    /** @type {T} */
    #value = null;

    /** @type {HTMLElement} */
    element = null;

    /** @type {boolean} */
    inactive = false;
    
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

    /** @returns {T} */
    get()
    {
        return this.#value;
    }

    /** @param {T} v */
    set(v)
    {
        this.#value = v;
        this.#emitChangeEvent();
    }

    /** @param {boolean} i */
    setInactive (i)
    {
        this.element.classList.toggle("inactive", i);
        this.inactive = i;
    }

    /** @returns {boolean} */
    getInactive ()
    {
        return this.inactive;
    }

    #emitChangeEvent()
    {
        this.dispatchEvent(new CustomEvent("change", {detail: this}));
    }

    /** @param {MouseEvent} event */
    #emitMouseEvent(event)
    {
        if (this.inactive)
            this.dispatchEvent(new CustomEvent("inactive", {detail: {widget: this, event: new MouseEvent(event.type, event)}}));
        else
            this.dispatchEvent(new MouseEvent(event.type, event));
    }

    /** @param {TouchEvent} event */
    #emitTouchEvent(event)
    {
        if (this.inactive)
            this.dispatchEvent(new CustomEvent("inactive", {detail: {widget: this, event: new TouchEvent(event.type, event)}}));
        else
            this.dispatchEvent(new TouchEvent(event.type, event));
    }

    /** @param {Event} event */
    #emitContextEvent(event)
    {
        if (this.inactive)
            this.dispatchEvent(new CustomEvent("inactive", {detail: {widget: this, event: new Event(event.type, event)}}));
        else
            this.dispatchEvent(new Event(event.type, event));
        event.preventDefault();
    }

    handleClick() {}
}

/**
 * Represents a basic button widget
 * @extends Widget<boolean>
*/
class WidgetButton extends Widget
{
    /** @type {number} */
    pressing = 0;

    gone = 0;

    #bound = null;

    constructor ()
    {
        super();
        this.element.classList.add("button");
        this.addEventListener("mousedown", this.#press);
        this.addEventListener("mouseup", this.#unpress);
        this.addEventListener("mouseleave", this.#leave);
        this.addEventListener("mouseenter", this.#enter);
        this.#bound = this.#unpress.bind(this);
    }

    /** @param {MouseEvent} event */
    #press(event)
    {
        this.pressing |= (1 << event.button);
        this.set(true);
    }

    #unpress (event)
    {
        if (((1 << event.button) & this.pressing) == 0)
            return;

        this.pressing -= (1 << event.button);
        if (this.pressing == 0)
        {
            this.set(false);
            if (this.gone)
            {
                this.gone = 0;
                window.removeEventListener("mouseup", this.#bound);
            }
        }
    }

    /** @param {MouseEvent} event */
    #leave(event)
    {
        if (this.pressing == 0)
            return;
        this.gone = 1;
        window.addEventListener("mouseup", this.#bound);
    }

    /** @param {MouseEvent} event */
    #enter(event)
    {
        if (this.primed == 0)
            return;
        this.gone = 0;
        window.removeEventListener("mouseup", this.#bound);
    }
}

/**
 * A toggle widget, similar to a WidgetCheckbox, but meant
 * to be used for on/off power states.
 * @extends Widget<boolean>
 */
class WidgetToggle extends Widget
{
    /** @type {number} */
    primed = 0;

    /** @type {number} */
    gone = 0;

    #bound = null;

	#falseVal = false;

	#trueVal = true;

    constructor ()
    {
        super();
        this.element.classList.add("button");
        this.element.classList.add("toggle");
        this.addEventListener("mousedown", this.#prime);
        this.addEventListener("mouseup", this.#toggle);
        this.addEventListener("mouseleave", this.#leave);
        this.addEventListener("mouseenter", this.#enter);
		this.addEventListener("change", this.#update_ui);
        this.#bound = this.#toggle.bind(this);
    }

    /** @param {MouseEvent} event */
    #prime(event)
    {
        this.primed |= (1 << event.button);
    }

    /** @param {MouseEvent} event */
    #toggle(event)
    {
        if (this.gone)
        {
            this.primed = 0;
            this.gone = 0;
            window.removeEventListener("mouseup", this.#bound);
        }
        if (((1 << event.button) & this.primed) == 0)
            return;

		if (this.get() == this.#trueVal)
        	this.set(this.#falseVal);
		else
			this.set(this.#trueVal);
		
		this.#update_ui();
        this.primed -= (1 << event.button);
    }

	#update_ui()
	{
        this.element.classList.toggle("active", this.get() == this.#trueVal);
	}

    /** @param {MouseEvent} event */
    #leave(event)
    {
        if (this.primed == 0)
            return;
        this.gone = 1;
        window.addEventListener("mouseup", this.#bound);
    }

    /** @param {MouseEvent} event */
    #enter(event)
    {
        if (this.primed == 0)
            return;
        this.gone = 0;
        window.removeEventListener("mouseup", this.#bound);
    }

	setFalseVal(fv)
	{
		if (this.get() == this.#falseVal)
			this.set(fv)
		this.#falseVal = fv;
	}

	setTrueVal(tv)
	{
		if (this.get() == this.#trueVal)
			this.set(tv)
		this.#trueVal = tv;
	}
}

/**
 * Effectively the same as a WidgetToggle, just with a more
 * "checkbox" look and feel
 * @extends WidgetToggle
 */
class WidgetCheckbox extends WidgetToggle {

    constructor()
    {
        super();
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

    /** @type {(e: TouchEvent) => void} */
    #t_up = null;
    /** @type {(e: TouchEvent) => void} */
    #t_move = null;


    /**
     * Constructor
     */
    constructor ()
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
    }

    /** @param {MouseEvent} event */
    #press(event)
    {
        console.log("Press!");
        this.#primed |= (1 << event.button);
        this.#move(event);
    }

    /** @param {MouseEvent} event */
    #unpress(event)
    {
        console.log("Unpress!");
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
        console.log(event.type, event.changedTouches);
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

    /** @type {number} */
    #max;
    /** @type {number} */
    #min;
    /** @type {number} */
    #step;
    /** @type {number} */
    #precision;
    /** @type {boolean} */
    #percent;


    /**
     * Constructor
     * @param {number} [max] Value the slider represents at maximum
     * @param {number} [min] Value the slider represents at minimum
     * @param {number} [step] Step amount
     * @param {number} [trunc] Decimal places to keep
     * @param {boolean} [percent] Whether to show a percentage instead of the raw number
     */
    constructor (max = 10, min = 1, step = 0.1, trunc = 1, percent = false)
    {
        super();
        this.element.classList.add("slider");
        let fill = document.createElement("div");
        fill.classList.add("fill");
        this.element.appendChild(fill);

        this.#detail = document.createElement("div");
        this.#detail.classList.add("detail");
        this.element.appendChild(this.#detail);

        this.addEventListener("change", this.#change);

        this.#max = max;
        this.#min = min;
        this.#step = step;
        this.#precision = trunc;
        this.#percent = percent;

        this.#u_detail = this.update_detail.bind(this);
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

        let rect = this.element.getBoundingClientRect();
        let top = 0, bot = 0, point = 0;
        if (this.element.classList.contains("h"))
        {
            top = rect.right;
            bot = rect.left;
            point = event.clientX;
        }
        else
        {
            top = rect.bottom;
            bot = rect.top;
            point = top - event.clientY + bot;
        }

        if (point < bot && this.#tmpNum != this.#min)
            this.#tmpNum = this.#min;
        else if (point > top && this.#tmpNum != this.#max)
            this.#tmpNum = this.#max;
        else if (bot < point && point < top)
        {
            let v = ((point - bot) / (top - bot)) * (this.#max - this.#min) + this.#min;
            let r = v % this.#step;
            v -= v % this.#step;
            if (r >= this.#step / 2)
                v += this.#step;
            this.#tmpNum = v;
        }
        this.#update_ui();
    }

    #change ()
    {
        this.#tmpNum = this.get();
        this.#update_ui();
    }

    #update_ui()
    {
        if (this.#tmpNum < this.#min || this.#max < this.#tmpNum)
            this.#tmpNum = Math.min(Math.max(this.#tmpNum, this.#min), this.#max);
        let percent = (this.#tmpNum - this.#min) / (this.#max - this.#min);

        this.#u_detail(this.#detail, this.#tmpNum, percent, this.#percent);
        this.element.style.setProperty("--percent", percent);
    }

    update_detail(el, val, percent)
    {
        if (this.#percent)
            el.innerText = `${Math.trunc(percent * 100)}%`;
        else
            el.innerText = `${Math.trunc(Math.pow(10, this.#precision) * val) / Math.pow(10, this.#precision)}`
    }

    setDetailUpdater(updater)
    {
        this.#u_detail = updater;
    }

    /** @param {number} m */
    setMin(m)
    {
        this.#min = m;
        this.#update_ui();
    }

    /** @param {number} m */
    setMax(m)
    {
        this.#max = m;
        this.#update_ui();
    }

    /** @param {number} s */
    setStep(s)
    {
        this.#step = s;
        this.#update_ui();
    }
}

/**
 * Like a slider, but shows color temperature instead.
 * @extends WidgetSlider
 */
class WidgetColorTemp extends WidgetSlider 
{
    /** @type {Color} */
    ORANGE = Color.from_rgb(250, 160, 100);
    /** @type {Color} */
    WHITE = new Color(1, 1, 1);
    /** @type {Color} */
    BLUE = Color.from_rgb(190, 200, 255);

    constructor ()
    {
        super(6000, 2700, 100);
        this.element.classList.replace("slider", "color-temp");

        this.setDetailUpdater(this.update_detail.bind(this));
        this.set(2700);
    }

    /**
     * Update the detail for the color temp slider
     * @param {HTMLElement} el 
     * @param {number} val 
     * @param {number} percent 
     */
    update_detail(el, val, percent)
    {
        let out = null;
        if (percent < 0.7)
            out = this.ORANGE.interpolate(this.WHITE, percent / 0.7);
        else
            out = this.WHITE.interpolate(this.BLUE, (percent - 0.7) / 0.3);
        el.style.setProperty("--detail", out.rgb());
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

    constructor ()
    {
        super(1, 0, 0.01, 0, 1);
        this.element.classList.replace("slider", "color-light");
        
        let fills = this.element.getElementsByClassName("fill");
        for(let f of fills)
        {
            f.remove();
        }

        this.setDetailUpdater(this.update_detail.bind(this));
        this.set(0);
    }

    /**
     * Update the detail for the color temp slider
     * @param {HTMLElement} el 
     * @param {number} val 
     * @param {number} percent 
     */
    update_detail(el, val, percent)
    {
        let out = this.BLACK.interpolate(this.WHITE, percent);
        el.style.setProperty("--detail", out.rgb());
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
     */
    constructor ()
    {
        super();
        this.element.classList.add("color-wheel");

        this.#detail = document.createElement("div");
        this.#detail.classList.add("detail");
        this.element.appendChild(this.#detail);

        this.addEventListener("change", this.#change);
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

        let rect = this.element.getBoundingClientRect();
        
        // Points
        let tmpX = event.clientX - rect.width / 2;
        let tmpY = rect.bottom - event.clientY + rect.top - rect.height / 2;
        
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
        this.update_detail(tmpX, tmpY, mag);
    }

    #change ()
    {
        this.#tmpColor = this.get();

        let m = this.#tmpColor.hsv_mag();
        let a = this.#tmpColor.hsv_angle();

        this.element.style.setProperty("--detail", this.#tmpColor.rgb());
        this.element.style.setProperty("--pos-x", Math.cos(a) * m);
        this.element.style.setProperty("--pos-y", Math.sin(a) * m);
    }

    update_detail(x, y, mag)
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

    /** @type {number} */
    #deviation = null;

    /** @type {Color} */
    #cold_color = null;

    /** @type {Color} */
    #temperate_color = null;

    /** @type {Color} */
    #hot_color = null;

    /** @type {number} */
    #cold_temp = null;

    /** @type {number} */
    #temp_hot = null;

    /**
     * Constructor
     * @param {ThermSpec} therm Initial thermal information
     * @param {number} [dev] The deviation of the arch (how far in degrees (temperature) from the middle to each end of the arc)
     * @param {Color} [cold] The color the arch will display when in "cold" temperatures
     * @param {Color} [temp] The color the arch will display when in "temperate" temperatures
     * @param {Color} [hot] The color the arch will display when in "hot" temperatures
     * @param {number} [ct] The point at which we swap from cold to temperate
     * @param {number} [th] The point at which we swap from temperate to hot
     */
    constructor(
        therm,
        dev = 7,
        cold = Color.from_rgb(0, 133, 255),
        temp = Color.from_rgb(18, 229, 82),
        hot = Color.from_rgb(255, 149, 0),
        ct = -2,
        th = 2
    ) {
        super();

        this.element.classList.add("thermostat");
        this.element.appendChild(document.createElement("arch"));

        this.#temp = document.createElement("temp");
        this.element.appendChild(this.#temp);

        this.#gague = document.createElement("gague");
        this.element.appendChild(this.#gague);

        this.addEventListener("change", this.#update_ui);

        this.#deviation = dev;
        this.#cold_color = cold;
        this.#temperate_color = temp;
        this.#hot_color = hot;
        this.#cold_temp = ct;
        this.#temp_hot = th;
        this.set(therm);
    }

    #update_ui()
    {
        /** @type {ThermSpec} */
        let therm = this.get();
        this.#gague.innerText = `${Math.fround(therm.gague)}`;
        this.#temp.innerText = `${Math.fround(therm.temp)}°`;

        // Generate a percentage relative to the deviation
        let div = (therm.gague - therm.temp) / this.#deviation;
        // Normalize into range of 0 - 1
        div = div / 2 + 0.5;
        div = Math.min(1, Math.max(div, 0));
        
        this.element.style.setProperty("--percent", div);

        let color = this.#cold_color;
        let r = therm.gague - therm.temp;
        if (r >= this.#temp_hot)
            color = this.#hot_color
        else if (r >= this.#cold_temp)
            color = this.#temperate_color;
        this.element.style.setProperty("--detail", color.rgb());
    }

    /**
     * Set the number shown underneath the thermostat's arch
     * @param {number} t 
     */
    setTemp(t)
    {
        let therm = this.get();
        therm.temp = t;
        this.set(therm);
    }

    /**
     * Set the number shown underneath the thermostat's arch
     * @param {number} t 
     */
    setGague(g)
    {
        let therm = this.get();
        therm.gague = g;
        this.set(therm);
    }

    /**
     * Set both the number underneath the thermostat and
     * the number in the gague over it.
     * @param {number} t 
     * @param {number} g 
     */
    setTherm(t, g)
    {
        this.set({temp: t, gague: g});
    }

    /**
     * Colors which will display within the designated zones
     * @param {Color} cold 
     * @param {Color} temperate 
     * @param {Color} hot 
     */
    setColors(cold, temperate, hot)
    {
        this.#cold_color = cold;
        this.#temperate_color = temperate;
        this.#hot_color = hot;
        this.#update_ui();
    }

    /**
     * Set the relative temperatures (in whatever degree units are being used)
     * for when the color transitions happen on the arch
     * @param {number} ct
     * @param {number} th
     */
    setZoneStops(ct, th)
    {
        this.#cold_temp = ct;
        this.#temp_hot = th;
        this.#update_ui();
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
				this.#swgs[swap].set(-swap - 1);
			}
			this.#selected.push(idx);
		}
		else
		{
			this.#swgs[idx].set(-idx - 1);
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
		let idx = Math.abs(event.detail.get()) - 1;
		if (event.detail.get() < 0)
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
		this.#swgs[idx - 1].setTrueVal(idx);
		this.#swgs[idx - 1].setFalseVal(-idx);
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

}
