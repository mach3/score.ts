"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tone = exports.Score = exports.CHORD_NAMES = void 0;
var chords_notes_1 = require("./const/chords_notes");
Object.defineProperty(exports, "CHORD_NAMES", { enumerable: true, get: function () { return chords_notes_1.CHORD_NAMES; } });
var Score_1 = require("./lib/Score");
Object.defineProperty(exports, "Score", { enumerable: true, get: function () { return Score_1.Score; } });
var Tone_1 = require("./lib/Tone");
Object.defineProperty(exports, "Tone", { enumerable: true, get: function () { return Tone_1.Tone; } });
