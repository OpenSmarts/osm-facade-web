class Client {

    

    /**
     * @param {HTMLElement} content The base element where page content is placed
     */
    constructor (content)
    {
        /** @type {WidgetToggle} */
        this.toggle = new WidgetCheckbox();
        content.appendChild(this.toggle.element);
        this.slider = new WidgetSlider();
        content.appendChild(this.slider.element);
        this.temp = new WidgetColorTemp();
        content.appendChild(this.temp.element);
        this.light = new WidgetColorLight();
        content.appendChild(this.light.element);
        this.wheel = new WidgetColorWheel();
        content.appendChild(this.wheel.element);
        this.therm = new WidgetThermostat({temp: 72, gague: 69});
        content.appendChild(this.therm.element);
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
}

let contents = document.getElementsByTagName("content");
if (contents.length > 0)
    OSmClient = new Client(contents[0]);
else
    console.error("Unable to find content tag, OSm stopping client.");
