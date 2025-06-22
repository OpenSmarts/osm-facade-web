'use strict';

class Temperature {

    /// Temperature in kelvin
    #temp = 0;

    /**
     * Constructor
     * @param {number} k Temperature in kelvin
     */
    constructor(k) {
        this.#temp = k;
    }

    /**
     * Create a new temperature object using celcius
     * @param {number} c 
     * @returns {Temperature}
     */
    static from_celcius(c) {
        return new Temperature(c + 273.15);
    }

    /**
     * Get the temperature in celcius
     * @returns {number}
     */
    to_celcius() {
        return this.#temp - 273.15;
    }

    /**
     * Create a new temperature object using fahrenheit
     * @param {number} f 
     * @returns {Temperature}
     */
    static from_fahrenheit(f) {
        return new Temperature((f + 459.67) * 5 / 9);
    }

    /**
     * Get the temperature in fahrenheit
     * @returns {number}
     */
    to_fahrenheit() {
        return (this.#temp * 9 / 5) - 459.67;
    }
    
    /**
     * From degrees halc
     * @param {number} h
     * @returns {Temperature} 
     */
    static from_halc(h) {
        return Temperature.from_celcius(h / 2);
    }

    /**
     * To degrees halc
     * @returns {number}
     */
    to_halc() {
        return this.to_celcius() * 2;
    }

    /**
     * Get the temperature in kelvin
     * @returns {number}
     */
    to_kelvin() {
        return this.#temp;
    }

    /**
     * Add the temperature to the current temperature
     * @param {Temperature} t 
     */
    add(t) {
        this.#temp += t.#temp;
    }

    /**
     * Subtract the temperature from the current temperature
     * @param {Temperature} t
     */
    sub(t) {
        this.#temp -= t.#temp;
    }
}