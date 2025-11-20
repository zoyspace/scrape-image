# Sakamichi Actions

坂道シリーズ（乃木坂46、櫻坂46、日向坂46）の公式ブログから最新の記事と画像をスクレイピングし、Turso (LibSQL) データベースに保存するツールです。

## 機能

- **マルチグループ対応**: 乃木坂46、櫻坂46、日向坂46のブログに対応しています。
- **重複チェック**: データベースに既に存在する記事はスキップし、新しい記事のみを取得します。
- **画像保存**: 記事内の画像を抽出し、データベースに保存します。
- **Upsert対応**: 記事データの重複登録を防ぐため、Upsert (INSERT OR IGNORE / ON CONFLICT) を使用しています。
- **並列処理**: `p-limit` を使用して、スクレイピング処理を並列化し、効率的に実行します。

## 必要要件

- [Bun](https://bun.sh/) (ランタイム)
- [Turso](https://turso.tech/) アカウントとデータベース

## セットアップ

1. **リポジトリのクローン**

```bash
git clone <repository-url>
cd sakamichi-actions
```

2. **依存関係のインストール**

```bash
bun install
```

3. **環境変数の設定**

`.env` ファイルを作成し、Tursoの接続情報を設定してください。

```env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

## 実行方法

メインスクリプトを実行すると、各グループの最新記事を取得し、データベースに保存します。

```bash
bun run src/main.ts
```

## データベーススキーマ

`src/db/turso-schema.ts` で定義されています。

- **posts**: ブログ記事のメタデータ (タイトル、URL、投稿日時など)
- **images**: 記事に含まれる画像のURL

## プロジェクト構造

- `src/main.ts`: エントリーポイント。各グループの処理を呼び出します。
- `src/constants/group.ts`: 各グループのスクレイピング設定 (セレクタ、URLなど)。
- `src/db/`: データベース関連のロジック (接続、スキーマ、重複チェック、挿入)。
- `src/fetchNew.ts`: 新着記事一覧の取得ロジック。
- `src/fetchBody.ts`: 記事本文と画像の取得ロジック。

## ライセンス

MIT
