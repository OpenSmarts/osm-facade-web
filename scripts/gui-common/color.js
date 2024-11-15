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

    static from_rgba(r, g, b, a)
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

    minmax()
    {
        let min = this.channels[0];
        let max = this.channels[0];
        for (let i = 1; i < this.channels.length; i++)
        {
            if (this.channels[i] < min)
                min = this.channels[i];
            if (this.channels[i] > max)
                max = this.channels[i];
        }
        return {min: min, max: max};
    }

    rgborder()
    {
        let min, max, mid;
        min = max = mid = this.channels[0];

        for(let i = 1; i < 3; i++)
        {
            if (this.channels[i] < min)
            {
                mid = min;
                min = this.channels[i];
            }
            else if (this.channels[i] > max)
            {
                mid = max;
                max = this.channels[i];
            }
            else
                mid = this.channels[i];
        }

        return {min: min, mid: mid, max: max};
    }

    /**
     * 
     * @returns {number}
     */
    hsv_angle()
    {
        let mm = this.rgborder();
        
        // 0 saturation, angle doesn't matter
        if (mm.max == mm.mid && mm.mid == mm.min)
            return 0;
        
        let sat = 1 - (mm.min / mm.max);
        mm.mid = (mm.mid - mm.min) / sat;
        mm.min = 0;

        // Approx equals
        let eq = Math.abs(mm.max - mm.mid) <= (1 / 256);

        if (mm.mid == 0)
        {
            // RED
            if (mm.max == this.channels[0])
                return 0;
            
            // GREEN
            if (mm.max == this.channels[1])
                return 2 * PI_THIRDS;
            
            // BLUE
            return 4 * PI_THIRDS;
        }
        else if (eq)
        {
            // YELLOW
            if (this.channels[0] == this.channels[1])
                return PI_THIRDS;

            // CYAN
            if (this.channels[1] == this.channels[2])
                return 3 * PI_THIRDS;

            // MAGENTA
            return 5 * PI_THIRDS;
        }
        else
        {
            let out = PI_THIRDS * mm.mid / mm.max;
            // Red range
            if (mm.max == this.channels[0])
            {
                // Correct for Red-magenta range
                if (this.channels[1] < this.channels[2])
                    out = -out;

                out = TWO_PI + out;
            }
            // Green range
            else if (mm.max == this.channels[1])
            {
                // Correct for Green-yellow range
                if (this.channels[0] > this.channels[2])
                    out = -out;

                out = 2 * PI_THIRDS + out;
            }
            // Blue range
            else
            {
                // Correct for Blue-cyan range
                if (this.channels[1] > this.channels[0])
                    out = -out;
                    
                out = 4 * PI_THIRDS + out;
            }
            return out;
        }
    }

    /**
     * @returns {number}
     */
    hsv_mag()
    {
        let mm = this.rgborder();
        return 1 - (mm.min / mm.max);
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
