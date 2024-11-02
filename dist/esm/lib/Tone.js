export class Tone {
    constructor() {
        this.playing = false;
    }
    connect(context, frequency) {
        this.context = context;
        // oscillator
        this.oscillator = this.context.createOscillator();
        this.oscillator.frequency.value = frequency;
        this.oscillator.type = "sine";
        // gain
        this.gain = this.context.createGain();
        this.gain.gain.value = 0;
        // connect
        this.oscillator.connect(this.gain);
        this.gain.connect(this.context.destination);
        // start
        this.oscillator.start();
    }
    get frequency() {
        var _a;
        return ((_a = this.oscillator) === null || _a === void 0 ? void 0 : _a.frequency.value) || 0;
    }
    set frequency(value) {
        if (this.oscillator) {
            this.oscillator.frequency.value = value;
        }
    }
    start() {
        this.playing = true;
        this.process();
    }
    process() {
        clearTimeout(this.timer);
        if (!this.context || !this.gain || !this.playing)
            return;
        const value = this.gain.gain.value;
        if (value < 0.01) {
            this.gain.gain.value = 0;
        }
        else {
            this.gain.gain.value = value * 0.8;
        }
        this.timer = setTimeout(() => this.process(), 33);
    }
    stop() {
        clearTimeout(this.timer);
        this.timer = undefined;
        this.playing = false;
        if (this.context && this.gain) {
            this.gain.gain.value = 0;
        }
    }
    ping() {
        if (this.playing && this.gain) {
            this.gain.gain.value = 1;
        }
    }
}
