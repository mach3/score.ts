import { type ChordName } from "../const/chords_notes";
import { type PresetName } from "../const/presets";
import { Tone } from "./Tone";
type ScoreEventName = "change" | "process" | "playingchange";
type ScoreEvent<K extends ScoreEventName> = Event & {
    type: K;
    target: Score;
};
type Fixed16Array<T> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T];
type NumBool = 0 | 1;
interface Measure {
    chord: ChordName;
    frames: Fixed16Array<Fixed16Array<NumBool>>;
}
export interface IScoreData {
    measures: Measure[];
    speed: number;
    preset?: PresetName;
}
interface IScore {
    connect: (context: AudioContext) => void;
    init: (data: Partial<IScoreData>) => void;
    addMeasure: (chord?: ChordName) => Error | undefined;
    removeMeasure: (index: number) => Error | undefined;
    toggleNote: (measureIndex: number, frameIndex: number, noteIndex: number, value?: 0 | 1) => Error | undefined;
    setChord: (measureIndex: number, chord: ChordName) => Error | undefined;
    setPreset: (preset: PresetName) => Error | undefined;
    setSpeed: (speed: number) => Error | undefined;
    randomize: (measureIndex: number, callback?: () => boolean) => Error | undefined;
    sprinkle: (measureIndex: number) => Error | undefined;
    play: () => void;
    stop: () => void;
    seek: (frame: number) => Error | undefined;
    destroy: () => void;
}
export declare class Score extends EventTarget implements IScore {
    context?: AudioContext;
    masterGain?: GainNode;
    data: IScoreData;
    tones?: Array<Tone>;
    timer?: number;
    playing: boolean;
    currentChord: ChordName;
    currentFrame: number;
    private ownsContext;
    constructor();
    on<K extends ScoreEventName>(type: K, listener: (event: ScoreEvent<K>) => void, options?: AddEventListenerOptions | boolean): void;
    private emit;
    connect(context?: AudioContext): void;
    init(data?: Partial<IScoreData>): Error | undefined;
    validate(data?: Partial<IScoreData>): Error | undefined;
    initTones(): void;
    addMeasure(chord?: ChordName): Error | undefined;
    removeMeasure(index: number): Error | undefined;
    toggleNote(measureIndex: number, frameIndex: number, noteIndex: number, value?: 0 | 1): Error | undefined;
    setChord(measureIndex: number, chord: ChordName): Error | undefined;
    setPreset(preset: PresetName): Error | undefined;
    setSpeed(speed: number): Error | undefined;
    randomize(measureIndex: number, callback?: () => boolean): Error | undefined;
    sprinkle(measureIndex: number): Error | undefined;
    play(): void;
    stop(): void;
    seek(frame: number): Error | undefined;
    destroy(): void;
    process(): void;
}
export {};
