'use strict';

/**
 * JSDoc types
 */

/**
 * @typedef {"button" | "toggle" | "checkbox" | "radio" |
 * "slider" | "color-temp" | "color-light" |
 * "color-wheel" | "thermostat" | "multi-select" | "scrubber"} DescType
 */

/**
 * @typedef OSmButtonProps
 * @property {string} [text]
 * @property {*} [tv]
 * @property {*} [fv]
 */

/**
 * @typedef OSmToggleProps
 * @property {string} [text]
 * @property {*} [tv]
 * @property {*} [fv]
 */

/**
 * @typedef OSmSliderProps
 * @property {number} min
 * @property {number} max
 * @property {number} [step]
 * @property {number} [precision]
 * @property {boolean} [percent]
 */

/**
 * @typedef OSmThermostatProps
 * @property {number} gague
 * @property {number} [deviation]
 * @property {Color} [color_cold]
 * @property {Color} [color_temperate]
 * @property {Color} [color_warm]
 * @property {number} [ct]
 * @property {number} [tw]
 */

/**
 * @typedef OSmMultiSelectProps
 * @property {Array<srting>} labels
 * @property {Array<any>} values
 * @property {number} max
 * @property {boolean} remove
 */

/**
 * @typedef OSmScrubberProps
 * @property {number} max
 * @property {number} min
 * @property {number} step
 * @property {number} [zones]
 * @property {number} [speed]
 * @property {number} [spring]
 */

/**
 * @typedef OSmRadioSelectProps
 * @property {Array<any>} values
 * @property {Array<string>} labels
 */

/**
 * @typedef {OSmButtonProps | OSmToggleProps | OSmSliderProps | OSmThermostatProps | OSmMultiSelectProps | OSmScrubberProps | OSmRadioSelectProps} OSmAnyProps
 */

/**
 * @typedef {Object} DescBase
 * @property {DescType} type
 * @property {string} name
 */

/**
 * @typedef {DescBase & {type: "button", props: OSmButtonProps, state: never}} DescButton
 */

/**
 * @typedef {DescBase & {type: "toggle" | "checkbox", props: OSmToggleProps, state: boolean}} DescToggle
 */

/**
 * @typedef {DescBase & {type: "slider", props: OSmSliderProps, state: number}} DescSlider
 */

/**
 * @typedef {DescBase & {type: "color-temp", props: never, state: number}} DescColorTemp
 */

/**
 * @typedef {DescBase & {type: "color-light", props: never, state: number}} DescColorLight
 */

/**
 * @typedef {DescBase & {type: "color-wheel", props: never, state: Color}} DescColorWheel
 */

/**
 * @typedef {DescBase & {type: "thermostat", props: OSmThermostatProps, state: number}} DescThermostat
 */

/**
 * @typedef {DescBase & {type: "multi-select", props: OSmMultiSelectProps, state: Array<number>}} DescMultiSelect
 */

/**
 * @typedef {DescBase & {type: "scrubber", props: OSmScrubberProps, state: number}} DescScrubber
 */

/**
 * @typedef {DescBase & {type: "radio", props: OSmRadioSelectProps, state: number | null}} DescRadioSelect
 */

/**
 * @typedef {DescButton | DescToggle | DescSlider | DescColorTemp | DescColorLight | DescColorWheel | DescThermostat | DescMultiSelect | DescScrubber | DescRadioSelect} DescAny
 */

class WidgetSet extends EventTarget{

    #name = "";
    
    /** @type {{[key: string]: Widget}} */
    widgets = {};
    
