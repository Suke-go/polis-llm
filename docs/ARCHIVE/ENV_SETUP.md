# 環境変数の設定方法

## Vertex AI 認証の設定

### 方法1: JSON ファイルを直接使用（ローカル開発用、推奨）

プロジェクトルートに `env-design-54418957a0cd.json` を配置してください。
コードが自動的にこのファイルを読み込みます。

必要な環境変数：
```bash
GOOGLE_PROJECT_ID=env-design  # JSON ファイルから自動取得されるが、明示的に設定も可能
GOOGLE_LOCATION=us-central1  # オプション（デフォルト: us-central1）
```

### 方法2: 環境変数に JSON 文字列を設定（Vercel など本番環境用）

`.env.local` または Vercel の環境変数に以下を設定：

```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"gen-lang-client-0324265442",...}'
GOOGLE_PROJECT_ID=gen-lang-client-0324265442
GOOGLE_LOCATION=us-central1
```

**注意**: JSON 文字列内の改行や特殊文字をエスケープする必要があります。

### 方法3: カスタムファイルパスを指定

```bash
GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/your-service-account-key.json
GOOGLE_PROJECT_ID=gen-lang-client-0324265442
GOOGLE_LOCATION=us-central1
```

## その他の環境変数

### OpenAI API
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Google AI Studio API Key / Gemini API Key
```bash
GOOGLE_API_KEY=your_google_api_key_here
# または
GEMINI_API_KEY=your_gemini_api_key_here
```

### 画像生成プロバイダーの選択
```bash
# デフォルト: gemini（Gemini 2.5 Flash Image を使用）
IMAGE_GENERATION_PROVIDER=gemini

# Imagen を使用する場合
IMAGE_GENERATION_PROVIDER=imagen
```

**注意**: 
- デフォルトは `gemini` です（Gemini 2.5 Flash Image API を使用）
- `imagen` を指定すると、Imagen API を使用します（Vertex AI 認証が必要な場合があります）

### Hugging Face API Token（Gemma-APS 用）
```bash
HF_API_TOKEN=your_huggingface_token_here
```

### Database
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## ローカル開発環境での設定

Next.js では以下のファイルが環境変数を読み込みます（優先順位順）：
- `.env.local`（推奨：Git にコミットされない、すべての環境で読み込まれる）
- `.env.development` / `.env.production`（環境に応じて）
- `.env`（デフォルト値として使用）

**推奨**: `.env.local` を使用してください（機密情報を安全に管理できます）。

### `.env.local` または `.env` ファイルを作成

プロジェクトルートに `.env.local` または `.env` ファイルを作成し、以下の環境変数を設定：

```bash
# .env または .env.local
OPENAI_API_KEY=sk-...
GOOGLE_PROJECT_ID=gen-lang-client-0324265442
GOOGLE_LOCATION=us-central1
HF_API_TOKEN=hf_...
DATABASE_URL=postgresql://...
```

**注意**: `.env` ファイルは `.gitignore` に含まれていますが、念のため機密情報は `.env.local` を使用することを推奨します。

## Vercel での設定

1. Vercel ダッシュボードの「Settings」→「Environment Variables」に移動
2. 各環境変数を追加（Production、Preview、Development で個別に設定可能）
3. `GOOGLE_SERVICE_ACCOUNT_JSON` には、JSON ファイルの内容を**1行の文字列**として設定
   - `env-design-54418957a0cd.json` ファイルを開き、全体をコピー
   - 改行は `\n` として既にエスケープされているので、そのまま貼り付け

**重要**: 
- サービスアカウントキーの JSON ファイルは機密情報です。Git にコミットしないでください。
- `.gitignore` に `*-*.json` と `env-design-*.json` パターンが追加されています。
- Vercel の環境変数は暗号化されて保存されます。

詳細なデプロイ手順は [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) を参照してください。

