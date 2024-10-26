import { EventEmitter } from "events";
import { CHORD_NAMES, getChordNotes, } from "../const/chords_notes";
import { Tone } from "./Tone";
const u = {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    getType: (value) => {
        return Object.prototype.toString.call(value).slice(8, -1);
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },
};
const DEFAULT_SCORE_DATA = {
    chords: ["A"],
    frames: [
        [
            ...Array.from({ length: 16 }).map(() => {
                return Array.from({ length: 16 }).map(() => 0);
            }),
        ],
    ],
    speed: 8,
};
export class Score extends EventEmitter {
    constructor() {
        super();
        this.playing = false;
        this.currentFrame = 0;
        this.data = u.deepClone(DEFAULT_SCORE_DATA);
        this.currentChord = this.data.chords[0];
    }
    connect(context) {
        this.context = context || new AudioContext();
        this.initTones();
    }
    init(data) {
        const error = this.validate(data);
        if (error instanceof Error) {
            return new Error(`validate(): ${error.message}`);
        }
        Object.assign(this.data, u.deepClone(data));
        if (data) {
            this.emit("change", { target: this });
        }
    }
    validate(data) {
        if (!data)
            return;
        if (data.chords !== undefined) {
            if (!Array.isArray(data.chords) ||
                !data.chords.every((chord) => CHORD_NAMES.includes(chord))) {
                return new Error("invalid chords values");
            }
        }
        if (data.frames !== undefined) {
            if (!Array.isArray(data.frames) ||
                data.frames.length > 16 ||
                !data.frames.every((measure) => {
                    return (measure.length === 16 &&
                        measure.every((frame) => {
                            return (frame.length === 16 &&
                                frame.every((note) => [0, 1].includes(note)));
                        }));
                })) {
                return new Error("invalid frames values");
            }
        }
        if (data.speed !== undefined) {
            if (u.getType(data.speed) !== "Number" || data.speed <= 0) {
                return new Error("invalid speed value");
            }
        }
    }
    initTones() {
        if (!this.context)
            return;
        if (this.tones) {
            for (const tone of this.tones) {
                tone.stop();
            }
        }
        this.currentChord = this.data.chords[0];
        this.tones = getChordNotes(this.currentChord).map((frequency) => {
            const tone = new Tone();
            tone.connect(this.context, frequency);
            tone.start();
            return tone;
        });
    }
    addMeasure(chord) {
        if (this.data.chords.length >= 16) {
            return new Error("measure limit exceeded");
        }
        this.data.chords.push(chord || this.data.chords.at(-1));
        this.data.frames.push(u.deepClone(DEFAULT_SCORE_DATA).frames[0]);
        this.emit("change", { target: this });
    }
    removeMeasure(index) {
        if (this.data.chords.length === 1) {
            return new Error("measure cannot be zero");
        }
        if (!this.data.chords.at(index)) {
            return new Error("measure index out of range");
        }
        this.data.chords.splice(index, 1);
        this.data.frames.splice(index, 1);
        this.emit("change", { target: this });
    }
    toggleNote(measureIndex, frameIndex, noteIndex, value) {
        if (this.data.frames.at(measureIndex) === undefined) {
            return new Error("measure index out of range");
        }
        if (this.data.frames[measureIndex].at(frameIndex) === undefined) {
            return new Error("frame index out of range");
        }
        if (this.data.frames[measureIndex][frameIndex].at(noteIndex) === undefined) {
            return new Error("note index out of range");
        }
        const v = this.data.frames[measureIndex][frameIndex][noteIndex];
        this.data.frames[measureIndex][frameIndex][noteIndex] =
            value !== undefined ? value : v === 1 ? 0 : 1;
        this.emit("change", { target: this });
    }
    setChord(measureIndex, chord) {
        if (!this.data.chords.at(measureIndex)) {
            return new Error("measure index out of range");
        }
        this.data.chords.splice(measureIndex, 1, chord);
        this.emit("change", { target: this });
    }
    play() {
        this.playing = true;
        this.process();
    }
    stop() {
        clearTimeout(this.timer);
        this.playing = false;
    }
    process() {
        if (this.tones === undefined)
            return;
        clearTimeout(this.timer);
        if (!this.playing)
            return;
        const measureIndex = Math.floor(this.currentFrame / 16);
        // NOTE: removeMeasure で再生中のフレームが消えた場合は rewind する
        if (!this.data.frames.at(measureIndex)) {
            this.currentFrame = 0;
            this.process();
            return;
        }
        const frame = this.data.frames[measureIndex][this.currentFrame % 16];
        if (this.data.chords[measureIndex] !== this.currentChord) {
            this.currentChord = this.data.chords[measureIndex];
            this.tones.forEach((tone, index) => {
                tone.frequency = getChordNotes(this.currentChord)[index];
            });
        }
        frame.forEach((flag, index) => {
            if (flag && this.tones) {
                this.tones[index].ping();
            }
        });
        this.currentFrame =
            (this.currentFrame + 1) % (this.data.frames.length * 16);
        this.timer = window.setTimeout(() => this.process(), 1000 / this.data.speed);
        this.emit("process", { target: this });
    }
}
