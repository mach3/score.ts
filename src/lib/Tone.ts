interface ITone {
  connect: (context: AudioContext, frequency: number) => void;
  frequency: number;
  start: () => void;
  ping: () => void;
  stop: () => void;
}

export class Tone implements ITone {
  context?: AudioContext;
  oscillator?: OscillatorNode;
  gain?: GainNode;
  timer?: number;
  playing = false;

  connect(context: AudioContext, frequency: number) {
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
    return this.oscillator?.frequency.value || 0;
  }

  set frequency(value: number) {
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
    if (!this.context || !this.gain || !this.playing) return;
    const value = this.gain.gain.value;
    if (value < 0.01) {
      this.gain.gain.value = 0;
    } else {
      this.gain.gain.value = value * 0.8;
    }
    this.timer = setTimeout(() => this.process(), 33) as unknown as number;
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
