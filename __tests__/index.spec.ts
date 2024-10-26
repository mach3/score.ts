import { Score, type IScoreData, type ChordName } from "../src";

describe("Score Class", () => {
	const emptyMeasure = Array.from({ length: 16 }).map(() => {
		return Array.from({ length: 16 }).map(() => 0);
	});

	const dummyData = {
		chords: ["A", "C7", "Dm7", "G"],
		frames: [
			...Array.from({ length: 4 }).map(() => {
				return Array.from({ length: 16 }).map(() => {
					return Array.from({ length: 16 }).map(() =>
						Math.random() > 0.5 ? 1 : 0,
					);
				});
			}),
		],
		speed: 8,
	} as IScoreData;

	test("initialize", () => {
		const score = new Score();
		// 初期値が正しい
		expect(score.data.chords).toEqual(["A"]);
		expect(score.data.frames).toEqual([emptyMeasure]);
		expect(score.data.speed).toBe(8);
	});

	test("validate data when initialize", () => {
		const score = new Score();

		// check chords error
		expect(
			score.init({ chords: 1 as unknown as IScoreData["chords"] }),
		).toBeInstanceOf(Error);
		expect(
			score.init({
				chords: ["A", "B", "X"] as unknown as IScoreData["chords"],
			}),
		).toBeInstanceOf(Error);

		// check frames error
		expect(
			score.init({
				frames: 1 as unknown as IScoreData["frames"],
			}),
		).toBeInstanceOf(Error);
		expect(
			score.init({
				frames: [1] as unknown as IScoreData["frames"],
			}),
		).toBeInstanceOf(Error);
		expect(
			score.init({
				frames: [[1]] as unknown as IScoreData["frames"],
			}),
		).toBeInstanceOf(Error);
		expect(
			score.init({
				frames: [[[1]]] as unknown as IScoreData["frames"],
			}),
		).toBeInstanceOf(Error);
		expect(
			score.init({
				frames: [
					[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				] as unknown as IScoreData["frames"],
			}),
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
		expect(score.data.frames.length).toBe(5);
		expect(score.data.frames.at(-1)).toEqual(emptyMeasure);
		console.log(score.data.frames.at(-1));
		expect(score.data.chords.at(-1)).toBe("F");

		// add measure without chord
		score.addMeasure();
		expect(score.data.frames.length).toBe(6);
		expect(score.data.chords.at(-1)).toBe("F");

		// remove a measure
		score.removeMeasure(2);
		expect(score.data.frames.length).toBe(5);
		expect(score.data.chords).toEqual(["A", "C7", "G", "F", "F"]);

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
		expect(score.data.frames[1][0][0]).toBe(1);
		score.toggleNote(1, 0, 0, 1);
		expect(score.data.frames[1][0][0]).toBe(1);

		expect(score.toggleNote(16, 0, 0)).toBeInstanceOf(Error);
		expect(score.toggleNote(0, 16, 0)).toBeInstanceOf(Error);
		expect(score.toggleNote(0, 0, 16)).toBeInstanceOf(Error);
	});

	test("manupulate chord", () => {
		const score = new Score();
		score.addMeasure();
		expect(score.data.chords[1]).toBe("A");
		score.setChord(1, "C7");
		expect(score.data.chords[1]).toBe("C7");
		expect(score.setChord(16, "C7")).toBeInstanceOf(Error);
	});
});
