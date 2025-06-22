class Client {

    /**
     * @param {HTMLElement} content The base element where page content is placed
     */
    constructor (content)
    {
        /** @type {DescAny[]} */
        let desc = [
            { type: "button", name: "bt", props: {}, },
            { type: "checkbox", name: "cb", props: {}, state: true },
            { type: "toggle", name: "tg", props: {}, state: false },
            { type: "slider", name: "sli", props: {max: 10, min: 1, percent: true}, state: 6 },
            { type: "color-light", name: "cli", state: 0.7 },
            { type: "color-temp", name: "ctp", state: 3000 },
            { type: "color-wheel", name: "cwh", state: Color.from_rgb(255, 200, 200) },
            { type: "thermostat", name: "thm", props: {gague: Temperature.from_celcius(21)}, state: Temperature.from_celcius(23) },
            { type: "multi-select", name: "msl", props: {max: 2, values: ["aeiou", "sometimes y"], labels: ["vowels", "extra vowels"]}, state: []},
            { type: "scrubber", name: "scb", props: {min: 18, max: 26, step: 0.5}, state: 23 },
            { type: "radio", name: "rad", props: {values: ["a", "b"], labels: ["a", "b"]}, state: null}
        ];

        this.set = new WidgetSet(desc, "set");
        this.set.apply_to(content);

        this.set.addEventListener("change", this.changeSet.bind(this));
        this.content = content;
    }

    /** @param {CustomEvent} e */
    changeSet(e)
    {
        if (e.detail.name == "scb" && e.detail.changed == "value")
            this.set.widgets["thm"].set(Temperature.from_celcius(e.detail.value));
    }
}

let OSmClient = null;
let contents = document.getElementsByTagName("content");
if (contents.length > 0)
    OSmClient = new Client(contents[0]);
else
    console.error("Unable to find content tag, OSm stopping client.");
