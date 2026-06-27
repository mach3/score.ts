import {
  type BeatPattern,
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
    sampleRate: 44100,
    createOscillator: jest.fn(() => ({
      frequency: {
        value: 0,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
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
    createBuffer: jest.fn(() => ({
      getChannelData: jest.fn(() => new Float32Array(4410)),
    })),
    createBufferSource: jest.fn(() => ({
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createBiquadFilter: jest.fn(() => ({
      type: "bandpass",
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    })),
    close: jest.fn(),
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

    // check speed (range/type details are covered by the setSpeed test;
    // here we only verify that init forwards validation for non-number input)
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

    // boundary values pass
    for (const ok of [1, 16]) {
      expect(score.setSpeed(ok)).toBeUndefined();
      expect(score.data.speed).toBe(ok);
    }

    // out of range / non-integer / NaN / Infinity return Error and leave value unchanged
    for (const bad of [
      0,
      -1,
      0.5,
      1.5,
      7.3,
      17,
      100,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      expect(score.setSpeed(bad)).toBeInstanceOf(Error);
      expect(score.data.speed).toBe(16);
    }
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

  test("clear measure", () => {
    const score = new Score();
    score.init(dummyData);
    score.clear(0);
    expect(score.data.measures[0].frames).toEqual(emptyMeasure);
  });

  test("clear out of range", () => {
    const score = new Score();
    expect(score.clear(5)).toBeInstanceOf(Error);
  });

  test("sprinkle adds notes without removing existing ones", () => {
    const score = new Score();
    score.addMeasure();
    score.toggleNote(1, 0, 0);
    score.toggleNote(1, 0, 1);
    score.sprinkle(1);
    const after = score.data.measures[1].frames[0];
    expect(after[0]).toBe(1);
    expect(after[1]).toBe(1);
  });

  test("sprinkle on full frame does not change it", () => {
    const score = new Score();
    score.addMeasure();
    // フレーム 0 を全て 1 にする
    for (let i = 0; i < 16; i++) {
      score.toggleNote(1, 0, i, 1);
    }
    const before = score.data.measures[1].frames[0].slice();
    score.sprinkle(1);
    expect(score.data.measures[1].frames[0]).toEqual(before);
  });

  test("sprinkle on empty measure adds 1 or 2 notes per frame", () => {
    const score = new Score();
    score.addMeasure();
    score.sprinkle(1);
    for (const frame of score.data.measures[1].frames) {
      const count = frame.filter((n) => n === 1).length;
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  test("sprinkle out of range", () => {
    const score = new Score();
    expect(score.sprinkle(5)).toBeInstanceOf(Error);
  });

  test("setBeat sets beat pattern", () => {
    const score = new Score();
    expect(score.data.beat).toBeUndefined();
    expect(score.setBeat("rock")).toBeUndefined();
    expect(score.data.beat).toBe("rock");
    expect(score.setBeat(undefined)).toBeUndefined();
    expect(score.data.beat).toBeUndefined();
  });

  test("setBeat returns Error for invalid pattern", () => {
    const score = new Score();
    expect(score.setBeat("invalid" as BeatPattern)).toBeInstanceOf(Error);
    expect(score.data.beat).toBeUndefined();
  });

  test("setBeat emits change event", () => {
    const score = new Score();
    const handler = jest.fn();
    score.on("change", handler);
    score.setBeat("pop");
    expect(handler).toHaveBeenCalled();
  });

  test("setVolume sets volume", () => {
    const score = new Score();
    expect(score.volume).toBe(1.0);
    expect(score.setVolume(0.5)).toBeUndefined();
    expect(score.volume).toBe(0.5);
  });

  test("setVolume returns Error for out-of-range values", () => {
    const score = new Score();
    expect(score.setVolume(-0.1)).toBeInstanceOf(Error);
    expect(score.setVolume(1.1)).toBeInstanceOf(Error);
    expect(score.setVolume(Number.NaN)).toBeInstanceOf(Error);
    // エラー後も値は保持される
    expect(score.volume).toBe(1.0);
  });

  test("setVolume updates masterGain after connect", () => {
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.setVolume(0.3);
    expect(score.masterGain?.gain.value).toBe(0.3);
  });

  test("setVolume before connect is applied to masterGain at connect", () => {
    const score = new Score();
    score.setVolume(0.4);
    score.connect(mockAudioContext as unknown as AudioContext);
    expect(score.masterGain?.gain.value).toBe(0.4);
  });

  test("setVolume does not emit change", () => {
    const score = new Score();
    const handler = jest.fn();
    score.on("change", handler);
    score.setVolume(0.5);
    expect(handler).not.toHaveBeenCalled();
  });

  test("init accepts beat in IScoreData", () => {
    const score = new Score();
    expect(score.init({ beat: "rock" })).toBeUndefined();
    expect(score.data.beat).toBe("rock");
    expect(score.init({ beat: "invalid" as BeatPattern })).toBeInstanceOf(
      Error,
    );
    // エラー後も値は保持される
    expect(score.data.beat).toBe("rock");
  });

  test("process triggers kick when beat is set and connected", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.setBeat("kick-4");
    mockAudioContext.createOscillator.mockClear();
    score.play(); // frame 0 は kick-4 のキックフレーム
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    score.stop();
  });

  test("process triggers hat when beat with hat frames is set and connected", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.setBeat("rock"); // hat: [0,2,4,...] — frame 0 にキック＋ハイハット
    mockAudioContext.createBufferSource.mockClear();
    score.play();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    score.stop();
  });

  test("setBeat(undefined) stops drum triggering on subsequent process ticks", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.setBeat("kick-4"); // frame 0, 4, 8, 12 で kick
    mockAudioContext.createOscillator.mockClear();
    score.play(); // frame 0 で kick が発火
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();

    score.setBeat(undefined);
    mockAudioContext.createOscillator.mockClear();
    // 次の kick フレーム（frame 4）まで進める
    jest.advanceTimersByTime((1000 / score.data.speed) * 4);
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    score.stop();
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

  test("play emits playingchange with playing = true", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    const handler = jest.fn();
    score.on("playingchange", handler);

    score.play();
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as Event).target).toBe(score);
    expect(score.playing).toBe(true);
    score.stop();
  });

  test("stop emits playingchange with playing = false", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.play();
    const handler = jest.fn();
    score.on("playingchange", handler);

    score.stop();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(score.playing).toBe(false);
  });

  test("destroy does not emit playingchange", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    score.play();
    const handler = jest.fn();
    score.on("playingchange", handler);

    score.destroy();
    expect(handler).not.toHaveBeenCalled();
  });

  test("replay after stop reuses tones without recreating oscillators", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    const tonesBeforePlay = score.tones;
    score.play();
    score.stop();
    expect(score.tones?.every((tone) => !tone.playing)).toBe(true);

    // 再 play で OscillatorNode を作り直さず（同一参照のまま）、
    // playing フラグが再有効化されること（これが無いと ping が鳴らない）。
    score.play();
    expect(score.tones).toBe(tonesBeforePlay);
    expect(score.tones?.every((tone) => tone.oscillator !== undefined)).toBe(
      true,
    );
    expect(score.tones?.every((tone) => tone.playing)).toBe(true);
    score.stop();
  });

  test("destroy releases all audio resources", () => {
    jest.useFakeTimers();
    const score = new Score();
    score.connect(mockAudioContext as unknown as AudioContext);
    const tones = score.tones;
    const oscillators = tones?.map((tone) => tone.oscillator);
    const masterGain = score.masterGain;
    const drumGain = score.drumGain;
    score.play();

    score.destroy();

    // 各 OscillatorNode を stop + disconnect
    oscillators?.forEach((osc) => {
      expect(osc?.stop).toHaveBeenCalled();
      expect(osc?.disconnect).toHaveBeenCalled();
    });
    // ドラムゲインを disconnect
    expect(drumGain?.disconnect).toHaveBeenCalled();
    // マスターゲインを disconnect
    expect(masterGain?.disconnect).toHaveBeenCalled();
    // 各 Tone・Score の参照がクリアされる
    for (const tone of tones ?? []) {
      expect(tone.oscillator).toBeUndefined();
    }
    expect(score.tones).toBeUndefined();
    expect(score.drumGain).toBeUndefined();
    expect(score.masterGain).toBeUndefined();
    expect(score.context).toBeUndefined();
  });

  test("destroy does not close an externally provided context", () => {
    const score = new Score();
    const externalContext = { ...mockAudioContext, close: jest.fn() };
    score.connect(externalContext as unknown as AudioContext);

    score.destroy();

    expect(externalContext.close).not.toHaveBeenCalled();
  });

  test("destroy closes a context it created internally", () => {
    const OriginalAudioContext = (
      global as unknown as { AudioContext?: unknown }
    ).AudioContext;
    const internalContext = { ...mockAudioContext, close: jest.fn() };
    (global as unknown as { AudioContext: unknown }).AudioContext = jest.fn(
      () => internalContext,
    );
    try {
      const score = new Score();
      score.connect(); // 引数なし = 自前生成
      score.destroy();
      expect(internalContext.close).toHaveBeenCalled();
    } finally {
      (global as unknown as { AudioContext?: unknown }).AudioContext =
        OriginalAudioContext;
    }
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
