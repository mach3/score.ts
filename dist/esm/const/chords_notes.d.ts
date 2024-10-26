export declare const CHORD_NAMES: readonly ["A", "A7", "Am", "Am7", "A#", "A#7", "A#m", "A#m7", "B", "B7", "Bm", "Bm7", "C", "C7", "Cm", "Cm7", "C#", "C#7", "C#m", "C#m7", "D", "D7", "Dm", "Dm7", "D#", "D#7", "D#m", "D#m7", "E", "E7", "Em", "Em7", "F", "F7", "Fm", "Fm7", "F#", "F#7", "F#m", "F#m7", "G", "G7", "Gm", "Gm7", "G#", "G#7", "G#m", "G#m7"];
export type ChordName = (typeof CHORD_NAMES)[number];
export declare const CHORDS_NOTES_MAP: Array<{
    key: ChordName;
    value: number[];
}>;
export declare function getChordNotes(chord: ChordName): number[];
