# セットアップガイド

このガイドでは、Commons Groundをローカル環境でセットアップし、動作させる方法を説明します。

## 目次

- [前提条件](#前提条件)
- [セットアップ手順](#セットアップ手順)
- [環境変数の設定](#環境変数の設定)
- [データベースの準備](#データベースの準備)
- [動作確認](#動作確認)

## 前提条件

- **Node.js**: 18以上
- **PostgreSQL**: データベース（Neon、Supabase、Vercel Postgresなど）
- **APIキー**:
  - OpenAI API キー
  - Google API キー（またはサービスアカウントキー）
  - Hugging Face API トークン

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd SFPrototyping_Polis
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルをプロジェクトルートに作成し、必要な環境変数を設定します。

詳細は [環境変数の設定](#環境変数の設定) を参照してください。

### 4. データベースマイグレーション

```bash
npx prisma migrate dev
```

これにより、データベーススキーマが作成され、Prisma Clientが生成されます。

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして、アプリケーションが起動していることを確認してください。

## 環境変数の設定

### 必須環境変数

#### Database

```bash
DATABASE_URL=postgresql://user:password@host:port/dbname
```

**注意**: NeonやSupabaseを使用する場合、接続プーラーを使用することを推奨します。

#### OpenAI API

```bash
OPENAI_API_KEY=sk-...
```

OpenAI APIキーは [OpenAI Platform](https://platform.openai.com/api-keys) で取得できます。

#### Google / Vertex AI

以下のいずれかの方法で設定します。

**方法1: サービスアカウントキーJSONファイル（ローカル開発用、推奨）**

プロジェクトルートに `env-design-54418957a0cd.json` などのサービスアカウントキーJSONファイルを配置します。コードが自動的にこのファイルを読み込みます。

```bash
GOOGLE_PROJECT_ID=env-design
GOOGLE_LOCATION=us-central1  # オプション（デフォルト: us-central1）
```

**方法2: 環境変数にJSON文字列を設定（Vercelなど本番環境用）**

```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"env-design",...}'
GOOGLE_PROJECT_ID=env-design
GOOGLE_LOCATION=us-central1
```

**方法3: カスタムファイルパスを指定**

```bash
GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/your-service-account-key.json
GOOGLE_PROJECT_ID=env-design
GOOGLE_LOCATION=us-central1
```

#### Hugging Face API Token

```bash
HF_API_TOKEN=hf_...
```

Hugging Face APIトークンは [Hugging Face Settings](https://huggingface.co/settings/tokens) で取得できます。

### オプション環境変数

#### 画像生成プロバイダー

```bash
# デフォルト: gemini（Gemini 2.5 Flash Image APIを使用）
IMAGE_GENERATION_PROVIDER=gemini

# Imagen APIを使用する場合
IMAGE_GENERATION_PROVIDER=imagen
```

**注意**: 
- デフォルトは `gemini` です（Gemini 2.5 Flash Image APIを使用）
- `imagen` を指定すると、Imagen APIを使用します（Vertex AI認証が必要な場合があります）

#### Google AI Studio API Key

```bash
GOOGLE_API_KEY=your_google_api_key_here
# または
GEMINI_API_KEY=your_gemini_api_key_here
```

### 環境変数ファイルの優先順位

Next.jsでは以下のファイルが環境変数を読み込みます（優先順位順）：

1. `.env.local`（推奨：Gitにコミットされない、すべての環境で読み込まれる）
2. `.env.development` / `.env.production`（環境に応じて）
3. `.env`（デフォルト値として使用）

**推奨**: `.env.local` を使用してください（機密情報を安全に管理できます）。

### 環境変数の設定例

`.env.local` ファイルの例：

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/commons_ground

# OpenAI
OPENAI_API_KEY=sk-...

# Google / Vertex AI
GOOGLE_PROJECT_ID=env-design
GOOGLE_LOCATION=us-central1
# サービスアカウントキーJSONファイルをプロジェクトルートに配置

# Hugging Face
HF_API_TOKEN=hf_...

# 画像生成プロバイダー（オプション）
IMAGE_GENERATION_PROVIDER=gemini
```

**重要**: 
- `.env.local` ファイルは `.gitignore` に含まれています
- サービスアカウントキーのJSONファイルもGitにコミットしないでください
- `.gitignore` に `*-*.json` と `env-design-*.json` パターンが追加されています

## データベースの準備

### PostgreSQLデータベースの選択

以下のいずれかのPostgreSQLデータベースを使用できます：

- **Neon**: [Neon](https://neon.tech) - サーバーレスPostgreSQL
- **Supabase**: [Supabase](https://supabase.com) - オープンソースFirebase代替
- **Vercel Postgres**: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) - Vercel統合PostgreSQL
- **その他のPostgreSQL**: 任意のPostgreSQLデータベース

### 接続文字列の形式

```bash
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require
```

NeonやSupabaseを使用する場合、接続プーラーを使用することを推奨します：

```bash
# Neon接続プーラー例
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require&pgbouncer=true
```

## 動作確認

### 基本的な動作確認

1. **ホームページの表示**
   - `http://localhost:3000` にアクセス
   - セッション作成フォームが表示されることを確認

2. **セッション作成**
   - タイトルとプロンプトを入力してセッションを作成
   - セッション詳細ページに遷移することを確認

3. **Phase 1の各ステップ**
   - ストーリー生成 → 承認
   - 画像生成
   - 命題生成 → 編集 → 承認
   - APS実行 → 承認

4. **Phase 2の実行**
   - タイル選択ページで命題を選択
   - 投票ページで投票を実行

5. **Phase 3の確認**
   - 結果可視化ページで投票結果を確認

詳細な動作確認手順は [開発ガイド](DEVELOPMENT.md) を参照してください。

### トラブルシューティング

#### データベース接続エラー

- `DATABASE_URL` が正しく設定されているか確認
- データベースの接続許可設定を確認（IPアドレス制限など）
- NeonやSupabaseの場合、接続プーラーを使用しているか確認

#### APIキーエラー

- 環境変数が正しく設定されているか確認（`.env.local` ファイルを確認）
- APIキーが有効か確認
- ブラウザの開発者ツール（F12）でエラーログを確認

#### Prismaエラー

```bash
# Prisma Clientを再生成
npx prisma generate

# マイグレーションを再実行
npx prisma migrate dev
```

## 次のステップ

- [開発ガイド](DEVELOPMENT.md) - 開発環境での動作確認とテスト
- [アーキテクチャ](ARCHITECTURE.md) - フェーズ構造とデータフロー
- [API設定ガイド](API_SETUP.md) - 外部APIの詳細な設定方法

