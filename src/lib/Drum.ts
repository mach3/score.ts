import { type BeatPattern, getBeatDefinition } from "../const/beats";

export class Drum {
  private context?: AudioContext;
  private destination?: AudioNode;
  private noiseBuffer?: AudioBuffer;

  connect(context: AudioContext, destination: AudioNode) {
    this.context = context;
    this.destination = destination;
    const sampleRate = context.sampleRate;
    const bufferDur = 0.1;
    this.noiseBuffer = context.createBuffer(
      1,
      Math.ceil(sampleRate * bufferDur),
      sampleRate,
    );
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  ping(pattern: BeatPattern, frameInMeasure: number, frameDuration: number) {
    const def = getBeatDefinition(pattern);
    if (def.kick.includes(frameInMeasure)) this.pingKick(frameDuration);
    if (def.hat.includes(frameInMeasure)) this.pingHat(frameDuration);
  }

  private pingKick(frameDuration: number) {
    if (!this.context || !this.destination) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain);
    gain.connect(this.destination);

    const now = this.context.currentTime;
    const dur = Math.min(frameDuration, 0.3);

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + dur * 0.5);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.start(now);
    osc.stop(now + dur);
  }

  private pingHat(frameDuration: number) {
    if (!this.context || !this.destination || !this.noiseBuffer) return;

    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 8000;
    filter.Q.value = 0.5;

    const gain = this.context.createGain();
    const dur = Math.min(frameDuration * 0.7, 0.1);
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination);
    source.start(now);
    source.stop(now + dur);
  }

  disconnect() {
    this.context = undefined;
    this.destination = undefined;
    this.noiseBuffer = undefined;
  }
}
