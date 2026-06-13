import {
  CHORD_NAMES,
  type ChordName,
  getChordNotes,
} from "../const/chords_notes";
import { getPreset, PRESET_NAMES, type PresetName } from "../const/presets";
import { Tone } from "./Tone";

type ScoreEventName = "change" | "process" | "playingchange";
type ScoreEvent<K extends ScoreEventName> = Event & { type: K; target: Score };

type Fixed16Array<T> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T];

type NumBool = 0 | 1;

const u = {
  // biome-ignore lint/suspicious/noExplicitAny: 汎用ユーティリティのため任意の型を受け取る
  getType: (value: any) => {
    return Object.prototype.toString.call(value).slice(8, -1);
  },
  // biome-ignore lint/suspicious/noExplicitAny: JSON経由のディープクローンのため任意の型を受け取る
  deepClone: (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  },
  random: (): boolean => {
    return Math.random() > 0.75;
  },
  shuffle: <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
};

interface Measure {
  chord: ChordName;
  frames: Fixed16Array<Fixed16Array<NumBool>>;
}

export interface IScoreData {
  measures: Measure[];
  speed: number;
  preset?: PresetName;
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
  preset: "Piano",
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
  setPreset: (preset: PresetName) => Error | undefined;
  setSpeed: (speed: number) => Error | undefined;
  randomize: (
    measureIndex: number,
    callback?: () => boolean,
  ) => Error | undefined;
  sprinkle: (measureIndex: number) => Error | undefined;
  play: () => void;
  stop: () => void;
  seek: (frame: number) => Error | undefined;
  destroy: () => void;
}

export class Score extends EventTarget implements IScore {
  context?: AudioContext;
  masterGain?: GainNode;
  data: IScoreData;
  tones?: Array<Tone>;
  timer?: number;
  playing = false;
  currentChord: ChordName;
  currentFrame = 0;
  private ownsContext = false;
  constructor() {
    super();
    this.data = u.deepClone(DEFAULT_SCORE_DATA);
    this.currentChord = this.data.measures[0].chord;
  }

  on<K extends ScoreEventName>(
    type: K,
    listener: (event: ScoreEvent<K>) => void,
    options?: AddEventListenerOptions | boolean,
  ): void {
    this.addEventListener(type, listener as EventListener, options);
  }

  private emit(type: ScoreEventName) {
    this.dispatchEvent(new Event(type));
  }

  connect(context?: AudioContext) {
    // 引数なしで自前生成した context のみ destroy() で close する（外部渡しは呼び出し側の所有物）。
    this.ownsContext = !context;
    this.context = context || new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 1 / 16;
    this.masterGain.connect(this.context.destination);
    this.initTones();
  }

  init(data?: Partial<IScoreData>) {
    const error = this.validate(data);
    if (error instanceof Error) {
      return new Error(`validate(): ${error.message}`);
    }
    Object.assign(this.data, u.deepClone(data));
    if (data) {
      this.emit("change");
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
    if (data.preset !== undefined) {
      if (!PRESET_NAMES.includes(data.preset)) {
        return new Error("invalid preset value");
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
    const preset = getPreset(this.data.preset ?? "Piano");
    this.tones = getChordNotes(this.currentChord).map((frequency) => {
      const tone = new Tone();
      tone.connect(
        this.context as AudioContext,
        frequency,
        preset,
        this.masterGain as GainNode,
      );
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
    this.emit("change");
  }

  removeMeasure(index: number): Error | undefined {
    if (this.data.measures.length === 1) {
      return new Error("measure cannot be zero");
    }
    if (!this.data.measures.at(index)) {
      return new Error("measure index out of range");
    }
    this.data.measures.splice(index, 1);
    this.emit("change");
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
    this.emit("change");
  }

  setChord(measureIndex: number, chord: ChordName): Error | undefined {
    const measure = this.data.measures.at(measureIndex);
    if (!measure) {
      return new Error("measure index out of range");
    }
    measure.chord = chord;
    this.emit("change");
  }

  setPreset(preset: PresetName): Error | undefined {
    const error = this.validate({ preset });
    if (error instanceof Error) return error;
    this.data.preset = preset;
    if (this.context) {
      const wasPlaying = this.playing;
      clearTimeout(this.timer);
      this.timer = undefined;
      this.initTones();
      if (wasPlaying) {
        this.playing = true;
        this.process();
      }
    }
    this.emit("change");
  }

  setSpeed(speed: number): Error | undefined {
    if (speed <= 0) {
      return new Error("speed must be greater than zero");
    }
    this.data.speed = speed;
    this.emit("change");
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
    this.emit("change");
  }

  sprinkle(measureIndex: number): Error | undefined {
    const measure = this.data.measures.at(measureIndex);
    if (!measure) {
      return new Error("measure index out of range");
    }
    const frames = measure.frames.map((frame) => {
      const emptyIndices = frame.flatMap((note, i) => (note === 0 ? [i] : []));
      if (emptyIndices.length === 0) return frame;
      const count = Math.min(
        Math.random() < 0.8 ? 1 : 2,
        emptyIndices.length,
      );
      const picked = new Set(u.shuffle(emptyIndices).slice(0, count));
      return frame.map((note, i) =>
        picked.has(i) ? 1 : note,
      ) as Fixed16Array<NumBool>;
    });
    measure.frames = frames as Fixed16Array<Fixed16Array<NumBool>>;
    this.emit("change");
  }

  play() {
    this.playing = true;
    // 各 Tone の playing フラグを再有効化する（stop() で false になっている）。
    // OscillatorNode は stop() 後も破棄せず生かしているため、再生成は不要。
    if (this.tones) {
      for (const tone of this.tones) {
        tone.start();
      }
    }
    this.process();
    this.emit("playingchange");
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
    this.emit("playingchange");
  }

  seek(frame: number): Error | undefined {
    if (!Number.isInteger(frame)) {
      return new Error("frame must be an integer");
    }
    if (frame < 0 || frame >= this.data.measures.length * 16) {
      return new Error("frame index out of range");
    }
    this.currentFrame = frame;
  }

  // リソースを完全解放する（使い捨て。destroy 後の再利用は想定しない）。
  destroy() {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.playing = false;
    if (this.tones) {
      for (const tone of this.tones) {
        tone.destroy();
      }
      this.tones = undefined;
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = undefined;
    }
    // 自前生成した context のみ close（外部渡しは呼び出し側の所有物のため触らない）。
    if (this.context && this.ownsContext) {
      this.context.close();
    }
    this.context = undefined;
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
      const notes = getChordNotes(this.currentChord);
      this.tones.forEach((tone, index) => {
        tone.frequency = notes[index];
      });
    }
    frame.forEach((flag, index) => {
      if (flag && this.tones) {
        this.tones[index].ping(1 / this.data.speed);
      }
    });
    this.currentFrame =
      (this.currentFrame + 1) % (this.data.measures.length * 16);
    this.timer = setTimeout(
      () => this.process(),
      1000 / this.data.speed,
    ) as unknown as number;
    this.emit("process");
  }
}
