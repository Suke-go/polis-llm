# デプロイ手順

このガイドでは、Commons GroundをVercelにデプロイする方法を説明します。

## 目次

- [前提条件](#前提条件)
- [デプロイ手順](#デプロイ手順)
- [環境変数の設定](#環境変数の設定)
- [データベースマイグレーション](#データベースマイグレーション)
- [デプロイ後の確認](#デプロイ後の確認)
- [トラブルシューティング](#トラブルシューティング)

## 前提条件

1. **GitHub リポジトリにプッシュ済み**
   - コードが GitHub にプッシュされていること
   - `.env` やサービスアカウントキーの JSON ファイルは Git にコミットされていないこと

2. **データベースの準備**
   - PostgreSQL データベース（Neon、Supabase、Vercel Postgres など）が用意されていること
   - 接続文字列（`DATABASE_URL`）を取得していること

3. **API キーの準備**
   - OpenAI API キー
   - Google API キー（またはサービスアカウントキー）
   - Hugging Face API トークン

## デプロイ手順

### 1. Vercel プロジェクトの作成

1. [Vercel](https://vercel.com) にログイン
2. 「Add New Project」をクリック
3. GitHub リポジトリを選択
4. プロジェクト設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（自動検出される）
   - **Output Directory**: `.next`（自動検出される）

### 2. 環境変数の設定

Vercel ダッシュボードの「Settings」→「Environment Variables」で以下を設定：

詳細は [環境変数の設定](#環境変数の設定) を参照してください。

### 3. データベースマイグレーションの実行

Vercel デプロイ後、初回のみデータベースマイグレーションを実行する必要があります。

詳細は [データベースマイグレーション](#データベースマイグレーション) を参照してください。

### 4. デプロイの確認

1. Vercel ダッシュボードでデプロイが成功したか確認
2. デプロイログでエラーがないか確認
3. 本番 URL にアクセスして動作確認

## 環境変数の設定

### 必須環境変数

#### Database

```bash
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
```

**注意**: NeonやSupabaseを使用する場合、接続プーラーを使用することを推奨します。

#### OpenAI

```bash
OPENAI_API_KEY=sk-...
```

#### Google / Vertex AI

```bash
GOOGLE_PROJECT_ID=env-design
GOOGLE_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"env-design","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
```

**重要**: `GOOGLE_SERVICE_ACCOUNT_JSON` は、JSON ファイル全体を1行の文字列として設定してください。

#### Hugging Face

```bash
HF_API_TOKEN=hf_...
```

### オプション環境変数

```bash
# 画像生成プロバイダー（デフォルト: gemini）
IMAGE_GENERATION_PROVIDER=gemini

# Google AI Studio API Key（オプション）
GOOGLE_API_KEY=your_google_api_key_here
```

### サービスアカウントキーの設定方法

1. ローカルの `env-design-54418957a0cd.json` ファイルを開く
2. ファイル全体をコピー
3. Vercel の環境変数 `GOOGLE_SERVICE_ACCOUNT_JSON` に貼り付け
   - **重要**: JSON 文字列全体を1行で設定する必要があります
   - 改行は `\n` としてエスケープされます（既にエスケープ済みの場合はそのまま）

### 環境ごとの設定

Vercelでは、環境ごとに異なる環境変数を設定できます：

- **Production**: 本番環境
- **Preview**: プレビュー環境（プルリクエストなど）
- **Development**: 開発環境

各環境で個別に設定することを推奨します。

## データベースマイグレーション

### 方法1: Vercel CLI を使用（推奨）

```bash
# Vercel CLI をインストール
npm i -g vercel

# ログイン
vercel login

# プロジェクトにリンク
vercel link

# 環境変数をローカルにプル
vercel env pull .env.local

# マイグレーション実行
npx prisma migrate deploy
```

### 方法2: データベースに直接接続

```bash
# DATABASE_URL を環境変数に設定
export DATABASE_URL="postgresql://..."

# マイグレーション実行
npx prisma migrate deploy
```

**注意**: `migrate deploy` は本番環境用のコマンドです。開発環境では `migrate dev` を使用してください。

## デプロイ後の確認

### 1. デプロイの確認

1. Vercel ダッシュボードでデプロイが成功したか確認
2. 本番 URL（例: `https://your-project.vercel.app`）にアクセス
3. エラーページが表示されないことを確認

### 2. 環境変数の確認

1. Vercel ダッシュボードの「Settings」→「Environment Variables」で以下を確認：
   - `DATABASE_URL` が設定されているか
   - `OPENAI_API_KEY` が設定されているか
   - `GOOGLE_SERVICE_ACCOUNT_JSON` が設定されているか
   - `HF_API_TOKEN` が設定されているか

### 3. データベース接続の確認

1. 本番 URL でセッション作成を試行
2. エラーが発生しないことを確認
3. Vercel の「Functions」タブでログを確認

### 4. API 動作の確認

#### ストーリー生成

1. セッションを作成
2. ストーリー生成を実行
3. ログで OpenAI API の呼び出しが成功しているか確認

#### 画像生成

1. 画像生成を実行
2. ログで Gemini Image API または Imagen API の呼び出しが成功しているか確認
3. 画像が表示されることを確認

#### APS 処理

1. APS 実行を実行
2. ログで Hugging Face API の呼び出しが成功しているか確認
3. 命題が分割されることを確認

### 5. エンドツーエンドテスト

1. **Phase 1**: セッション作成 → ストーリー生成 → 画像生成 → 命題生成 → APS 実行
2. **Phase 2**: タイル選択 → 投票
3. **Phase 3**: 結果可視化

各フローが正常に動作することを確認

## トラブルシューティング

### ビルドエラー

#### エラー: `Prisma Client has not been generated yet`

**解決方法**: `package.json` の `build` スクリプトに `prisma generate` が含まれているか確認

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### 環境変数エラー

#### エラー: `GOOGLE_SERVICE_ACCOUNT_JSON is not set`

**解決方法**: 
- Vercel の環境変数設定を確認
- JSON 文字列が正しく設定されているか確認（改行がエスケープされているか）

### データベース接続エラー

#### エラー: `Can't reach database server`

**解決方法**:
- `DATABASE_URL` が正しく設定されているか確認
- データベースの接続許可設定を確認（IP アドレス制限など）
- Neon や Supabase の場合、接続プーラーを使用しているか確認

### 画像生成エラー

#### エラー: `403 PERMISSION_DENIED` または `401 UNAUTHENTICATED`

**解決方法**:
- Generative Language API が有効化されているか確認
- サービスアカウントに適切な権限が付与されているか確認
- OAuth2 スコープが正しく設定されているか確認

詳細は [API設定ガイド](API_SETUP.md) を参照してください。

### その他のエラー

#### ログの確認

1. Vercel ダッシュボードの「Functions」タブでログを確認
2. エラーメッセージを確認
3. 必要に応じてローカル環境で再現を試みる

## 本番環境での注意点

### 1. 環境変数の管理

- 本番環境と開発環境で異なる環境変数を使用する場合は、Vercel で環境ごとに設定
- Production、Preview、Development で個別に設定可能

### 2. データベース接続

- 接続プーラーを使用することを推奨（Neon、Supabase など）
- 接続数の制限に注意

### 3. API レート制限

- OpenAI、Google API のレート制限に注意
- 必要に応じてリトライロジックを実装

### 4. ログの確認

- Vercel ダッシュボードの「Functions」タブでログを確認
- エラーが発生した場合はログを確認して原因を特定

### 5. セキュリティ

- 環境変数は暗号化されて保存されます
- サービスアカウントキーなどの機密情報は環境変数で管理
- Git に機密情報をコミットしない

## 関連ドキュメント

- [セットアップガイド](GETTING_STARTED.md)
- [開発ガイド](DEVELOPMENT.md)
- [API設定ガイド](API_SETUP.md)

