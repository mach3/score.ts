# score.ts

Web Audio API を使用した16ステップシーケンサーライブラリ。コード（和音）ベースの音源生成をサポートし、ブラウザ上で簡易的な音楽シーケンスを作成・再生できます。

## 特徴

- 16ステップ × 16音のグリッドシーケンサー
- 最大16小節まで対応
- 48種類のコード（メジャー、マイナー、7th、マイナー7th × 12キー）+ 伝統音階6種類
- 10種類の音色プリセット（Piano, Organ, Bass, Lead, Strings, Pad, Pluck, Bell, Guitar, Flute）
- ADSRエンベロープによるゲイン制御
- Web 標準 `EventTarget` ベースのイベント駆動設計（polyfill 不要）
- ESM / CommonJS デュアルパッケージ対応

## インストール

```bash
pnpm install github:mach3/score.ts
```

## 基本的な使い方

```typescript
import { Score } from "score.ts";

// インスタンスを作成
const score = new Score();

// AudioContextに接続
score.connect();

// データ変更時のイベントリスナーを登録（標準の addEventListener も利用可）
score.on("change", (e) => {
  console.log("データが変更されました", e.target.data);
});

// 再生位置が進んだときのイベントリスナー
score.on("process", (e) => {
  console.log("現在のフレーム:", e.target.currentFrame);
});

// ノートをトグル（小節インデックス, フレームインデックス, ノートインデックス）
score.toggleNote(0, 0, 0);

// 再生開始
score.play();

// 停止
score.stop();
```

## API

### Score クラス

#### プロパティ

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `data` | `IScoreData` | スコアデータ |
| `playing` | `boolean` | 再生中かどうか |
| `currentFrame` | `number` | 現在の再生位置（0〜小節数×16） |
| `currentChord` | `ChordName` | 現在再生中のコード |

#### メソッド

| メソッド | 説明 |
|---------|------|
| `connect(context?: AudioContext)` | AudioContextに接続。省略時は自動生成 |
| `init(data?: Partial<IScoreData>)` | データを初期化・設定 |
| `addMeasure(chord?: ChordName)` | 小節を追加（最大16小節） |
| `removeMeasure(index: number)` | 指定位置の小節を削除 |
| `toggleNote(measure, frame, note, value?)` | ノートのオン/オフを切り替え |
| `setChord(measureIndex, chord)` | 指定小節のコードを変更 |
| `setPreset(preset: PresetName)` | 音色プリセットを変更 |
| `setSpeed(speed: number)` | 再生速度を設定（フレーム/秒） |
| `randomize(measureIndex, callback?)` | 指定小節をランダム化 |
| `play()` | 再生開始（stop() 後の再開も可） |
| `stop()` | 再生停止（OscillatorNode は維持されるため、play() で再開できる） |
| `seek(frame: number)` | 再生位置を任意のフレームに移動（0〜小節数×16-1） |
| `destroy()` | AudioContext・OscillatorNode 等のリソースを完全解放（使い捨て。以降の再利用不可） |
| `on(type, listener, options?)` | 型強化されたイベント登録ヘルパー（`change` / `process`） |

#### イベント

`Score` は `EventTarget` を継承しており、`on(type, listener)` または標準の `addEventListener(type, listener)` で購読できる。リスナーには `Event` が渡され、`e.target` から `Score` インスタンスにアクセスできる。

| イベント | 説明 |
|---------|------|
| `change` | データが変更されたとき |
| `process` | フレームが進んだとき |

### IScoreData インターフェース

```typescript
interface Measure {
  chord: ChordName;
  frames: number[][];  // フレーム(16) × ノート(16)
}

interface IScoreData {
  measures: Measure[];    // 小節の配列（最大16）
  speed: number;          // 再生速度（フレーム/秒）
  preset?: PresetName;    // 音色プリセット名（デフォルト "Piano"）
}
```

### 音色プリセット

| プリセット | 波形 | 特徴 |
|-----------|------|------|
| Piano | custom | ピアノ風の倍音構成、パーカッシブな減衰 |
| Organ | custom | ドローバーオルガン風、持続的なサステイン |
| Bass | triangle | 太い低音向け |
| Lead | square | メロディ向けのシンセリード |
| Strings | sawtooth | ストリングス風のゆるいアタック |
| Pad | sine | パッド風の柔らかい音色 |
| Pluck | sawtooth | 短い減衰のプラック音 |
| Bell | custom | ベル風の倍音構成、余韻のある減衰 |
| Guitar | triangle | ギター風の短い減衰 |
| Flute | sine | フルート風のシンプルな音色 |

### 対応コード・スケール

**コード**: メジャー、マイナー、7th、マイナー7th の4種類 × 12キー = 48種類

```
A, A7, Am, Am7, A#, A#7, A#m, A#m7,
B, B7, Bm, Bm7,
C, C7, Cm, Cm7, C#, C#7, C#m, C#m7,
D, D7, Dm, Dm7, D#, D#7, D#m, D#m7,
E, E7, Em, Em7,
F, F7, Fm, Fm7, F#, F#7, F#m, F#m7,
G, G7, Gm, Gm7, G#, G#7, G#m, G#m7
```

**伝統音階・スケール**: 6種類

| スケール | 説明 |
|---------|------|
| Miyako | 都節音階（日本の伝統的な陰音階） |
| Ritsu | 律音階（雅楽で使われる音階） |
| Minyo | 民謡音階（日本の民謡で使われる陽音階） |
| Ryukyu | 琉球音階（沖縄の伝統音階） |
| Chinese | 中国音階（五声音階） |
| Blues | ブルーススケール |

## 開発

```bash
# 依存パッケージのインストール
pnpm install

# ビルド
pnpm run build

# 型チェック
pnpm run typecheck

# テスト
pnpm test

# Lint
pnpm run lint
pnpm run lint:fix

# サンプルアプリの起動
pnpm run example
```

## ライセンス

MIT
