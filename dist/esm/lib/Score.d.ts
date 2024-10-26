import { EventEmitter } from "events";
import { type ChordName } from "../const/chords_notes";
import { Tone } from "./Tone";
type Fixed16Array<T> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T];
type NumBool = 0 | 1;
export interface IScoreData {
    chords: Array<ChordName>;
    frames: Array<Fixed16Array<Fixed16Array<NumBool>>>;
    speed: number;
}
interface IScore {
    connect: (context: AudioContext) => void;
    init: (data: Partial<IScoreData>) => void;
    addMeasure: (chord?: ChordName) => Error | undefined;
    removeMeasure: (index: number) => Error | undefined;
    toggleNote: (measureIndex: number, frameIndex: number, noteIndex: number, value?: 0 | 1) => Error | undefined;
    setChord: (measureIndex: number, chord: ChordName) => Error | undefined;
    play: () => void;
    stop: () => void;
}
export declare class Score extends EventEmitter implements IScore {
    context?: AudioContext;
    data: IScoreData;
    tones?: Array<Tone>;
    timer?: number;
    playing: boolean;
    currentChord: ChordName;
    currentFrame: number;
    constructor();
    connect(context?: AudioContext): void;
    init(data?: Partial<IScoreData>): Error | undefined;
    validate(data?: Partial<IScoreData>): Error | undefined;
    initTones(): void;
    addMeasure(chord?: ChordName): Error | undefined;
    removeMeasure(index: number): Error | undefined;
    toggleNote(measureIndex: number, frameIndex: number, noteIndex: number, value?: 0 | 1): Error | undefined;
    setChord(measureIndex: number, chord: ChordName): Error | undefined;
    play(): void;
    stop(): void;
    process(): void;
}
export {};
