import type { AdsrParams, TonePreset } from "../const/presets";
interface ITone {
    connect: (context: AudioContext, frequency: number, preset: TonePreset, destination: AudioNode) => void;
    frequency: number;
    start: () => void;
    ping: (noteDuration: number) => void;
    stop: () => void;
}
export declare class Tone implements ITone {
    context?: AudioContext;
    oscillator?: OscillatorNode;
    gain?: GainNode;
    playing: boolean;
    adsr?: AdsrParams;
    connect(context: AudioContext, frequency: number, preset: TonePreset, destination: AudioNode): void;
    get frequency(): number;
    set frequency(value: number);
    start(): void;
    stop(): void;
    ping(noteDuration: number): void;
}
export {};
