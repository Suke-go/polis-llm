# API設定ガイド

このガイドでは、Commons Groundで使用する外部APIの設定方法について詳しく説明します。

## 目次

- [OpenAI API](#openai-api)
- [Google / Vertex AI](#google--vertex-ai)
- [Hugging Face API](#hugging-face-api)
- [トラブルシューティング](#トラブルシューティング)

## OpenAI API

### APIキーの取得

1. [OpenAI Platform](https://platform.openai.com/api-keys) にアクセス
2. アカウントにログイン
3. 「Create new secret key」をクリック
4. キー名を入力してキーを生成
5. 生成されたキーをコピー（一度しか表示されません）

### 環境変数の設定

```bash
OPENAI_API_KEY=sk-...
```

### 使用箇所

- ストーリー生成（SFストーリーと政策ストーリー）
- 命題生成（日本語命題の生成）
- 翻訳（日本語→英語、英語→日本語）
- 投票文の整形（「〜すべきだ。」形式への変換）

### クォータと制限

- レート制限: リクエスト数とトークン数に制限があります
- コスト: 使用量に応じて課金されます
- 詳細: [OpenAI Pricing](https://openai.com/pricing) を参照

## Google / Vertex AI

### 認証方法の選択

Commons Groundでは、以下の3つの方法でGoogle APIに認証できます：

#### 方法1: サービスアカウントキーJSONファイル（ローカル開発用、推奨）

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「IAM & Admin」→「Service Accounts」に移動
4. サービスアカウントを作成（または既存のものを使用）
5. 「Keys」タブで「Add Key」→「Create new key」→「JSON」を選択
6. ダウンロードされたJSONファイルをプロジェクトルートに配置

**環境変数**:
```bash
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=us-central1  # オプション（デフォルト: us-central1）
```

コードが自動的に `env-design-54418957a0cd.json` などのファイルを読み込みます。

#### 方法2: 環境変数にJSON文字列を設定（Vercelなど本番環境用）

1. サービスアカウントキーJSONファイルを開く
2. ファイル全体をコピー
3. 環境変数 `GOOGLE_SERVICE_ACCOUNT_JSON` に貼り付け

**環境変数**:
```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"env-design",...}'
GOOGLE_PROJECT_ID=env-design
GOOGLE_LOCATION=us-central1
```

**重要**: JSON文字列全体を1行で設定する必要があります。改行は `\n` としてエスケープされます。

#### 方法3: カスタムファイルパスを指定

```bash
GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/your-service-account-key.json
GOOGLE_PROJECT_ID=env-design
GOOGLE_LOCATION=us-central1
```

### APIの有効化

#### Generative Language API

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択
3. 「API とサービス」→「ライブラリ」に移動
4. 「Generative Language API」を検索
5. 「有効にする」をクリック

または、直接URLにアクセス：
```
https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=YOUR_PROJECT_ID
```

#### Imagen API（オプション）

Imagen APIを使用する場合：

1. 「API とサービス」→「ライブラリ」に移動
2. 「Imagen API」または「Generative AI API」を検索
3. 「有効にする」をクリック

### サービスアカウントの権限

サービスアカウントに以下のロールが付与されているか確認してください：

- **Vertex AI User** (`roles/aiplatform.user`) - Vertex AIを使用する場合
- **Service Account User** (`roles/iam.serviceAccountUser`)

権限の確認方法：

1. [IAM & Admin](https://console.cloud.google.com/iam-admin/iam) にアクセス
2. サービスアカウントを検索
3. ロールを確認し、必要に応じて追加

### 画像生成プロバイダーの選択

```bash
# デフォルト: gemini（Gemini 2.5 Flash Image APIを使用）
IMAGE_GENERATION_PROVIDER=gemini

# Imagen APIを使用する場合
IMAGE_GENERATION_PROVIDER=imagen
```

**注意**: 
- デフォルトは `gemini` です（Gemini 2.5 Flash Image APIを使用）
- `imagen` を指定すると、Imagen APIを使用します（Vertex AI認証が必要な場合があります）

### Google AI Studio API Key（オプション）

Google AI Studio API Keyを使用する場合：

```bash
GOOGLE_API_KEY=your_google_api_key_here
# または
GEMINI_API_KEY=your_gemini_api_key_here
```

### 使用箇所

- 画像生成（Gemini 2.5 Flash Image APIまたはImagen API）

## Hugging Face API

### APIトークンの取得

1. [Hugging Face](https://huggingface.co/) にアカウントを作成（またはログイン）
2. [Settings](https://huggingface.co/settings/tokens) に移動
3. 「New token」をクリック
4. トークン名を入力（例: `commons-ground`）
5. 「Read」権限を選択（デフォルト）
6. 「Generate a token」をクリック
7. 生成されたトークンをコピー（一度しか表示されません）

### 環境変数の設定

```bash
HF_API_TOKEN=hf_...
```

### 使用箇所

- Gemma-APS（命題分割）

### クォータと制限

- 無料プラン: リクエスト数に制限があります
- 有料プラン: より高いレート制限があります
- 詳細: [Hugging Face Pricing](https://huggingface.co/pricing) を参照

## トラブルシューティング

### Vertex AI API のエラー

#### エラー1: 403 PERMISSION_DENIED - APIが有効化されていない

**エラーメッセージ**:
```
Vertex AI API has not been used in project gen-lang-client-0324265442 before or it is disabled.
```

**解決方法**:
1. [Generative Language API](https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview) を有効化
2. 数分待ってから再度試す

#### エラー2: 403 PERMISSION_DENIED - 認証スコープが不足している

**エラーメッセージ**:
```
Request had insufficient authentication scopes.
ACCESS_TOKEN_SCOPE_INSUFFICIENT
```

**解決方法**:
- コードは自動的に必要なスコープ（`cloud-platform` と `generative-language`）を要求します
- サービスアカウントキーが正しく読み込まれているか確認

#### エラー3: 401 UNAUTHENTICATED

**原因**: 認証情報が正しくない、またはサービスアカウントキーが無効

**解決方法**:
- サービスアカウントキーJSONファイルが正しく配置されているか確認
- 環境変数 `GOOGLE_SERVICE_ACCOUNT_JSON` が正しく設定されているか確認
- JSON文字列の改行が正しくエスケープされているか確認

#### エラー4: 404 NOT_FOUND

**原因**: モデル名またはエンドポイントURLが間違っている

**解決方法**:
- コード内のモデル名とエンドポイントURLを確認
- Google Cloud Consoleで利用可能なモデルを確認

#### エラー5: 429 TOO_MANY_REQUESTS

**原因**: クォータ超過

**解決方法**:
- しばらく待ってから再試行
- Google Cloud Consoleでクォータを確認
- 必要に応じてクォータの増加をリクエスト

### OpenAI API のエラー

#### エラー1: 401 UNAUTHENTICATED

**原因**: APIキーが無効または期限切れ

**解決方法**:
- 環境変数 `OPENAI_API_KEY` が正しく設定されているか確認
- OpenAI Platformで新しいAPIキーを生成

#### エラー2: 429 TOO_MANY_REQUESTS

**原因**: レート制限超過

**解決方法**:
- しばらく待ってから再試行
- OpenAI Platformで使用量と制限を確認
- 必要に応じてプランをアップグレード

### Hugging Face API のエラー

#### エラー1: 401 UNAUTHORIZED

**原因**: APIトークンが無効または期限切れ

**解決方法**:
- 環境変数 `HF_API_TOKEN` が正しく設定されているか確認
- Hugging Face Settingsで新しいトークンを生成

#### エラー2: 429 TOO_MANY_REQUESTS

**原因**: レート制限超過

**解決方法**:
- しばらく待ってから再試行
- Hugging Face Settingsで使用量を確認
- 必要に応じてプランをアップグレード

### その他のトラブルシューティング

#### 環境変数が読み込まれない

**解決方法**:
- `.env.local` ファイルがプロジェクトルートに存在するか確認
- ファイル名が正しいか確認（`.env.local` が推奨）
- 開発サーバーを再起動

#### サービスアカウントキーが読み込まれない

**解決方法**:
- JSONファイルがプロジェクトルートに配置されているか確認
- ファイル名が正しいか確認（`env-design-54418957a0cd.json` など）
- JSONファイルの形式が正しいか確認

## 参考リンク

- [OpenAI Platform](https://platform.openai.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Hugging Face](https://huggingface.co/)
- [Vertex AI のドキュメント](https://cloud.google.com/vertex-ai/docs)
- [Imagen のドキュメント](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)

## 関連ドキュメント

- [セットアップガイド](GETTING_STARTED.md)
- [開発ガイド](DEVELOPMENT.md)
- [デプロイ手順](DEPLOYMENT.md)

