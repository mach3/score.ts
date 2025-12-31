import { EventEmitter } from "events";

import {
  CHORD_NAMES,
  type ChordName,
  getChordNotes,
} from "../const/chords_notes";
import { Tone } from "./Tone";

type Fixed16Array<T> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T];

type NumBool = 0 | 1;

const u = {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  getType: (value: any) => {
    return Object.prototype.toString.call(value).slice(8, -1);
  },
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  deepClone: (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  },
  random: (): boolean => {
    return Math.random() > 0.75;
  },
};

interface Measure {
  chord: ChordName;
  frames: Fixed16Array<Fixed16Array<NumBool>>;
}

export interface IScoreData {
  measures: Measure[];
  speed: number;
}

const createEmptyFrames = (): Fixed16Array<Fixed16Array<NumBool>> => {
  return Array.from({ length: 16 }).map(() => {
    return Array.from({ length: 16 }).map(() => 0);
  }) as Fixed16Array<Fixed16Array<NumBool>>;
};

const DEFAULT_SCORE_DATA: IScoreData = {
  measures: [
    {
      chord: "A",
      frames: createEmptyFrames(),
    },
  ],
  speed: 8,
};

interface IScore {
  connect: (context: AudioContext) => void;
  init: (data: Partial<IScoreData>) => void;
  addMeasure: (chord?: ChordName) => Error | undefined;
  removeMeasure: (index: number) => Error | undefined;
  toggleNote: (
    measureIndex: number,
    frameIndex: number,
    noteIndex: number,
    value?: 0 | 1,
  ) => Error | undefined;
  setChord: (measureIndex: number, chord: ChordName) => Error | undefined;
  setSpeed: (speed: number) => Error | undefined;
  randomize: (
    measureIndex: number,
    callback?: () => boolean,
  ) => Error | undefined;
  play: () => void;
  stop: () => void;
}

export class Score extends EventEmitter implements IScore {
  context?: AudioContext;
  data: IScoreData;
  tones?: Array<Tone>;
  timer?: number;
  playing = false;
  currentChord: ChordName;
  currentFrame = 0;

  constructor() {
    super();
    this.data = u.deepClone(DEFAULT_SCORE_DATA);
    this.currentChord = this.data.measures[0].chord;
  }

  connect(context?: AudioContext) {
    this.context = context || new AudioContext();
    this.initTones();
  }

  init(data?: Partial<IScoreData>) {
    const error = this.validate(data);
    if (error instanceof Error) {
      return new Error(`validate(): ${error.message}`);
    }
    Object.assign(this.data, u.deepClone(data));
    if (data) {
      this.emit("change", { target: this });
    }
  }

  validate(data?: Partial<IScoreData>) {
    if (!data) return;
    if (data.measures !== undefined) {
      if (!Array.isArray(data.measures) || data.measures.length > 16) {
        return new Error("invalid measures values");
      }
      for (const measure of data.measures) {
        if (!CHORD_NAMES.includes(measure.chord)) {
          return new Error("invalid chord value");
        }
        if (
          !Array.isArray(measure.frames) ||
          measure.frames.length !== 16 ||
          !measure.frames.every((frame) => {
            return (
              frame.length === 16 &&
              frame.every((note) => [0, 1].includes(note))
            );
          })
        ) {
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
    if (!this.context) return;
    if (this.tones) {
      for (const tone of this.tones) {
        tone.stop();
      }
    }
    this.currentChord = this.data.measures[0].chord;
    this.tones = getChordNotes(this.currentChord).map((frequency) => {
      const tone = new Tone();
      tone.connect(this.context as AudioContext, frequency);
      tone.start();
      return tone;
    });
  }

  addMeasure(chord?: ChordName): Error | undefined {
    if (this.data.measures.length >= 16) {
      return new Error("measure limit exceeded");
    }
    const lastMeasure = this.data.measures.at(-1);
    this.data.measures.push({
      chord: chord || (lastMeasure?.chord as ChordName),
      frames: createEmptyFrames(),
    });
    this.emit("change", { target: this });
  }

  removeMeasure(index: number): Error | undefined {
    if (this.data.measures.length === 1) {
      return new Error("measure cannot be zero");
    }
    if (!this.data.measures.at(index)) {
      return new Error("measure index out of range");
    }
    this.data.measures.splice(index, 1);
    this.emit("change", { target: this });
  }

  toggleNote(
    measureIndex: number,
    frameIndex: number,
    noteIndex: number,
    value?: 0 | 1,
  ): Error | undefined {
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

  setChord(measureIndex: number, chord: ChordName): Error | undefined {
    const measure = this.data.measures.at(measureIndex);
    if (!measure) {
      return new Error("measure index out of range");
    }
    measure.chord = chord;
    this.emit("change", { target: this });
  }

  setSpeed(speed: number): Error | undefined {
    if (speed <= 0) {
      return new Error("speed must be greater than zero");
    }
    this.data.speed = speed;
    this.emit("change", { target: this });
  }

  randomize(
    measureIndex: number,
    callback: () => boolean = u.random,
  ): Error | undefined {
    const measure = this.data.measures.at(measureIndex);
    if (!measure) {
      return new Error("measure index out of range");
    }
    const frames = measure.frames.map((frame) => {
      return frame.map(() => (callback() ? 1 : 0));
    });
    measure.frames = frames as Fixed16Array<Fixed16Array<NumBool>>;
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
    if (this.tones === undefined) return;
    clearTimeout(this.timer);
    if (!this.playing) return;
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
        tone.frequency = getChordNotes(this.currentChord)[index];
      });
    }
    frame.forEach((flag, index) => {
      if (flag && this.tones) {
        this.tones[index].ping();
      }
    });
    this.currentFrame =
      (this.currentFrame + 1) % (this.data.measures.length * 16);
    this.timer = setTimeout(
      () => this.process(),
      1000 / this.data.speed,
    ) as unknown as number;
    this.emit("process", { target: this });
  }
}
