---
name: verify
description: score.ts の typecheck / test / lint を CI と同じ順序で実行し、結果を簡潔に報告する。実装や修正の後、コミット・PR 前の確認に使う。
---

score.ts リポジトリの変更を検証する。CI（`.github/workflows/ci.yml`）と同じ順序で実行する。

## 実行手順

1. `pnpm run typecheck`
2. `pnpm test`
3. `pnpm run lint`

途中で失敗したら以降のステップは実行せず、そこで報告する（CI も同じ順序で止まる）。

## 結果報告

- すべて成功したら一言で完了を伝える（詳細な出力を貼らない）
- 失敗があれば、失敗したステップ名とエラーの要点のみ抜粋して報告する
- lint 失敗の場合、`pnpm run lint:fix` で自動修正できる可能性があることを伝える（実行はユーザーの指示を待つ）

## 注意

- `pnpm run build` はこの skill の対象外（CI の検証ゲートに含まれないため）。ビルド確認が必要な場合はユーザーに別途依頼する
- 各コマンドの失敗を握り潰さない。exit code をそのまま反映する
