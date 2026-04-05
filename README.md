# Obsidian Backlink Display Text

[English README](./README.en.md)

表示中ノートへのバックリンクをたどり、リンク先表示名の `display text` を frontmatter プロパティの値で更新する Obsidian プラグインです。ユニークノートのようにファイル名が変わっても、見せたい表示名をそろえやすくする用途を想定しています。

## できること

- 現在開いているノートを参照しているバックリンクだけを対象に更新する
- コマンドAは、対象リンクの `display text` を設定値で常に置き換える
- コマンドBは、すでに `display text` が設定されているリンクをスキップする
- 更新件数を Obsidian の Notice で表示する
- `display text` に使うプロパティ名を設定から変更できる
- 対象プロパティが空なら Notice で知らせる
- コマンド名や設定文言は Obsidian の表示言語に合わせて英語/日本語を切り替える

## コマンド

- `Replace backlink display text with property value`
- `Replace backlink display text with property value (skip links that already have display text)`

## 設定

- `Property used for display text`
  - デフォルトは `title`
  - frontmatter の指定プロパティ値を `display text` として使います

## BRAT での導入

1. Obsidian で BRAT をインストールします。
2. `BRAT: Add a beta plugin for testing` を実行します。
3. リポジトリ URL に `https://github.com/gutti0/obsidian-backlink-display-text` を入力します。
4. Community Plugins で `Backlink Display Text` を有効化します。

このリポジトリは BRAT が読み込む配布ファイルをルートに置いています。

- `manifest.json`
- `main.js`
- `versions.json`

## 開発

```bash
npm install
npm run check
npm run build
```

## リリース

BRAT 自体は GitHub リポジトリ URL を登録して使えますが、Obsidian の配布フローでは GitHub Releases にある `manifest.json` / `main.js` / `versions.json` が重要になります。そのため、このリポジトリでは GitHub Actions で release asset を作る前提にしています。

1. `manifest.json` と `package.json` と `versions.json` の version を更新します。
2. `main` に push します。
3. GitHub の repository settings で Actions の `Workflow permissions` を `Read and write permissions` にします。
4. version と同じ名前の git tag を作って push します。

```bash
git tag 0.1.0
git push origin 0.1.0
```

タグが `manifest.json` の version と完全一致していれば、GitHub Actions が release を作成して `manifest.json` / `main.js` / `versions.json` を添付します。

タグ名に `-beta.1` や `-preview.1` のようなハイフン付き pre-release 識別子が入っている場合は、GitHub Release も pre-release として作成されます。
