import {
  type ChordName,
  type IScoreData,
  type PresetName,
  Score,
} from "../src";
import { getChordNotes } from "../src/const/chords_notes";
import { getPreset } from "../src/const/presets";

describe("Score Class", () => {
  const emptyMeasure = Array.from({ length: 16 }).map(() => {
    return Array.from({ length: 16 }).map(() => 0);
  });

  const chordNames: ChordName[] = ["A", "C7", "Dm7", "G"];
  const dummyData = {
    measures: chordNames.map((chord) => ({
      chord,
      frames: Array.from({ length: 16 }).map(() => {
        return Array.from({ length: 16 }).map(() =>
          Math.random() > 0.5 ? 1 : 0,
        );
      }),
    })),
    speed: 8,
  } as IScoreData;

  const mockAudioContext = {
    currentTime: 0,
    createOscillator: jest.fn(() => ({
      frequency: { value: 0 },
      type: "sine",
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn(),
      setPeriodicWave: jest.fn(),
    })),
    createGain: jest.fn(() => ({
      gain: {
        value: 0,
        cancelScheduledValues: jest.fn(),
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
      disconnect: jest.fn(),
    })),
    createPeriodicWave: jest.fn(() => ({})),
    destination: {},
  };

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("initialize", () => {
    const score = new Score();
    // 初期値が正しい
    expect(score.data.measures.length).toBe(1);
    expect(score.data.measures[0].chord).toBe("A");
    expect(score.data.measures[0].frames).toEqual(emptyMeasure);
    expect(score.data.speed).toBe(8);
    expect(score.data.preset).toBe("Piano");
  });

  test("validate data when initialize", () => {
    const score = new Score();

    // check measures error (not array)
    expect(
      score.init({ measures: 1 as unknown as IScoreData["measures"] }),
    ).toBeInstanceOf(Error);

    // check measures error (invalid chord)
    expect(
      score.init({
        measures: [{ chord: "X" as ChordName, frames: emptyMeasure }],
      } as IScoreData),
    ).toBeInstanceOf(Error);

    // check measures error (invalid frames)
    expect(
      score.init({
        measures: [{ chord: "A", frames: 1 }],
      } as unknown as IScoreData),
    ).toBeInstanceOf(Error);
    expect(
      score.init({
        measures: [{ chord: "A", frames: [1] }],
      } as unknown as IScoreData),
    ).toBeInstanceOf(Error);
    expect(
      score.init({
        measures: [{ chord: "A", frames: [[1]] }],
      } as unknown as IScoreData),
    ).toBeInstanceOf(Error);
    expect(
      score.init({
        measures: [
          {
            chord: "A",
            frames: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
          },
        ],
      } as unknown as IScoreData),
    ).toBeInstanceOf(Error);

    // check speed
    expect(
      score.init({
        speed: "1" as unknown as IScoreData["speed"],
      }),
    ).toBeInstanceOf(Error);

    // check preset (invalid)
    expect(
      score.init({
        preset: "InvalidPreset" as PresetName,
      }),
    ).toBeInstanceOf(Error);

    // check preset (valid)
    expect(score.init({ preset: "Organ" })).toBeUndefined();
    expect(score.data.preset).toBe("Organ");

    // check dummy data
    expect(score.init(dummyData)).toBeUndefined();
  });

  test("manupulate measure", () => {
    const score = new Score();
    score.init(dummyData);
    // add measure
    score.addMeasure("F");
    expect(score.data.measures.length).toBe(5);
    expect(score.data.measures.at(-1)?.frames).toEqual(emptyMeasure);
    expect(score.data.measures.at(-1)?.chord).toBe("F");

    // add measure without chord
    score.addMeasure();
    expect(score.data.measures.length).toBe(6);
    expect(score.data.measures.at(-1)?.chord).toBe("F");

    // remove a measure
    score.removeMeasure(2);
    expect(score.data.measures.length).toBe(5);
    expect(score.data.measures.map((m) => m.chord)).toEqual([
      "A",
      "C7",
      "G",
      "F",
      "F",
    ]);

    // remove measures to empty (error)
    score.removeMeasure(0);
    score.removeMeasure(0);
    score.removeMeasure(0);
    score.removeMeasure(0);
    expect(score.removeMeasure(0)).toBeInstanceOf(Error);

    // add measure to full (error)
    score.init(dummyData);
    let i = 12;
    while (i--) {
      score.addMeasure();
    }
    expect(score.addMeasure()).toBeInstanceOf(Error);
  });

  test("manupulate note", () => {
    const score = new Score();
    score.addMeasure();

    score.toggleNote(1, 0, 0);
    expect(score.data.measures[1].frames[0][0]).toBe(1);
    score.toggleNote(1, 0, 0, 1);
    expect(score.data.measures[1].frames[0][0]).toBe(1);

    expect(score.toggleNote(16, 0, 0)).toBeInstanceOf(Error);
    expect(score.toggleNote(0, 16, 0)).toBeInstanceOf(Error);
    expect(score.toggleNote(0, 0, 16)).toBeInstanceOf(Error);
  });

  test("manupulate chord", () => {
    const score = new Score();
    score.addMeasure();
    expect(score.data.measures[1].chord).toBe("A");
    score.setChord(1, "C7");
    expect(score.data.measures[1].chord).toBe("C7");
    expect(score.setChord(16, "C7")).toBeInstanceOf(Error);
  });

  test("manupulate preset", () => {
    const score = new Score();
    expect(score.data.preset).toBe("Piano");

    // 正常系
    expect(score.setPreset("Organ")).toBeUndefined();
    expect(score.data.preset).toBe("Organ");

    expect(score.setPreset("Bell")).toBeUndefined();
    expect(score.data.preset).toBe("Bell");

    // 異常系
    expect(score.setPreset("InvalidPreset" as PresetName)).toBeInstanceOf(
      Error,
    );
    // 失敗後も前の値が保持される
    expect(score.data.preset).toBe("Bell");
  });

  test("setPreset emits change event", () => {
    const score = new Score();
    const handler = jest.fn();
    score.on("change", handler);

    score.setPreset("Lead");
    expect(handler).toHaveBeenCalled();
  });

  test("setPreset reinitializes tones when connected", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);

    const firstTones = score.tones;
    score.setPreset("Organ");

    expect(score.tones).not.toBe(firstTones);
    expect(firstTones?.every((tone) => !tone.playing)).toBe(true);
    score.stop();
  });

  test("setPreset during playback does not double-schedule process", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.play();

    const frameTime = 1000 / score.data.speed;
    jest.advanceTimersByTime(frameTime * 2);
    const frameBefore = score.currentFrame;

    // setPreset 内で process() が同期的に1回走り +1、その後 timer で +1 = 合計 +2
    score.setPreset("Organ");
    jest.advanceTimersByTime(frameTime);
    expect(score.currentFrame).toBe(frameBefore + 2);

    // さらに1フレーム進めて正常にスケジュールされていることを確認
    const frameAfter = score.currentFrame;
    jest.advanceTimersByTime(frameTime);
    expect(score.currentFrame).toBe(frameAfter + 1);

    score.stop();
  });

  test("manupulate speed", () => {
    const score = new Score();
    expect(score.data.speed).toBe(8);
    score.setSpeed(4);
    expect(score.data.speed).toBe(4);
    expect(score.setSpeed(0)).toBeInstanceOf(Error);
    expect(score.setSpeed(-1)).toBeInstanceOf(Error);
  });

  test("randomize measure", () => {
    const score = new Score();
    score.addMeasure();
    score.addMeasure();
    score.randomize(1);
    expect(score.data.measures[1].frames).not.toEqual(emptyMeasure);
    score.randomize(1, () => false);
    expect(score.data.measures[1].frames).toEqual(emptyMeasure);
  });

  test("removeMeasure out of range", () => {
    const score = new Score();
    expect(score.removeMeasure(5)).toBeInstanceOf(Error);
  });

  test("randomize out of range", () => {
    const score = new Score();
    expect(score.randomize(5)).toBeInstanceOf(Error);
  });

  test("play", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.play();
    expect(score.playing).toBe(true);
    expect(score.tones?.length).toBe(16);
    expect(score.tones?.every((tone) => tone.playing)).toBe(true);
    score.stop();
    expect(score.playing).toBe(false);
    expect(score.tones?.every((tone) => !tone.playing)).toBe(true);
  });

  test("initTones reinitializes existing tones", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    const firstTones = score.tones;
    score.initTones();
    expect(firstTones?.every((tone) => !tone.playing)).toBe(true);
    expect(score.tones).not.toBe(firstTones);
    score.stop();
  });

  test("process advances frame and handles chord change", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.init(dummyData);
    score.initTones();
    score.play();
    expect(score.currentFrame).toBe(1);

    // フレームを進めてコード切替を確認（小節境界を超える）
    const frameTime = 1000 / score.data.speed;
    jest.advanceTimersByTime(frameTime * 16);
    expect(score.currentChord).toBe(score.data.measures[1].chord);

    score.stop();
  });

  test("seek updates currentFrame within range", () => {
    const score = new Score();
    score.init(dummyData);

    expect(score.seek(0)).toBeUndefined();
    expect(score.currentFrame).toBe(0);

    const lastFrame = score.data.measures.length * 16 - 1;
    expect(score.seek(lastFrame)).toBeUndefined();
    expect(score.currentFrame).toBe(lastFrame);
  });

  test("seek returns Error for out-of-range frame", () => {
    const score = new Score();
    score.init(dummyData);
    const upperBound = score.data.measures.length * 16;

    expect(score.seek(-1)).toBeInstanceOf(Error);
    expect(score.seek(upperBound)).toBeInstanceOf(Error);
    // 失敗時は currentFrame が変わらない
    expect(score.currentFrame).toBe(0);
  });

  test("seek returns Error for non-integer frame", () => {
    const score = new Score();
    score.init(dummyData);

    expect(score.seek(1.5)).toBeInstanceOf(Error);
    expect(score.seek(Number.NaN)).toBeInstanceOf(Error);
    expect(score.seek(Number.POSITIVE_INFINITY)).toBeInstanceOf(Error);
    expect(score.currentFrame).toBe(0);
  });

  test("seek during playback keeps timer running and advances from new position", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.init(dummyData);
    score.initTones();
    score.play();

    const target = 2 * 16; // 3小節目の先頭
    expect(score.seek(target)).toBeUndefined();
    expect(score.currentFrame).toBe(target);
    expect(score.playing).toBe(true);

    const frameTime = 1000 / score.data.speed;
    jest.advanceTimersByTime(frameTime);
    expect(score.currentFrame).toBe(target + 1);

    score.stop();
  });

  test("process rewinds when measure is removed during playback", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.addMeasure();
    score.initTones();
    score.play();

    // 2小節目まで進める（16フレーム = 1小節分）
    const frameTime = 1000 / score.data.speed;
    jest.advanceTimersByTime(frameTime * 16);
    expect(score.currentFrame).toBeGreaterThanOrEqual(17);

    // 2小節目を削除 → process が rewind するはず
    score.removeMeasure(1);
    jest.advanceTimersByTime(frameTime);
    expect(score.currentFrame).toBeLessThan(16);

    score.stop();
  });
});

describe("getChordNotes", () => {
  test("returns notes for valid chord", () => {
    const notes = getChordNotes("A");
    expect(notes).toHaveLength(16);
    expect(notes.every((n) => typeof n === "number")).toBe(true);
  });

  test("throws for invalid chord", () => {
    expect(() => getChordNotes("InvalidChord" as never)).toThrow(
      'Chord "InvalidChord" not found',
    );
  });
});

describe("getPreset", () => {
  test("returns preset for valid name", () => {
    const preset = getPreset("Piano");
    expect(preset).toBeDefined();
    expect(preset.waveType).toBe("custom");
    expect(preset.adsr).toBeDefined();
    expect(preset.adsr.attack).toBeGreaterThanOrEqual(0);
  });

  test("returns different presets for different names", () => {
    const piano = getPreset("Piano");
    const organ = getPreset("Organ");
    expect(piano).not.toEqual(organ);
  });

  test("throws for invalid preset name", () => {
    expect(() => getPreset("InvalidPreset")).toThrow(
      'Preset "InvalidPreset" not found',
    );
  });
});
