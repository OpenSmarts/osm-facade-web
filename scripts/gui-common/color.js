class Color
{
    /** @type {Array<number>} */
    channels = []

    /**
     * Construct a color
     * @param  {...number} nums 
     */
    constructor(...nums)
    {
        this.channels = nums;
    }

    /**
     * @param {Color} b
     * @param {number} i
     * @returns {Color}
     */
    interpolate(b, i)
    {
        let out = new Color();
        for (let c = 0; c < this.channels.length && c < b.channels.length; c++)
        {
            out.channels.push(b.channels[c] * i + this.channels[c] * (1 - i))
        }
        return out;
    }

    /** Get the CSS string representing rgb
     * @returns {string}
     */
    rgb()
    {
        return `rgb(${Math.trunc(this.channels[0] * 255)}, ${Math.trunc(this.channels[1] * 255)}, ${Math.trunc(this.channels[2] * 255)})`;
    }

    /** Get the CSS string representing rgba
     * @returns {string}
     */
    rgba()
    {
        return `rgba(${Math.trunc(this.channels[0] * 255)}, ${Math.trunc(this.channels[1] * 255)}, ${Math.trunc(this.channels[2] * 255)}, ${this.channels[3]})`;
    }

    static from_rgb(r, g, b)
    {
        return new Color(r / 255, g / 255, b / 255);
    }

    static from_rgba(r, g, b)
    {
        return new Color(r / 255, g / 255, b / 255, a);
    }
}

/**
 * Interpolate between two colors
 * @param {Color} a 
 * @param {Color} b 
 * @param {number} p 
 */
function interpolate(a, b, p)
{

}