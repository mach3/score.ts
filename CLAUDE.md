# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

score.ts は Web Audio API を使った16ステップシーケンサーの TypeScript ライブラリ。コード（和音）ベースの音源生成をサポートし、メジャー/マイナー/7th/マイナー7th × 12キー = 48種類のコードと、伝統音階6種類（都節・律・民謡・琉球・中国・ブルース）に対応。10種類の音色プリセットを内蔵。

## Commands

```bash
# Install dependencies
pnpm install

# Build (both ESM and CJS outputs)
pnpm run build

# Type check (no emit)
pnpm run typecheck

# Run tests
pnpm test

# Run a single test file
npx jest __tests__/index.spec.ts

# Run tests matching a pattern
npx jest -t "initialize"

# Lint (Biome)
pnpm run lint
pnpm run lint:fix

# Run example app (Parcel dev server)
pnpm run example

# Build example app for GitHub Pages
pnpm run build:example
```

## Architecture

### Public API (`src/index.ts`)

エクスポートは `Score` クラス、`IScoreData` 型、`Tone` クラス、`ChordName` 型、`CHORD_NAMES` 定数、`PresetName` 型、`PRESET_NAMES` 定数。

### Core Classes

- **Score** (`src/lib/Score.ts`): スコアデータの管理と再生を担うメインクラス
  - `EventTarget` を継承。`change`（データ変更時）と `process`（フレーム進行時）イベントを発火。リスナーは `e.target` から Score インスタンスを参照可能
  - 型強化された `on(type, listener, options?)` ヘルパーを提供（標準の `addEventListener` も利用可能）
  - 最大16小節、各小節は16フレーム × 16ノートのグリッド構造
  - 再生ループは `setTimeout` ベース。`process()` が再帰的にフレームを進行
  - マスターゲインノード（`1/16`）で16音の同時発音時のクリッピングを防止
  - 操作メソッド（`toggleNote`, `addMeasure`, `setChord`, `setPreset`, `seek` 等）は失敗時に `Error` を返し、成功時は `undefined` を返すパターン（throw しない）
  - `destroy()` で AudioContext（自前生成時のみ）・masterGain・Tone 全インスタンスを完全解放（使い捨て。以降の再利用不可）

- **Tone** (`src/lib/Tone.ts`): Web Audio の OscillatorNode + GainNode のラッパー
  - プリセットに応じた波形タイプ（sine, square, sawtooth, triangle, custom PeriodicWave）を設定
  - ADSRエンベロープによるゲイン制御。`ping()` で Web Audio のスケジューリング API を使用
  - `stop()` はゲインを 0 にして再生停止するのみ（OscillatorNode は維持するため `play()` で再開可能）
  - `destroy()` でオシレーター・ゲインノードを `stop()` / `disconnect()` してリソース完全解放（使い捨て）

### Data Structure

```typescript
interface Measure {
  chord: ChordName;                          // この小節のコード名
  frames: Fixed16Array<Fixed16Array<NumBool>>; // 16フレーム × 16ノート
}

interface IScoreData {
  measures: Measure[];    // 小節の配列（最大16）
  speed: number;          // 再生速度（フレーム/秒、デフォルト8）
  preset?: PresetName;    // 音色プリセット名（デフォルト "Piano"）
}
```

### Constants (`src/const/`)

- `chords.ts`: コード名→構成音名のマッピング（例: "Am" → ["A", "C", "E"]）
- `notes.ts`: 音名→周波数(Hz)のマッピング（A0〜C8）
- `chords_notes.ts`: 各コードの16音分の周波数配列（事前計算済み）。`getChordNotes()` 関数と `ChordName` 型をエクスポート
- `presets.ts`: 音色プリセット定義（10種類）。各プリセットは波形タイプ（標準 or カスタム PeriodicWave）と ADSR エンベロープパラメータを持つ。`getPreset()` 関数、`PresetName` 型、`PRESET_NAMES` 定数をエクスポート

## Build Output

Dual package: ESM (`dist/esm/`, module: ESNext) と CJS (`dist/cjs/`, module: CommonJS)。`tsconfig.esm.json` / `tsconfig.cjs.json` がそれぞれの設定。

## Code Style

- Formatter/Linter: Biome（インデント: スペース2つ、クォート: ダブルクォート）
- TypeScript strict モード有効
