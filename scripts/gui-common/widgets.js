/**
 * @typedef {"button" | "toggle" | "slider" | "checkbox" | "color-wheel" | "color-temp" | "color-light" | "thermostat" | "sel-button"} WidgetType
 */

/** @template {*} T */
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

/** @typedef {Widget<boolean>} WidgetButton */
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

/** @typedef {Widget<boolean>} WidgetToggle */
class WidgetToggle extends Widget
{
    /** @type {number} */
    primed = 0;

    /** @type {number} */
    gone = 0;

    #bound = null;

    constructor ()
    {
        super();
        this.element.classList.add("button");
        this.element.classList.add("toggle");
        this.addEventListener("mousedown", this.#prime);
        this.addEventListener("mouseup", this.#toggle);
        this.addEventListener("mouseleave", this.#leave);
        this.addEventListener("mouseenter", this.#enter);
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
        this.set(!this.get());
        this.element.classList.toggle("active", this.get());
        this.primed -= (1 << event.button);
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
}

class WidgetCheckbox extends WidgetToggle {

    constructor()
    {
        super();
        this.element.classList.remove("toggle");
        this.element.classList.add("checkbox");
    }
}

class WidgetSlider extends Widget
{
    /** @type {number} */
    #primed = 0;

    /** @type {number} */
    #gone = 0;

    #boundUp = null;
    #boundMove = null;

    /** @type {HTMLElement} */
    #detail = null;
    /** @type {(e: HTMLElement, v: number, p: number) => void} */
    #detailUpdater = null;

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
        
        this.addEventListener("mousedown", this.#press);
        this.addEventListener("mousemove", this.#move);
        this.addEventListener("mouseup", this.#unpress);
        this.addEventListener("mouseleave", this.#leave);
        this.addEventListener("mouseenter", this.#enter);
        this.addEventListener("change", this.#change);
        
        this.#boundUp = this.#unpress.bind(this);
        this.#boundMove = this.#move.bind(this);
        this.#max = max;
        this.#min = min;
        this.#step = step;
        this.#precision = trunc;
        this.#percent = percent;

        this.#detailUpdater = this.update_detail.bind(this);
    }

    /** @param {MouseEvent} event */
    #press(event)
    {
        this.#primed |= (1 << event.button);
        this.#move(event);
    }

    /** @param {MouseEvent} event */
    #move(event)
    {
        if (this.#primed == 0)
            return;

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

        this.#detailUpdater(this.#detail, this.#tmpNum, percent, this.#percent);
        this.element.style.setProperty("--percent", percent);
    }

    /** @param {MouseEvent} event */
    #unpress(event)
    {
        if (((1 << event.button) & this.#primed) == 0)
            return;
        this.#primed -= (1 << event.button);
        if (this.#primed == 0)
        {
            this.set(this.#tmpNum);
            if (this.#gone)
            {
                this.#gone = 0;
                window.removeEventListener("mouseup", this.#boundUp);
                window.removeEventListener("mousemove", this.#boundMove);
            }
        }
    }

    /** @param {MouseEvent} event */
    #leave(event)
    {
        if (this.#primed == 0)
            return;
        this.#gone = 1;
        window.addEventListener("mouseup", this.#boundUp);
        window.addEventListener("mousemove", this.#boundMove);
    }

    /** @param {MouseEvent} event */
    #enter(event)
    {
        if (this.#primed == 0)
            return;
        this.#gone = 0;
        window.removeEventListener("mouseup", this.#boundUp);
        window.removeEventListener("mousemove", this.#boundMove);
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
        this.#detailUpdater = updater;
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
        
        let fills = this.element.getElementsByClassName("fill");
        for(let f of fills)
        {
            f.remove();
        }

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

/** @typedef {Widget<number>} WidgetSlider */
/** @typedef {Widget<string>} WidgetColorWheel */
/** @typedef {Widget<number>} WidgetColorTemp */
/** @typedef {Widget<number>} WidgetColorLight */
/** @typedef {Widget<number> & {getGague: () => number, setGague: (value: number) => void}} WidgetThermostat */
/** @typedef {Widget<any> & {addSelection: (name: string, value: any) => void, setSelection: (name: string) => boolean, removeSelection: (name: string) => void, getSelection: () => string}} WidgetSelectButton */

// export { Widget };