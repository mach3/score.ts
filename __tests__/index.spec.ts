import { type ChordName, type IScoreData, Score } from "../src";
import { getChordNotes } from "../src/const/chords_notes";

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
    createOscillator: jest.fn(() => ({
      frequency: { value: 0 },
      type: "sine",
      connect: jest.fn(),
      start: jest.fn(),
    })),
    createGain: jest.fn(() => ({
      gain: { value: 0 },
      connect: jest.fn(),
    })),
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
