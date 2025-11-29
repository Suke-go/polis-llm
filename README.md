# Commons Ground

**未来社会の実験場**

SFプロトタイピング、Abstractive Proposition Segmentation (APS)、Polis型投票を統合した Web アプリケーション。2050年の社会を構想し、多様な視点から議論を深めるプラットフォームです。

## 📋 目次

- [概要](#概要)
- [機能](#機能)
- [技術スタック](#技術スタック)
- [クイックスタート](#クイックスタート)
- [アーキテクチャ](#アーキテクチャ)
- [ドキュメント](#ドキュメント)
- [ライセンス](#ライセンス)

## 概要

Commons Ground は、以下の3つのフェーズを通じて、未来社会の構想から議論、分析までを一貫して行うプラットフォームです：

1. **Phase 1: 課題を設定する** - SFストーリーから議論可能な命題を生成
2. **Phase 2: 議論に参加する** - Polis型投票で多様な意見を収集
3. **Phase 3: 議論の内容を分析する** - 投票結果を可視化し、合意と対立を明らかにする

## 機能

### Phase 1: 課題を設定する

- **セッション作成**: タイトルとプロンプトから新しい議論セッションを作成
- **ストーリー生成**: OpenAI APIを使用してSFストーリーと政策ストーリーを生成
- **画像生成**: Gemini 2.5 Flash Image APIまたはImagen APIで代表画像を生成
- **命題生成**: 政策ストーリーから議論可能な日本語命題を生成・編集
- **APS処理**: 日本語命題を英訳 → Gemma-APSで分割 → 再翻訳して最適化

### Phase 2: 議論に参加する

- **命題選択**: APS承認済みの命題をタイル形式で表示し、投票対象を選択
- **Polis型投票**: Yes / No / Pass で各命題に投票（匿名IDで管理）

### Phase 3: 議論の内容を分析する

- **結果可視化**: 各命題の賛成率・反対率・Pass率を棒グラフで表示
- **統計情報**: 総投票数や参加者数などの統計を表示

## 技術スタック

### フロントエンド・バックエンド

- **フレームワーク**: Next.js 14 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL (Prisma ORM)
- **デプロイ**: Vercel

### 外部API

- **OpenAI API**: ストーリー生成、命題生成、翻訳
- **Gemini 2.5 Flash Image API**: 画像生成（デフォルト）
- **Imagen API**: 画像生成（オプション）
- **Hugging Face Inference API**: Gemma-APS（命題分割）
- **Vertex AI**: OAuth2認証（Imagen使用時）

## クイックスタート

### 前提条件

- Node.js 18以上
- PostgreSQL データベース（Neon、Supabase、Vercel Postgresなど）
- 以下のAPIキー：
  - OpenAI API キー
  - Google API キー（またはサービスアカウントキー）
  - Hugging Face API トークン

### セットアップ手順

1. **リポジトリのクローン**

```bash
git clone <repository-url>
cd SFPrototyping_Polis
```

2. **依存関係のインストール**

```bash
npm install
```

3. **環境変数の設定**

`.env.local` ファイルを作成し、必要な環境変数を設定：

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# OpenAI
OPENAI_API_KEY=sk-...

# Google / Vertex AI
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# または、サービスアカウントキーJSONファイルをプロジェクトルートに配置

# Hugging Face
HF_API_TOKEN=hf_...

# 画像生成プロバイダー（オプション、デフォルト: gemini）
IMAGE_GENERATION_PROVIDER=gemini
```

詳細は [環境変数の設定方法](docs/GETTING_STARTED.md#環境変数の設定) を参照してください。

4. **データベースマイグレーション**

```bash
npx prisma migrate dev
```

5. **開発サーバーの起動**

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

### 初回動作確認

1. ホームページで新しいセッションを作成
2. Phase 1の各ステップを順番に実行：
   - ストーリー生成 → 承認
   - 画像生成
   - 命題生成 → 編集 → 承認
   - APS実行 → 承認
3. Phase 2で投票を実行
4. Phase 3で結果を確認

詳細な動作確認手順は [開発ガイド](docs/DEVELOPMENT.md) を参照してください。

## アーキテクチャ

### データモデル

```
Session
├── Story (ストーリーと画像)
├── Proposition (命題)
│   └── Statement (投票用文)
│       └── Vote (投票)
├── Participant (参加者)
└── AnalysisResult (分析結果)
```

### フェーズフロー

```
Phase 1: 課題設定
  Session → Story → Proposition (status_aps_approved = true)
  ↓
Phase 2: 議論参加
  Proposition → Statement (selected_for_voting = true)
  Participant → Vote
  ↓
Phase 3: 分析
  AnalysisResult (results_json)
```

詳細は [アーキテクチャドキュメント](docs/ARCHITECTURE.md) を参照してください。

## ドキュメント

### セットアップ・開発

- [**セットアップガイド**](docs/GETTING_STARTED.md) - 環境構築とクイックスタート
- [**開発ガイド**](docs/DEVELOPMENT.md) - 開発環境での動作確認とテスト
- [**API設定ガイド**](docs/API_SETUP.md) - 外部APIの設定方法

### アーキテクチャ・設計

- [**アーキテクチャ**](docs/ARCHITECTURE.md) - フェーズ構造とデータフロー
- [**移行ガイド**](docs/MIGRATION_GUIDES.md) - フェーズ間の移行方法

### デプロイ

- [**デプロイ手順**](docs/DEPLOYMENT.md) - Vercelへのデプロイ方法

### アーカイブ

- [**初期計画**](docs/ARCHIVE/initialplanning/) - プロジェクト初期の計画ドキュメント
- [**MVP要件**](docs/ARCHIVE/firststep/) - MVP開発時の要件定義

## プロジェクト構造

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── sessions/          # セッション関連ページ
│   └── page.tsx           # ホームページ
├── components/            # Reactコンポーネント
├── lib/                   # ユーティリティとライブラリ
├── prisma/                # Prismaスキーマとマイグレーション
├── docs/                  # ドキュメント
└── public/                # 静的ファイル
```

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Prisma関連
npx prisma generate        # Prisma Client生成
npx prisma migrate dev     # マイグレーション実行
npx prisma studio          # Prisma Studio起動

# シードデータ（Flow2用）
npm run seed:flow2
```

## トラブルシューティング

よくある問題と解決方法は [開発ガイド](docs/DEVELOPMENT.md#よくある問題と解決方法) を参照してください。

## ライセンス

Private
