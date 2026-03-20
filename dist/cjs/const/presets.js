"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRESET_NAMES = void 0;
exports.getPreset = getPreset;
exports.PRESET_NAMES = [
    "Piano",
    "Organ",
    "Bass",
    "Lead",
    "Strings",
    "Pad",
    "Pluck",
    "Bell",
    "Guitar",
    "Flute",
];
const PRESETS_MAP = [
    {
        key: "Piano",
        value: {
            waveType: "custom",
            real: [0, 1, 0.5, 0.25, 0.15, 0.1, 0.06, 0.04, 0.02, 0.01],
            imag: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            adsr: { attack: 0.005, decay: 0.25, sustain: 0.2, release: 0.15 },
        },
    },
    {
        key: "Organ",
        value: {
            waveType: "custom",
            real: [0, 1, 1, 0, 1, 0, 1, 0, 0.5],
            imag: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            adsr: { attack: 0.01, decay: 0.01, sustain: 0.9, release: 0.05 },
        },
    },
    {
        key: "Bass",
        value: {
            waveType: "triangle",
            adsr: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.2 },
        },
    },
    {
        key: "Lead",
        value: {
            waveType: "square",
            adsr: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.2 },
        },
    },
    {
        key: "Strings",
        value: {
            waveType: "sawtooth",
            adsr: { attack: 0.06, decay: 0.05, sustain: 0.4, release: 0.15 },
        },
    },
    {
        key: "Pad",
        value: {
            waveType: "sine",
            adsr: { attack: 0.08, decay: 0.15, sustain: 0.4, release: 0.3 },
        },
    },
    {
        key: "Pluck",
        value: {
            waveType: "sawtooth",
            adsr: { attack: 0.001, decay: 0.4, sustain: 0.001, release: 0.1 },
        },
    },
    {
        key: "Bell",
        value: {
            waveType: "custom",
            real: [0, 1, 0, 0.6, 0, 0.4, 0, 0, 0.2, 0, 0, 0.1],
            imag: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            adsr: { attack: 0.001, decay: 0.6, sustain: 0.001, release: 0.2 },
        },
    },
    {
        key: "Guitar",
        value: {
            waveType: "triangle",
            adsr: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.4 },
        },
    },
    {
        key: "Flute",
        value: {
            waveType: "sine",
            adsr: { attack: 0.08, decay: 0.05, sustain: 0.8, release: 0.15 },
        },
    },
];
/**
 * プリセット名からプリセット定義を取得する
 * @throws プリセットが見つからない場合
 */
function getPreset(name) {
    const entry = PRESETS_MAP.find((e) => e.key === name);
    if (!entry) {
        throw new Error(`Preset "${name}" not found`);
    }
    return entry.value;
}
