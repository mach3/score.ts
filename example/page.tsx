import { useEffect, useState } from "react";
import {
  FaDiceTwo,
  FaPause,
  FaPlay,
  FaPlus,
  FaStepBackward,
  FaTrash,
} from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import styled from "styled-components";
import {
  BEAT_PATTERNS,
  type BeatPattern,
  CHORD_NAMES,
  type ChordName,
  type IScoreData,
  PRESET_NAMES,
  type PresetName,
  Score,
  SPEED_RANGE,
} from "../src";

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

const MeasureHeader = styled.div({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  fontSize: 14,
  padding: "4px 8px",
  borderRadius: 4,
  backgroundColor: "#eee",
  userSelect: "none",
  "&:hover": {
    backgroundColor: "#ddd",
  },
  "&.-current": {
    backgroundColor: "#c96",
    color: "#fff",
  },
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

const SpeedControl = styled.div({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
});

const SpeedValue = styled.span({
  fontSize: 14,
  color: "#333",
  fontVariantNumeric: "tabular-nums",
  minWidth: "4em",
});

interface NoteProps {
  value: 0 | 1;
  onChange: () => void;
}

function Note({ value, onChange }: NoteProps) {
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

function ChordSelect({ value, onChange }: ChordSelectProps) {
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

interface PresetSelectProps {
  value: PresetName;
  onChange: (value: PresetName) => void;
}

function PresetSelect({ value, onChange }: PresetSelectProps) {
  return (
    <SelectBox
      value={value}
      onChange={(e) => onChange(e.target.value as PresetName)}
    >
      {PRESET_NAMES.map((preset) => {
        return <option key={preset}>{preset}</option>;
      })}
    </SelectBox>
  );
}

interface BeatSelectProps {
  value: BeatPattern | undefined;
  onChange: (value: BeatPattern | undefined) => void;
}

function BeatSelect({ value, onChange }: BeatSelectProps) {
  return (
    <SelectBox
      value={value ?? ""}
      onChange={(e) =>
        onChange(
          e.target.value === "" ? undefined : (e.target.value as BeatPattern),
        )
      }
    >
      <option value="">Beat: Off</option>
      {BEAT_PATTERNS.map((pattern) => {
        return (
          <option key={pattern} value={pattern}>
            {pattern}
          </option>
        );
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
    const controller = new AbortController();
    s.on(
      "change",
      (e) => {
        setData((pre) => {
          return { ...pre, ...e.target.data };
        });
      },
      { signal: controller.signal },
    );
    s.on(
      "process",
      (e) => {
        setCurrentFrame(e.target.currentFrame);
      },
      { signal: controller.signal },
    );
    return () => {
      controller.abort();
      s.stop();
    };
  }, []);

  return (
    <PageBase>
      <h1>Score.ts</h1>
      <ScoreBase>
        {data?.measures.map((measure, m) => {
          return (
            <MeasureBase key={`measure-${m.toString()}`}>
              <MeasureHeader
                className={
                  Math.floor(currentFrame / 16) === m ? "-current" : undefined
                }
                onClick={() => {
                  const e = score?.seek(m * 16);
                  if (e instanceof Error) {
                    alert(e.message);
                  } else {
                    setCurrentFrame(m * 16);
                  }
                }}
              >
                {m + 1}
              </MeasureHeader>
              <MeasureInner>
                {measure.frames.map((frame, f) => {
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
                    const e = score?.sprinkle(m);
                    if (e instanceof Error) {
                      alert(e.message);
                    }
                  }}
                >
                  <IoSparkles />
                </ControlButton>
                <ControlButton
                  type="button"
                  onClick={() => {
                    const e = score?.randomize(m);
                    if (e instanceof Error) {
                      alert(e.message);
                    }
                  }}
                >
                  <FaDiceTwo />
                </ControlButton>
                <ControlButton
                  type="button"
                  onClick={() => {
                    if (data && data.measures.length === 1) {
                      score?.clear(m);
                      return;
                    }
                    const e = score?.removeMeasure(m);
                    if (e instanceof Error) {
                      alert(e.message);
                    }
                  }}
                >
                  <FaTrash />
                </ControlButton>
                <ChordSelect
                  value={measure.chord}
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
            const e = score?.seek(0);
            if (e instanceof Error) {
              alert(e.message);
            } else {
              setCurrentFrame(0);
            }
          }}
        >
          <FaStepBackward />
        </ControlButton>
        <ControlButton
          type="button"
          onClick={() => {
            score?.connect();
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
        <PresetSelect
          value={score?.data.preset ?? "Piano"}
          onChange={(value) => {
            const e = score?.setPreset(value);
            if (e instanceof Error) {
              alert(e.message);
            }
          }}
        />
        <BeatSelect
          value={data?.beat}
          onChange={(value) => {
            score?.setBeat(value);
          }}
        />
        <SpeedControl>
          <input
            type="range"
            min={SPEED_RANGE.min}
            max={SPEED_RANGE.max}
            value={data?.speed ?? 8}
            onChange={(e) => {
              score?.setSpeed(Number(e.target.value));
            }}
          />
          <SpeedValue>{data?.speed ?? 8} fps</SpeedValue>
        </SpeedControl>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue="1"
          onChange={(e) => {
            score?.setVolume(Number(e.target.value));
          }}
        />
      </ControlBase>
    </PageBase>
  );
}
