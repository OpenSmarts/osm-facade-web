class Client {

    

    /**
     * @param {HTMLElement} content The base element where page content is placed
     */
    constructor (content)
    {
        /** @type {WidgetToggle} */
        this.cb = new WidgetCheckbox();
        content.appendChild(this.cb.element);
        this.toggle = new WidgetToggle();
        content.appendChild(this.toggle.element);
        this.button = new WidgetButton();
        content.appendChild(this.button.element);
        this.slider = new WidgetSlider();
        content.appendChild(this.slider.element);
        this.temp = new WidgetColorTemp();
        content.appendChild(this.temp.element);
        this.light = new WidgetColorLight();
        content.appendChild(this.light.element);
        this.wheel = new WidgetColorWheel();
        content.appendChild(this.wheel.element);
        this.therm = new WidgetThermostat(72, 69);
        content.appendChild(this.therm.element);
		this.sel_b = new WidgetSelectButton(2);
		this.sel_b.addOption("Heat", "heat");
		this.sel_b.addOption("Cool", "cool");
		this.sel_b.addOption("Eco", "eco");
		content.appendChild(this.sel_b.element);
        this.scrubber = new WidgetScrubber(72, 80, 60, 1, 3);
        content.appendChild(this.scrubber.element);

        this.scrubber.addEventListener("change", this.changeThermostat.bind(this));
        // content.appendChild(Widget("button").el);
        // content.appendChild(Widget("checkbox").el);
        // content.appendChild(Widget("slider").el);
        // content.appendChild(Widget("color-wheel").el);
        // content.appendChild(Widget("color-temp").el);
        // content.appendChild(Widget("color-light").el);
        // content.appendChild(Widget("thermostat").el);
        // content.appendChild(Widget("sel-button").el);
        this.content = content;
    }

    /** @param {CustomEvent} e */
    changeThermostat(e)
    {
        this.therm.set(e.detail.widget.get());
    }
}

let contents = document.getElementsByTagName("content");
if (contents.length > 0)
    OSmClient = new Client(contents[0]);
else
    console.error("Unable to find content tag, OSm stopping client.");
