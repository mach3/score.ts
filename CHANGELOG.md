# Changelog

## [v0.8.1] - 2026-06-27

### Features

- `speed` のバリデーションを `[1, 16]` の整数範囲に強化: 範囲外・非整数の値は `setSpeed()` / コンストラクタでエラーを返す
- `SPEED_RANGE` 定数を export: `speed` の許容範囲（`min: 1, max: 16`）を参照可能

---

## [v0.8.0] - 2026-06-21

### Features

- `Score` クラスに `setBeat(beat: BeatPattern | undefined)` を追加: 9種類のビートパターン（`kick-2`, `kick-4`, `kick-8`, `triple`, `rock`, `pop`, `offbeat`, `shuffle`, `16beat`）を Web Audio API でリアルタイム合成。`undefined` で無効化
- `Score` クラスに `setVolume(volume: number)` を追加: マスター音量制御（0.0〜1.0）。`Score.volume` プロパティで現在値を参照可能
- `BeatPattern` 型と `BEAT_PATTERNS` 定数を export

### Refactoring

- ゲイン階層を 3 層構造に再編: `chordGain`（コード音）と `drumGain`（ドラム音）を `masterGain` 配下に集約

---

## [v0.7.0] - 2026-06-13

### Features

- `Score` クラスに `sprinkle(measureIndex)` を追加: 指定小節の各フレームに空きノートをランダムに1〜2個有効化する
- `Score` クラスに `clear(measureIndex)` を追加: 指定小節の全ノートをクリアする

---

## [v0.6.0] - 2026-05-31

### Features

- `Score` クラスに `playingchange` イベントを追加: `play()` / `stop()` で再生状態が変わったときに発火。リスナーは `e.target.playing` で現在値（`true` / `false`）を参照できる。`destroy()` 時は発火しない

---

## [v0.5.0] - 2026-05-30

### Bug Fixes

- `Score.stop()` 後に `Score.play()` を呼ぶと音が鳴らない問題を修正

### Breaking Changes

- `Tone.stop()` の挙動変更: OscillatorNode の破棄を行わなくなった（ゲインを 0 にして再生停止するのみ）。リソースの完全解放は `destroy()` を使うこと

### Features

- `Score.destroy()` を新設: AudioContext・OscillatorNode 等のリソースを完全解放（使い捨て）
- `Tone.destroy()` を新設: OscillatorNode・GainNode を `stop()` / `disconnect()` して解放

### Chores

- pnpm 11 の `allowBuilds` 設定に移行
- `lint` / `lint:fix` スクリプトを追加
- GitHub Pages デプロイ追加（`production` タグトリガー）

---

## [v0.4.0] - 2026-05-07

### Breaking Changes

- `Score` クラスのイベント機構を Node の `EventEmitter` から Web 標準 `EventTarget` に移行
  - リスナー登録: `score.addListener("change", h)` → `score.on("change", h)`（標準の `addEventListener` も使用可）
  - リスナー受け取り: payload オブジェクトを廃止し、`event.target` から Score インスタンスを参照
  - `EventEmitter` 由来のメソッド（`once`, `off`, `removeAllListeners` 等）は廃止。代替は `addEventListener(type, listener, { once: true })` / `AbortSignal` 経由の cleanup

### Features

- `node:events` / `events` polyfill への依存を撤去。bundler 設定なしで browser/Node 両環境で動作
- 型強化された `on(type, listener, options?)` ヘルパーを追加

---

## [v0.3.0] - 2026-05-07

### Features

- `Score.seek(frame)` メソッドを追加（再生位置の制御）
  - 整数チェック・範囲チェック失敗時は `Error` を返却
  - 再生中の seek もタイマー継続、次の process tick でコードが自動追従

### Chores

- TypeScript を 6.0.3 へ移行（5.6 → 6.0）
- pnpm v10 builds 承認設定
- CI Node matrix を `[22, 24]` に更新
- `jest` 30.3.0、`styled-components` 6.4.1 へ bump

---

## [v0.2.0] - 2026-03-20

### Features

- コード（和音）機能を追加: メジャー/マイナー/7th/マイナー7th × 12キー = 48種類 + 伝統音階6種類（都節・律・民謡・琉球・中国・ブルース）
- プリセット機能を追加: ADSR エンベロープ・波形切替・マスターゲインに対応した10種類の音色プリセット

### Refactoring

- `IScoreData` の構造を `measures` に統合し、小節単位でコード情報を管理するように変更

### Chores

- パッケージマネージャーを npm から pnpm に移行
- CI ワークフローの追加
- Biome 設定の更新

---

## [v0.1.1] - 2024-11-02

バグ修正リリース。

---

## [v0.1.0] - 2024-10-26

Initial release.
