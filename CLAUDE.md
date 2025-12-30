# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

score.ts is a TypeScript library for creating and playing musical scores using the Web Audio API. It provides a 16-step sequencer with chord-based tone generation, supporting major, minor, 7th, and minor 7th chords across all 12 keys.

## Commands

```bash
# Install dependencies
npm install

# Build (both ESM and CJS outputs)
npm run build

# Run tests
npm test

# Run a single test file
npx jest __tests__/index.spec.ts

# Run tests matching a pattern
npx jest -t "initialize"

# Lint and format (Biome)
npx biome check .
npx biome check --write .

# Run example app (Parcel dev server)
npm run example
```

## Architecture

### Core Classes

- **Score** (`src/lib/Score.ts`): Main class that manages musical score data and playback
  - Extends EventEmitter - emits `change` and `process` events
  - Contains measures (up to 16), each with 16 frames, each frame with 16 notes
  - Controls playback timing and chord switching

- **Tone** (`src/lib/Tone.ts`): Web Audio oscillator wrapper
  - Creates sine wave oscillators with gain envelope
  - `ping()` method triggers note attack, auto-decays

### Data Structures

`IScoreData` interface:
- `chords: ChordName[]` - chord per measure
- `frames: Fixed16Array<Fixed16Array<NumBool>>[]` - 16x16 grid per measure (frame x note)
- `speed: number` - playback speed (frames per second)

### Constants

- `src/const/chords.ts`: Chord-to-note-name mappings
- `src/const/notes.ts`: Note-name-to-frequency mappings (Hz)
- `src/const/chords_notes.ts`: Pre-calculated 16-note frequency arrays for each chord

## Build Output

Dual package output:
- ESM: `dist/esm/` (module: ESNext)
- CJS: `dist/cjs/` (module: CommonJS)

## Testing

Jest with ts-jest preset. Tests are in `__tests__/` directory. AudioContext is mocked for testing playback functionality.
