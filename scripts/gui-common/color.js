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

    static d(h)
    {
        let d = Math.floor((h - (h % PI_THIRDS)) / PI_THIRDS);
        return (DIVS.length - 1 + d) % (DIVS.length - 1);
    }

    static from_hsv(h, s, v)
    {
        h = (((h % TWO_PI)) + TWO_PI) % TWO_PI;

        let d = Color.d(h);
        
        h = (h % PI_THIRDS) / PI_THIRDS;

        let out = DIVS[d].interpolate(DIVS[d + 1], h);
        out = WHITE.interpolate(out, s);
        
        return BLACK.interpolate(out, v);
    }

    static from_hsl(h, s, l)
    {
        h = (((h % TWO_PI)) + TWO_PI) % TWO_PI;
        
        let d = Color.d(h);
        
        h = (h % PI_THIRDS) / PI_THIRDS;

        let out = DIVS[d].interpolate(DIVS[d + 1], h);
        let L = BLACK.interpolate(WHITE, l);
        
        if (l < 0.5)
            out = BLACK.interpolate(out, l / 0.5);
        else
            out = out.interpolate(WHITE, (l - 0.5) / 0.5);
        
        return L.interpolate(out, s);
    }
}

const RED = new Color(1, 0, 0, 1);
const YELLOW = new Color(1, 1, 0, 1);
const GREEN = new Color(0, 1, 0, 1);
const CYAN = new Color(0, 1, 1, 1);
const BLUE = new Color(0, 0, 1, 1);
const MAGENTA = new Color(1, 0, 1, 1);
const WHITE = new Color(1, 1, 1, 1);
const BLACK = new Color(0, 0, 0, 1);

const PI_THIRDS = Math.PI / 3;
const TWO_PI = Math.PI * 2;

const DIVS = [RED, YELLOW, GREEN, CYAN, BLUE, MAGENTA, RED];

/**
 * Interpolate between two colors
 * @param {Color} a 
 * @param {Color} b 
 * @param {number} p 
 */
function interpolate(a, b, p)
{

}