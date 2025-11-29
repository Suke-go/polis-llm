# Vercel デプロイ手順

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

#### 必須環境変数

```bash
# Database（接続プーラーを使用することを推奨）
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require

# OpenAI
OPENAI_API_KEY=sk-...

# Google / Vertex AI
GOOGLE_PROJECT_ID=env-design
GOOGLE_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"env-design","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"...","universe_domain":"googleapis.com"}

# Hugging Face
HF_API_TOKEN=hf_...
```

**重要**: `GOOGLE_SERVICE_ACCOUNT_JSON` は、JSON ファイル全体を1行の文字列として設定してください。

#### オプション環境変数

```bash
# 画像生成プロバイダー（デフォルト: gemini）
IMAGE_GENERATION_PROVIDER=gemini

# Google AI Studio API Key（オプション）
GOOGLE_API_KEY=your_google_api_key_here
```

#### サービスアカウントキーの設定方法

1. ローカルの `env-design-54418957a0cd.json` ファイルを開く
2. ファイル全体をコピー
3. Vercel の環境変数 `GOOGLE_SERVICE_ACCOUNT_JSON` に貼り付け
   - **重要**: JSON 文字列全体を1行で設定する必要があります
   - 改行は `\n` としてエスケープされます（既にエスケープ済みの場合はそのまま）

### 3. データベースマイグレーションの実行

Vercel デプロイ後、初回のみデータベースマイグレーションを実行する必要があります。

#### 方法1: Vercel CLI を使用（推奨）

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

#### 方法2: データベースに直接接続

```bash
# DATABASE_URL を環境変数に設定
export DATABASE_URL="postgresql://..."

# マイグレーション実行
npx prisma migrate deploy
```

### 4. デプロイの確認

1. Vercel ダッシュボードでデプロイが成功したか確認
2. デプロイログでエラーがないか確認
3. 本番 URL にアクセスして動作確認

## トラブルシューティング

### ビルドエラー

**エラー**: `Prisma Client has not been generated yet`

**解決方法**: `package.json` の `build` スクリプトに `prisma generate` が含まれているか確認

### 環境変数エラー

**エラー**: `GOOGLE_SERVICE_ACCOUNT_JSON is not set`

**解決方法**: 
- Vercel の環境変数設定を確認
- JSON 文字列が正しく設定されているか確認（改行がエスケープされているか）

### データベース接続エラー

**エラー**: `Can't reach database server`

**解決方法**:
- `DATABASE_URL` が正しく設定されているか確認
- データベースの接続許可設定を確認（IP アドレス制限など）
- Neon や Supabase の場合、接続プーラーを使用しているか確認

### 画像生成エラー

**エラー**: `403 PERMISSION_DENIED` または `401 UNAUTHENTICATED`

**解決方法**:
- Generative Language API が有効化されているか確認
- サービスアカウントに適切な権限が付与されているか確認
- OAuth2 スコープが正しく設定されているか確認

## 本番環境での注意点

1. **環境変数の管理**
   - 本番環境と開発環境で異なる環境変数を使用する場合は、Vercel で環境ごとに設定
   - Production、Preview、Development で個別に設定可能

2. **データベース接続**
   - 接続プーラーを使用することを推奨（Neon、Supabase など）
   - 接続数の制限に注意

3. **API レート制限**
   - OpenAI、Google API のレート制限に注意
   - 必要に応じてリトライロジックを実装

4. **ログの確認**
   - Vercel ダッシュボードの「Functions」タブでログを確認
   - エラーが発生した場合はログを確認して原因を特定

