"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Score = void 0;
const events_1 = require("events");
const chords_notes_1 = require("../const/chords_notes");
const Tone_1 = require("./Tone");
const u = {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    getType: (value) => {
        return Object.prototype.toString.call(value).slice(8, -1);
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },
    random: () => {
        return Math.random() > 0.75;
    },
};
const createEmptyFrames = () => {
    return Array.from({ length: 16 }).map(() => {
        return Array.from({ length: 16 }).map(() => 0);
    });
};
const DEFAULT_SCORE_DATA = {
    measures: [
        {
            chord: "A",
            frames: createEmptyFrames(),
        },
    ],
    speed: 8,
};
class Score extends events_1.EventEmitter {
    constructor() {
        super();
        this.playing = false;
        this.currentFrame = 0;
        this.data = u.deepClone(DEFAULT_SCORE_DATA);
        this.currentChord = this.data.measures[0].chord;
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
        if (data.measures !== undefined) {
            if (!Array.isArray(data.measures) || data.measures.length > 16) {
                return new Error("invalid measures values");
            }
            for (const measure of data.measures) {
                if (!chords_notes_1.CHORD_NAMES.includes(measure.chord)) {
                    return new Error("invalid chord value");
                }
                if (!Array.isArray(measure.frames) ||
                    measure.frames.length !== 16 ||
                    !measure.frames.every((frame) => {
                        return (frame.length === 16 &&
                            frame.every((note) => [0, 1].includes(note)));
                    })) {
                    return new Error("invalid frames values");
                }
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
        this.currentChord = this.data.measures[0].chord;
        this.tones = (0, chords_notes_1.getChordNotes)(this.currentChord).map((frequency) => {
            const tone = new Tone_1.Tone();
            tone.connect(this.context, frequency);
            tone.start();
            return tone;
        });
    }
    addMeasure(chord) {
        if (this.data.measures.length >= 16) {
            return new Error("measure limit exceeded");
        }
        const lastMeasure = this.data.measures.at(-1);
        this.data.measures.push({
            chord: chord || (lastMeasure === null || lastMeasure === void 0 ? void 0 : lastMeasure.chord),
            frames: createEmptyFrames(),
        });
        this.emit("change", { target: this });
    }
    removeMeasure(index) {
        if (this.data.measures.length === 1) {
            return new Error("measure cannot be zero");
        }
        if (!this.data.measures.at(index)) {
            return new Error("measure index out of range");
        }
        this.data.measures.splice(index, 1);
        this.emit("change", { target: this });
    }
    toggleNote(measureIndex, frameIndex, noteIndex, value) {
        const measure = this.data.measures.at(measureIndex);
        if (measure === undefined) {
            return new Error("measure index out of range");
        }
        if (measure.frames.at(frameIndex) === undefined) {
            return new Error("frame index out of range");
        }
        if (measure.frames[frameIndex].at(noteIndex) === undefined) {
            return new Error("note index out of range");
        }
        const v = measure.frames[frameIndex][noteIndex];
        measure.frames[frameIndex][noteIndex] =
            value !== undefined ? value : v === 1 ? 0 : 1;
        this.emit("change", { target: this });
    }
    setChord(measureIndex, chord) {
        const measure = this.data.measures.at(measureIndex);
        if (!measure) {
            return new Error("measure index out of range");
        }
        measure.chord = chord;
        this.emit("change", { target: this });
    }
    setSpeed(speed) {
        if (speed <= 0) {
            return new Error("speed must be greater than zero");
        }
        this.data.speed = speed;
        this.emit("change", { target: this });
    }
    randomize(measureIndex, callback = u.random) {
        const measure = this.data.measures.at(measureIndex);
        if (!measure) {
            return new Error("measure index out of range");
        }
        const frames = measure.frames.map((frame) => {
            return frame.map(() => (callback() ? 1 : 0));
        });
        measure.frames = frames;
        this.emit("change", { target: this });
    }
    play() {
        this.playing = true;
        this.process();
        if (this.context && this.tones) {
            for (const tone of this.tones) {
                tone.start();
            }
        }
    }
    stop() {
        clearTimeout(this.timer);
        this.timer = undefined;
        this.playing = false;
        if (this.context && this.tones) {
            for (const tone of this.tones) {
                tone.stop();
            }
        }
    }
    process() {
        if (this.tones === undefined)
            return;
        clearTimeout(this.timer);
        if (!this.playing)
            return;
        const measureIndex = Math.floor(this.currentFrame / 16);
        const measure = this.data.measures.at(measureIndex);
        // NOTE: removeMeasure で再生中のフレームが消えた場合は rewind する
        if (!measure) {
            this.currentFrame = 0;
            this.process();
            return;
        }
        const frame = measure.frames[this.currentFrame % 16];
        if (measure.chord !== this.currentChord) {
            this.currentChord = measure.chord;
            this.tones.forEach((tone, index) => {
                tone.frequency = (0, chords_notes_1.getChordNotes)(this.currentChord)[index];
            });
        }
        frame.forEach((flag, index) => {
            if (flag && this.tones) {
                this.tones[index].ping();
            }
        });
        this.currentFrame =
            (this.currentFrame + 1) % (this.data.measures.length * 16);
        this.timer = setTimeout(() => this.process(), 1000 / this.data.speed);
        this.emit("process", { target: this });
    }
}
exports.Score = Score;
