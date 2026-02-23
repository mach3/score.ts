# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

score.ts は Web Audio API を使った16ステップシーケンサーの TypeScript ライブラリ。コード（和音）ベースの音源生成をサポートし、メジャー/マイナー/7th/マイナー7th × 12キー = 48種類のコードに対応。

## Commands

```bash
# Install dependencies
npm install

# Build (both ESM and CJS outputs)
npm run build

# Type check (no emit)
npm run typecheck

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

### Public API (`src/index.ts`)

エクスポートは `Score` クラス、`IScoreData` 型、`Tone` クラス、`ChordName` 型、`CHORD_NAMES` 定数。

### Core Classes

- **Score** (`src/lib/Score.ts`): スコアデータの管理と再生を担うメインクラス
  - `EventEmitter` を継承。`change`（データ変更時）と `process`（フレーム進行時）イベントを emit
  - 最大16小節、各小節は16フレーム × 16ノートのグリッド構造
  - 再生ループは `setTimeout` ベース。`process()` が再帰的にフレームを進行
  - 操作メソッド（`toggleNote`, `addMeasure`, `setChord` 等）は失敗時に `Error` を返し、成功時は `undefined` を返すパターン（throw しない）

- **Tone** (`src/lib/Tone.ts`): Web Audio の OscillatorNode + GainNode のラッパー
  - サイン波オシレーターにゲインエンベロープを付与
  - `ping()` でゲインを1にセットし、`process()` の 33ms ループで 0.8 倍ずつ減衰

### Data Structure

```typescript
interface Measure {
  chord: ChordName;                          // この小節のコード名
  frames: Fixed16Array<Fixed16Array<NumBool>>; // 16フレーム × 16ノート
}

interface IScoreData {
  measures: Measure[];  // 小節の配列（最大16）
  speed: number;        // 再生速度（フレーム/秒、デフォルト8）
}
```

### Constants (`src/const/`)

- `chords.ts`: コード名→構成音名のマッピング（例: "Am" → ["A", "C", "E"]）
- `notes.ts`: 音名→周波数(Hz)のマッピング（A0〜C8）
- `chords_notes.ts`: 各コードの16音分の周波数配列（事前計算済み）。`getChordNotes()` 関数と `ChordName` 型をエクスポート

## Build Output

Dual package: ESM (`dist/esm/`, module: ESNext) と CJS (`dist/cjs/`, module: CommonJS)。`tsconfig.esm.json` / `tsconfig.cjs.json` がそれぞれの設定。

## Code Style

- Formatter/Linter: Biome（インデント: スペース2つ、クォート: ダブルクォート）
- TypeScript strict モード有効
