import { useEffect, useState } from "react";
import styled from "styled-components";
import { FaPlay, FaPause, FaTrash, FaPlus } from "react-icons/fa";
import { CHORD_NAMES, type ChordName, Score, type IScoreData } from "../src";

const PageBase = styled.div({
	display: "grid",
});

const ScoreBase = styled.div({
	display: "flex",
	gap: 16,
});

const MeasureBase = styled.div({
	display: "grid",
	gap: 16,
});

const MeasureInner = styled.div({
	display: "flex",
});

const MeasureControlBase = styled.div({
	display: "flex",
	justifyContent: "flex-end",
	gap: 16,
});

const AddMeasureButtonBase = styled.div({
	display: "flex",
	justifyContent: "center",
	flexDirection: "column",

	"& button": {
		rotate: "90deg",
	},
});

const FrameBase = styled.div({
	display: "flex",
	flexDirection: "column-reverse",
	gap: 4,
	padding: 2,
	"&.-active": {
		backgroundColor: "#c96",
	},
});

const NoteBase = styled.label({
	display: "block",
	backgroundColor: "#ccc",
	width: 32,
	height: 32,
	borderRadius: 8,

	"&:has(input:checked)": {
		backgroundColor: "#693",
	},

	"& input": {
		display: "none",
	},
});

const ControlBase = styled.div({
	display: "flex",
	gap: 16,
	padding: 16,
	backgroundColor: "#eee",
	borderRadius: 16,
	marginTop: 24,
});

const ControlButton = styled.button({
	display: "inline-flex",
	fontSize: 14,
	padding: "0.5em 1em",
	border: "3px solid #999",
	borderRadius: "2em",
	color: "#333",
});

const SelectBox = styled.select({});

interface NoteProps {
	value: 0 | 1;
	onChange: () => void;
}

function Note({ value, onChange }: NoteProps): JSX.Element {
	return (
		<NoteBase>
			<input
				type="checkbox"
				checked={value === 1}
				onChange={() => onChange()}
			/>
		</NoteBase>
	);
}

interface ChordSelectProps {
	value: ChordName;
	onChange: (value: ChordName) => void;
}

function ChordSelect({ value, onChange }: ChordSelectProps): JSX.Element {
	const list = CHORD_NAMES;
	return (
		<SelectBox
			value={value}
			onChange={(e) => onChange(e.target.value as ChordName)}
		>
			{list.map((chord) => {
				return <option key={chord}>{chord}</option>;
			})}
		</SelectBox>
	);
}

export function Page() {
	const [score, setScore] = useState<Score>();
	const [data, setData] = useState<IScoreData>();
	const [currentFrame, setCurrentFrame] = useState(0);

	useEffect(() => {
		const s = new Score();
		setScore(s);
		setData(s.data);
		s.addListener("change", (e) => {
			setData((pre) => {
				return { ...pre, ...e.target.data };
			});
		});
		s.addListener("process", (e) => {
			setCurrentFrame(e.target.currentFrame);
		});
	}, []);

	return (
		<PageBase>
			<h1>Score.ts</h1>
			<ScoreBase>
				{data?.frames.map((measure, m) => {
					return (
						<MeasureBase key={`measure-${m.toString()}`}>
							<MeasureInner>
								{measure.map((frame, f) => {
									const frameIndex = m * 16 + f;
									return (
										<FrameBase
											key={`frame-${f.toString()}`}
											className={
												currentFrame === frameIndex ? "-active" : undefined
											}
										>
											{frame.map((note, n) => {
												return (
													<Note
														key={`note-${n.toString()}`}
														value={note}
														onChange={() => {
															score?.toggleNote(m, f, n);
														}}
													/>
												);
											})}
										</FrameBase>
									);
								})}
							</MeasureInner>
							<MeasureControlBase>
								<ControlButton
									type="button"
									onClick={() => {
										const e = score?.removeMeasure(m);
										if (e instanceof Error) {
											alert(e.message);
										}
									}}
								>
									<FaTrash />
								</ControlButton>
								<ChordSelect
									value={data.chords[m]}
									onChange={(value) => {
										const e = score?.setChord(m, value);
										if (e instanceof Error) {
											alert(e.message);
										}
									}}
								/>
							</MeasureControlBase>
						</MeasureBase>
					);
				})}
				<AddMeasureButtonBase>
					<ControlButton
						type="button"
						onClick={() => {
							const e = score?.addMeasure();
							if (e instanceof Error) {
								alert(e.message);
							}
						}}
					>
						<FaPlus />
					</ControlButton>
				</AddMeasureButtonBase>
			</ScoreBase>
			<ControlBase>
				<ControlButton
					type="button"
					onClick={() => {
						if (!score?.context) {
							score?.connect();
						}
						score?.play();
					}}
				>
					<FaPlay />
				</ControlButton>
				<ControlButton
					type="button"
					onClick={() => {
						score?.stop();
					}}
				>
					<FaPause />
				</ControlButton>
			</ControlBase>
		</PageBase>
	);
}
