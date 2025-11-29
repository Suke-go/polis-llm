# アーキテクチャ

このドキュメントでは、Commons Groundのアーキテクチャ、フェーズ構造、データフローについて説明します。

## 目次

- [概要](#概要)
- [フェーズ構造](#フェーズ構造)
- [データモデル](#データモデル)
- [データフロー](#データフロー)
- [API構造](#api構造)
- [UI構成](#ui構成)

## 概要

Commons Groundは、以下の3つのフェーズで構成されるWebアプリケーションです：

1. **Phase 1: 課題を設定する** - SFストーリーから議論可能な命題を生成
2. **Phase 2: 議論に参加する** - Polis型投票で多様な意見を収集
3. **Phase 3: 議論の内容を分析する** - 投票結果を可視化し、合意と対立を明らかにする

各フェーズは独立して動作し、前のフェーズの完了を前提として次のフェーズに進みます。

## フェーズ構造

### Phase 1: 課題を設定する

**目的**: 議論のテーマとなる課題を設定し、議論可能な命題を生成する

**ステップ**:

1. **ストーリー生成** (`/sessions/[id]/story`)
   - プロンプトからSFストーリーと政策ストーリーを生成（OpenAI API）
   - ストーリーの承認（`status_story_approved = true`）

2. **画像生成** (`/sessions/[id]/image`)
   - ストーリーから代表画像を生成（Gemini 2.5 Flash Image APIまたはImagen API）
   - 画像URLを保存（`status_image_generated = true`）

3. **日本語命題生成** (`/sessions/[id]/propositions`)
   - 政策ストーリーから議論可能な日本語命題を生成（OpenAI API）
   - 命題の編集・承認（`status_edit_approved = true`）

4. **APS処理** (`/sessions/[id]/aps`)
   - 日本語命題を英訳 → Gemma-APSで分割 → 再翻訳
   - APS結果の確認・承認（`status_aps_approved = true`）

**完了条件**: APSが承認される（`status_aps_approved = true`）

### Phase 2: 議論に参加する

**目的**: 生成された命題に対して、参加者が投票を行う

**ステップ**:

1. **命題選択** (`/sessions/[id]/tiles`)
   - APS承認済みの命題をタイル形式で表示
   - 投票対象として使用する命題を選択
   - 選択した命題を投票文に整形（「〜すべきだ。」形式）
   - `Statement` テーブルに保存（`selected_for_voting = true`）

2. **投票** (`/sessions/[id]/vote`)
   - 選択された命題に対して、Yes / No / Pass で投票
   - 投票内容は匿名ID（`Participant`）に紐づいて保存

**完了条件**: 参加者が投票を完了する（任意のタイミングで完了可能）

### Phase 3: 議論の内容を分析する

**目的**: 収集された投票結果を分析し、可視化する

**ステップ**:

1. **結果可視化** (`/sessions/[id]/results`)
   - 各命題に対する投票結果を集計
   - 賛成率・反対率・Pass率を棒グラフで表示
   - 総投票数も表示

**完了条件**: 結果が表示される（投票があれば自動的に集計される）

## データモデル

### エンティティ関係図

```
Session (セッション)
├── Story (ストーリーと画像)
│   └── sessionId (FK)
├── Proposition (命題)
│   ├── sessionId (FK)
│   └── Statement (投票用文)
│       ├── propositionId (FK)
│       └── Vote (投票)
│           ├── statementId (FK)
│           └── participantId (FK)
├── Participant (参加者)
│   └── sessionId (FK)
└── AnalysisResult (分析結果)
    └── sessionId (FK)
```

### 主要テーブル

#### Session

- `id`: UUID (PK)
- `title`: セッションタイトル
- `prompt`: ユーザー入力の元プロンプト
- `createdAt`: 作成日時

#### Story

- `id`: UUID (PK)
- `sessionId`: UUID (FK → Session)
- `sf_story_ja`: SFストーリー（日本語）
- `policy_story_ja`: 政策ストーリー（日本語）
- `status_story_approved`: ストーリー承認フラグ
- `image_url`: 代表画像URL
- `status_image_generated`: 画像生成フラグ

#### Proposition

- `id`: UUID (PK)
- `sessionId`: UUID (FK → Session)
- `ja_text`: 日本語命題
- `en_text`: 英訳された命題
- `back_translated_ja`: 再翻訳された日本語
- `translation_diff_score`: 翻訳差分スコア
- `status_edit_approved`: 編集承認フラグ
- `status_aps_approved`: APS承認フラグ

#### Statement

- `id`: UUID (PK)
- `sessionId`: UUID (FK → Session)
- `propositionId`: UUID (FK → Proposition)
- `text_ja`: 投票用文（「〜すべきだ。」形式）
- `text_en`: 投票用文（英語）
- `selected_for_voting`: 投票対象フラグ

#### Participant

- `id`: UUID (PK)
- `sessionId`: UUID (FK → Session)

#### Vote

- `participantId`: UUID (FK → Participant)
- `statementId`: UUID (FK → Statement)
- `vote`: Int (+1: Yes, -1: No, 0: Pass)
- `createdAt`: 作成日時

#### AnalysisResult

- `sessionId`: UUID (PK, FK → Session)
- `resultsJson`: JSONB（集計結果）
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

## データフロー

### Phase 1 → Phase 2

```
Phase 1: 課題設定
  Session
    ↓
  Story (status_story_approved = true)
    ↓
  Proposition (status_aps_approved = true)
    ↓
Phase 2: 議論参加
  Statement (selected_for_voting = true)
    ↓
  Vote
```

### Phase 2 → Phase 3

```
Phase 2: 議論参加
  Vote
    ↓
Phase 3: 分析
  AnalysisResult (results_json)
```

### フェーズ間の移行条件

#### Phase 1 → Phase 2

- **前提条件**: APSが承認されている（`status_aps_approved = true`）
- **移行方法**:
  - APSページ（`/sessions/[id]/aps`）の下部にある「Phase 2: 議論に参加する」リンクをクリック
  - または直接 `/sessions/[id]/tiles` にアクセス

#### Phase 2 → Phase 3

- **前提条件**: 投票対象の命題が選択されている（`statements.selected_for_voting = true`）
- **移行方法**:
  - 投票ページ（`/sessions/[id]/vote`）の「結果可視化へ」リンクをクリック
  - または直接 `/sessions/[id]/results` にアクセス

## API構造

### Phase 1 API

- `POST /api/session` - セッション作成
- `POST /api/story/generate` - ストーリー生成
- `POST /api/story/approve` - ストーリー承認
- `POST /api/image/generate` - 画像生成
- `POST /api/propositions/generate` - 命題生成
- `POST /api/propositions/approve-edit` - 命題編集承認
- `POST /api/propositions/aps` - APS処理
- `POST /api/propositions/approve-aps` - APS承認

### Phase 2 API

- `GET /api/propositions?sessionId=...` - APS承認済み命題一覧
- `POST /api/statements/from-propositions` - 命題から投票文生成
- `POST /api/participants/join` - 参加者登録
- `GET /api/statements?sessionId=...` - 投票対象命題一覧
- `POST /api/vote` - 投票送信

### Phase 3 API

- `POST /api/analysis/run` - 分析実行
- `GET /api/analysis/result?sessionId=...` - 分析結果取得

## UI構成

### ナビゲーション

#### PhaseNav

各ページの上部に **PhaseNav** コンポーネントが表示され、3つのフェーズ間を移動できます：

- **Phase 1: 課題を設定する** - Phase 1の最後のページ（APS）へのリンク
- **Phase 2: 議論に参加する** - Phase 2の最初のページ（タイル選択）へのリンク
- **Phase 3: 議論の内容を分析する** - Phase 3のページ（結果可視化）へのリンク

現在のフェーズはハイライト表示され、完了したフェーズは緑色で表示されます。

#### StepNav（Phase 1内）

Phase 1内では、**StepNav** コンポーネントで4つのステップ間を移動できます：

1. ストーリー
2. 画像
3. 日本語命題
4. APS

各ステップページには「前へ」「次へ」ボタンも表示されます。

### ページ構成

```
/ (ホーム)
├── /sessions/[id] (セッション詳細)
├── /sessions/[id]/story (ストーリー生成)
├── /sessions/[id]/image (画像生成)
├── /sessions/[id]/propositions (命題生成)
├── /sessions/[id]/aps (APS処理)
├── /sessions/[id]/tiles (命題選択)
├── /sessions/[id]/vote (投票)
└── /sessions/[id]/results (結果可視化)
```

## チェックリスト

### Phase 1完了の確認

- [ ] セッションが作成されている
- [ ] ストーリーが生成・承認されている
- [ ] 画像が生成されている
- [ ] 命題が生成・承認されている
- [ ] **APSが実行・承認されている** ← 最重要

### Phase 2完了の確認

- [ ] 投票対象の命題が選択されている
- [ ] 少なくとも1人の参加者が投票している

### Phase 3完了の確認

- [ ] 投票結果が集計されている
- [ ] 結果が可視化されている

## 関連ドキュメント

- [セットアップガイド](GETTING_STARTED.md)
- [開発ガイド](DEVELOPMENT.md)
- [移行ガイド](MIGRATION_GUIDES.md)

