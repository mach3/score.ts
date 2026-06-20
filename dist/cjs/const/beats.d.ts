export declare const BEAT_PATTERNS: readonly ["kick-2", "kick-4", "kick-8", "triple", "rock", "pop", "offbeat", "shuffle", "16beat"];
export type BeatPattern = (typeof BEAT_PATTERNS)[number];
interface BeatDefinition {
    kick: number[];
    hat: number[];
}
/**
 * ビートパターン名からビート定義を取得する
 * @throws ビートパターンが見つからない場合
 */
export declare function getBeatDefinition(pattern: string): BeatDefinition;
export {};
