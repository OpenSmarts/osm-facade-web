/**
 * @typedef {{
 *  el: HTMLElement;
 *  value: T;
 *  set: (value: T) => void;
 *  get: () => T}} Widget<T>
 * @template {any} T
 */

/**
 * @typedef {"button" | "toggle" | "slider" | "checkbox"} WidgetType
 */

/**
 * @template {any} T
 * @param {WidgetType} type
 * @returns {Widget<T>}
 */
function Widget (type = "button") {
    /** @type {Widget<Number>} */
    let out = {
        el: document.createElement("div"),
        value: 0,
        set: (e) => {value = e},
        get: () => this.value,
    };

    out.el.classList = ["widget", type];
    if (type == "checkbox" || type == "toggle")
    {
        out.el.classList.add("button");
    }

    return out;
}

export { Widget };