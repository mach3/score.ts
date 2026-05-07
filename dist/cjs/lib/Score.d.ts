import { EventEmitter } from "node:events";
import { type ChordName } from "../const/chords_notes";
import { type PresetName } from "../const/presets";
import { Tone } from "./Tone";
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
    play: () => void;
    stop: () => void;
    seek: (frame: number) => Error | undefined;
}
export declare class Score extends EventEmitter implements IScore {
    context?: AudioContext;
    masterGain?: GainNode;
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
    setPreset(preset: PresetName): Error | undefined;
    setSpeed(speed: number): Error | undefined;
    randomize(measureIndex: number, callback?: () => boolean): Error | undefined;
    play(): void;
    stop(): void;
    /**
     * 再生位置を任意のフレームに移動する。
     * 単位はフレーム（小節境界をまたぐ通し番号）で、有効範囲は 0〜measures.length*16-1。
     * 再生中に呼ばれた場合もタイマーは継続し、次の process tick で chord 等が追従する。
     */
    seek(frame: number): Error | undefined;
    process(): void;
}
export {};
