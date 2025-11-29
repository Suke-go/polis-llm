# クイックスタートガイド

## ローカル環境での動作確認

### 1. セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定（.env ファイルを作成）
# 詳細は docs/ENV_SETUP.md を参照

# データベースマイグレーション
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

### 2. 動作確認の流れ

#### ステップ1: セッション作成
1. `http://localhost:3000` にアクセス
2. 「新しいセッションを作成」でタイトルとプロンプトを入力
3. セッション詳細ページに遷移

#### ステップ2: フロー1の実行
1. `/sessions/[sessionId]/story` - ストーリー生成・承認
2. `/sessions/[sessionId]/image` - 画像生成
3. `/sessions/[sessionId]/propositions` - 命題生成・編集・承認
4. `/sessions/[sessionId]/aps` - APS 実行・承認

#### ステップ3: フロー2の実行
1. `/sessions/[sessionId]/tiles` - 命題を選択
2. `/sessions/[sessionId]/vote` - 投票を実行

#### ステップ4: フロー3の確認
1. `/sessions/[sessionId]/results` - 結果を確認

## Vercel デプロイ

### 1. デプロイ前の準備

- [ ] GitHub リポジトリにプッシュ済み
- [ ] データベース（PostgreSQL）が用意されている
- [ ] すべての API キーを取得済み

### 2. Vercel での設定

1. [Vercel](https://vercel.com) でプロジェクトを作成
2. GitHub リポジトリを接続
3. 環境変数を設定（[docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) を参照）

### 3. 初回デプロイ後の作業

```bash
# Vercel CLI で環境変数を取得
vercel env pull .env.local

# データベースマイグレーション実行
npx prisma migrate deploy
```

### 4. 動作確認

本番 URL で各フローを確認：
- セッション作成
- ストーリー生成
- 画像生成
- 命題生成・APS
- 投票
- 結果可視化

詳細は [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) を参照してください。

