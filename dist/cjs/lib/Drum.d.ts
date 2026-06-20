import { type BeatPattern } from "../const/beats";
export declare class Drum {
    private context?;
    private destination?;
    private noiseBuffer?;
    private hatFilter?;
    connect(context: AudioContext, destination: AudioNode): void;
    ping(pattern: BeatPattern, frameInMeasure: number, frameDuration: number): void;
    private scheduleSource;
    private pingKick;
    private pingHat;
    disconnect(): void;
}
