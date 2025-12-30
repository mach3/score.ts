# score.ts

Web Audio API を使用した16ステップシーケンサーライブラリ。コード（和音）ベースの音源生成をサポートし、ブラウザ上で簡易的な音楽シーケンスを作成・再生できます。

## 特徴

- 16ステップ × 16音のグリッドシーケンサー
- 最大16小節まで対応
- 48種類のコード（メジャー、マイナー、7th、マイナー7th × 12キー）
- EventEmitterベースのイベント駆動設計
- ESM / CommonJS デュアルパッケージ対応

## インストール

```bash
npm install github:mach3/score.ts
```

## 基本的な使い方

```typescript
import { Score } from "score.ts";

// インスタンスを作成
const score = new Score();

// AudioContextに接続
score.connect();

// データ変更時のイベントリスナーを登録
score.addListener("change", (e) => {
  console.log("データが変更されました", e.target.data);
});

// 再生位置が進んだときのイベントリスナー
score.addListener("process", (e) => {
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
| `setSpeed(speed: number)` | 再生速度を設定（フレーム/秒） |
| `randomize(measureIndex, callback?)` | 指定小節をランダム化 |
| `play()` | 再生開始 |
| `stop()` | 再生停止 |

#### イベント

| イベント | 説明 |
|---------|------|
| `change` | データが変更されたとき |
| `process` | フレームが進んだとき |

### IScoreData インターフェース

```typescript
interface IScoreData {
  chords: ChordName[];  // 各小節のコード
  frames: number[][][]; // 小節 × フレーム(16) × ノート(16)
  speed: number;        // 再生速度（フレーム/秒）
}
```

### 対応コード

メジャー、マイナー、7th、マイナー7th の4種類 × 12キー = 48種類

```
A, A7, Am, Am7, A#, A#7, A#m, A#m7,
B, B7, Bm, Bm7,
C, C7, Cm, Cm7, C#, C#7, C#m, C#m7,
D, D7, Dm, Dm7, D#, D#7, D#m, D#m7,
E, E7, Em, Em7,
F, F7, Fm, Fm7, F#, F#7, F#m, F#m7,
G, G7, Gm, Gm7, G#, G#7, G#m, G#m7
```

## 開発

```bash
# 依存パッケージのインストール
npm install

# ビルド
npm run build

# テスト
npm test

# サンプルアプリの起動
npm run example
```

## ライセンス

MIT
