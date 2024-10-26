interface ITone {
    connect: (context: AudioContext, frequency: number) => void;
    frequency: number;
    start: () => void;
    ping: () => void;
    stop: () => void;
}
export declare class Tone implements ITone {
    context?: AudioContext;
    oscillator?: OscillatorNode;
    gain?: GainNode;
    timer?: number;
    playing: boolean;
    connect(context: AudioContext, frequency: number): void;
    get frequency(): number;
    set frequency(value: number);
    start(): void;
    process(): void;
    stop(): void;
    ping(): void;
}
export {};
