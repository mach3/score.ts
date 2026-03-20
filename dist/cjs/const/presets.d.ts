/** ADSRエンベロープのパラメータ（時間単位は秒） */
export interface AdsrParams {
    /** アタック時間（gain 0 → peak 到達まで） */
    attack: number;
    /** ディケイ時間（peak → sustain まで） */
    decay: number;
    /** サステインレベル（0.0〜1.0） */
    sustain: number;
    /** リリース時間（sustain → 0 まで） */
    release: number;
}
/** 標準オシレータ波形を使うプリセット */
interface StandardWavePreset {
    waveType: "sine" | "square" | "sawtooth" | "triangle";
    adsr: AdsrParams;
}
/** PeriodicWave を使うカスタム波形プリセット */
interface PeriodicWavePreset {
    waveType: "custom";
    /** フーリエ係数（実部）。インデックス0=DC成分, 1=基音, 2=2倍音... */
    real: number[];
    /** フーリエ係数（虚部）。通常すべて0 */
    imag: number[];
    adsr: AdsrParams;
}
export type TonePreset = StandardWavePreset | PeriodicWavePreset;
export declare const PRESET_NAMES: readonly ["Piano", "Organ", "Bass", "Lead", "Strings", "Pad", "Pluck", "Bell", "Guitar", "Flute"];
export type PresetName = (typeof PRESET_NAMES)[number];
/**
 * プリセット名からプリセット定義を取得する
 * @throws プリセットが見つからない場合
 */
export declare function getPreset(name: string): TonePreset;
export {};