    /**
     * 
     * @param {DescAny[]} desc 
     * @param {string} name 
     */
    constructor(desc, name)
    {
        super();

        this.#name = name;
        this.#parse_desc(desc);

        for (let i in this.widgets)
        {
            this.widgets[i].addEventListener("change", this.#change.bind(this));
        }
    }
    

    /**
     * @param {DescButton} desc 
     * @returns {WidgetButton}
     */
    static parse_button(desc)
    {
        let merge = {...{tv: true, fv: false, text: ""}, ...desc.props};
        let out = new WidgetButton(merge.tv, merge.fv);
        out.set_by_id("name", desc.name);
        out.element.innerText = merge.text;
        return out;
    }

    /**
     * @param {DescToggle} desc 
     * @returns {WidgetToggle}
     */
    static parse_toggle(desc)
    {
        let merge = {...{tv: true, fv: false, text: ""}, ...desc.props};
        let out;

        if (desc.type == "checkbox")
            out = new WidgetCheckbox(desc.state ? merge.tv : merge.fv, merge.tv, merge.fv);
        else
        {
            out = new WidgetToggle(desc.state ? merge.tv : merge.fv, merge.tv, merge.fv);
            out.element.innerText = merge.text;
        }
        out.set_by_id("name", desc.name);
            
        return out;
    }

    /**
     * @param {DescSlider} desc 
     * @returns {WidgetSlider}
     */
    static parse_slider(desc)
    {
        let merge = {...{step: 0.1, precision: 1, percent: false}, ...desc.props};
        let out = new WidgetSlider(desc.state, merge.min, merge.max, merge.step, merge.precision, merge.percent);
        out.set_by_id("name", desc.name);
        return out;
    }

    /**
     * @param {DescColorLight} desc 
     * @returns {WidgetColorLight}
     */
    static parse_color_light(desc)
    {
        let out = new WidgetColorLight(Math.max(Math.min(desc.state, 1), 0));
        out.set_by_id("name", desc.name);
        return out;
    }

    /**
     * @param {DescColorTemp} desc 
     * @returns {WidgetColorTemp}
     */
    static parse_color_temp(desc)
    {
        let out = new WidgetColorTemp(Math.max(Math.min(desc.state, 6000), 2700));
        out.set_by_id("name", desc.name);
        return out;
    }

    /**
     * @param {DescColorWheel} desc 
     * @returns {WidgetColorWheel}
     */
    static parse_color_wheel(desc)
    {
        let value = new Color(...desc.state.channels);
        let out = new WidgetColorWheel(value);
        out.set_by_id("name", desc.name);
        return out;
    }

    /**
     * @param {DescThermostat} desc 
     * @returns {WidgetThermostat}
     */
    static parse_thermostat(desc)
    {
        let merge = {...{
            deviation: 7,
            color_cold: Color.from_rgb(0, 133, 255),
            color_temperate: Color.from_rgb(18, 229, 82),
            color_warm: Color.from_rgb(255, 149, 0),
            ct: -2,
            tw: 2,
        }, ...desc.props};

        let cc = new Color(...merge.color_cold.channels);
        let ct = new Color(...merge.color_temperate.channels);
        let cw = new Color(...merge.color_warm.channels);

        let out = new WidgetThermostat(desc.state, merge.gague, merge.deviation, cc, ct, cw, merge.ct, merge.tw);
        out.set_by_id("name", desc.name);
        return out;
    }

    /**
     * @param {DescMultiSelect} desc
     * @returns {WidgetSelectButton}
     */
    static parse_multi_select(desc)
    {
        let merge = {...{max: 1, remove: true, labels: [], values: []}, ...desc.props};

        let out = new WidgetSelectButton(merge.max, merge.remove);
        
        for(let i = 0; i < Math.min(merge.labels.length, merge.values.length); i++) {
            out.add_option(merge.labels[i], merge.values[i]);
        }

        out.set_indices(desc.state);

        return out;
    }

    /**
     * @param {DescScrubber} desc 
     * @returns {WidgetScrubber}
     */
    static parse_scrubber(desc)
    {
        let merge = {...{
            zones: 2,
            speed: 300,
            spring: 1.4
        }, ...desc.props};

        let out = new WidgetScrubber(desc.state, merge.max, merge.min, merge.step, merge.zones, merge.speed, merge.spring);
        out.set_by_id("name", desc.name);
        return out;
    }

    /**
     * 
     * @param {DescRadioSelect} desc
     * @returns {WidgetRadio} 
     */
    static parse_radio(desc)
    {
        let merge = {...{
            
        }, ...desc.props};
        let out = new WidgetRadioGroup();

        for (let i = 0; i < Math.min(merge.labels.length, merge.values.length); i++) {
            out.add_option(merge.labels[i], merge.values[i]);
        }

        if (desc.state !== null)
            out.set_by_index(desc.state);

        out.set_by_id("name", desc.name);
        return out;
    }

    /**
     * 
     * @param {DescAny[]} desc 
     */
    #parse_desc (desc)
    {
        for (let i of desc)
        {
            let out;
            switch (i.type)
            {
            case "button":
                out = WidgetSet.parse_button(i);
                break;
            case "checkbox":
            case "toggle":
                out = WidgetSet.parse_toggle(i);
                break;
            case "slider":
                out = WidgetSet.parse_slider(i);
                break;
            case "color-light":
                out = WidgetSet.parse_color_light(i);
                break;
            case "color-temp":
                out = WidgetSet.parse_color_temp(i);
                break;
            case "color-wheel":
                out = WidgetSet.parse_color_wheel(i);
                break;
            case "thermostat":
                out = WidgetSet.parse_thermostat(i);
                break;
            case "multi-select":
                out = WidgetSet.parse_multi_select(i);
                break;
            case "scrubber":
                out = WidgetSet.parse_scrubber(i);
                break;
            case "radio":
                out = WidgetSet.parse_radio(i);
            }
            this.widgets[i.name] = out;
        }
    }

    /**
     * 
     * @param {CustomEvent} e 
     */
    #change(e)
    {
        /**
         * @type {{widget: Widget, changed: string}}
         */
        let d = e.detail;

        let detail = {
            set: this.#name,
            name: d.widget.get("name"),
            changed: d.changed,
            value: d.widget.get(d.changed)
        };

        this.dispatchEvent(new CustomEvent("change", {detail: detail}));
    }

    /**
     * 
     * @param {HTMLElement} el 
     */
    apply_to(el)
    {
        for (let i in this.widgets)
        {
            el.appendChild(this.widgets[i].element);
        }
    }
}