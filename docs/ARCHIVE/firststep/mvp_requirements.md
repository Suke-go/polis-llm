## 0. このドキュメントの目的

SFプロトタイピング × APS × Polis を **1つの Web アプリ** の中で動かすための  
「最初に作るべきプロトタイプ要件」を、**フロー別**に分解してまとめる。

フォーカスするフローは次の3つ：

1. プロンプト → ストーリー・明文化 → 承認 → 画像生成 → 命題改変 → 承認 → 翻訳・APS・再翻訳 → 承認 → 完成  
2. タイル表示 → 命題選択 → Polis（投票 UI）
3. タイル表示 → 命題選択 → 回答可視化

ここに書かれた要件どおりに各エージェントが作業すれば、  
**APIキーを環境変数に設定してデプロイするだけで動く MVP** になることを目標とする。

---

## 1. 共通前提

- **技術スタック**
  - Next.js (App Router) + TypeScript
  - デプロイ先: Vercel（Node.js runtime 前提）
  - UI: Tailwind CSS（＋必要なら Headless UI）
- **外部サービス（すべて env で鍵を注入）**
  - OpenAI API（スタイル変換・翻訳・論点抽出・命題改変など）
  - Gemma-APS（Google AI for Developers / `gemma-aps`）
  - Google 画像生成 API
- **DB**
  - ホスト型 Postgres（Supabase / Neon / Vercel Postgres のいずれか）を前提
  - 主なテーブル:  
    `sessions`, `stories`, `propositions`, `statements`, `participants`, `votes`, `analysis_results`

---

## 2. フロー1: プロンプト → ストーリー・明文化 → 画像 → 命題生成 & APS検証

**目的**: 1つのセッションに対して、

> プロンプト → ストーリー・明文化 → 承認 → 画像生成 → 命題改変（議論しやすい形） → 承認 → 翻訳・APS・再翻訳 → 承認 → 完成（画像・ストーリー・命題リスト）

という一連のパイプラインを Web UI から操作・検証できるようにする。

### 2-1. このフローで使う主なテーブル

- **`sessions`**
  - `id` (UUID, PK)
  - `title` (text)
  - `prompt` (text)  ※ユーザー入力の元プロンプト
  - `created_at` (timestamp)

- **`stories`**
  - `id` (UUID, PK)
  - `session_id` (UUID, FK)
  - `sf_story_ja` (text)        ※未来の状況を描いた日本語ストーリー
  - `policy_story_ja` (text)    ※明文化されたストーリー
  - `status_story_approved` (boolean)  ※明文化テキストの承認フラグ
  - `image_url` (text)          ※代表画像
  - `status_image_generated` (boolean)

- **`propositions`**
  - `id` (UUID, PK)
  - `session_id` (UUID, FK)
  - `ja_text` (text)            ※議論しやすい命題（日本語）
  - `en_text` (text)            ※APS後の英文命題
  - `back_translated_ja` (text) ※再翻訳された日本語
  - `translation_diff_score` (numeric) ※日英差分スコア（任意）
  - `status_edit_approved` (boolean)   ※命題リスト（日本語）の承認
  - `status_aps_approved` (boolean)    ※APS＋翻訳結果の承認

### 2-2. API（パイプライン単位）

- **`POST /api/session`**
  - Body: `{ title, prompt }`
  - 挙動: `sessions` に作成し `{ sessionId }` を返す。

- **`POST /api/story/generate`**
  - Body: `{ sessionId }`
  - 挙動:
    - OpenAI で `prompt` から `sf_story_ja` と `policy_story_ja` を生成。
    - `stories` に保存し、`status_story_approved = false` で初期化。

- **`POST /api/story/approve`**
  - Body: `{ sessionId }`
  - 挙動: `stories.status_story_approved = true` に更新。

- **`POST /api/image/generate`**
  - Body: `{ sessionId }`
  - 前提: `status_story_approved = true`
  - 挙動:
    - `policy_story_ja` 等をプロンプトに、Google 画像生成 API で1枚生成。
    - `image_url` を保存し、`status_image_generated = true` に。

- **`POST /api/propositions/generate`**
  - Body: `{ sessionId }`
  - 前提: ストーリー生成済み（承認済みが望ましい）
  - 挙動:
    - OpenAI で「より具体的な構想・議論を引き起こしそうな命題（抽象的でも良い，価値観や感情などに関連しているとよい，具体的な想定が入っていると望ましい）」のリストを生成。
    - `propositions.ja_text` に保存し、`status_edit_approved = false` で初期化。

- **`POST /api/propositions/approve-edit`**
  - Body: `{ sessionId, editedItems }`
  - 挙動:
    - フロントで編集された命題リスト（削除・追記・文面修正済み）を受け取り、`propositions` を更新。
    - `status_edit_approved = true` に更新。

- **`POST /api/propositions/aps`**
  - Body: `{ sessionId }`
  - 前提: `status_edit_approved = true`
  - 挙動:
    - OpenAI で日本語命題を英訳 → 一つの英文テキストとして連結。
    - Gemma-APS に投入し、細かい英文命題に分割。
    - OpenAI で再翻訳し `back_translated_ja` を保存。
    - `translation_diff_score` 等を計算して `propositions` を更新。

- **`POST /api/propositions/approve-aps`**
  - Body: `{ sessionId }`
  - 挙動:
    - UI 上で APS 結果を確認後、「これでOK」のタイミングで `status_aps_approved = true` にする。

### 2-3. フロント（パイプライン UI）

- **`app/page.tsx`**
  - 「新しいセッションを作成」フォーム（タイトル＋プロンプト）。
  - 作成後は `sessions/[sessionId]` に遷移。

- **`app/sessions/[sessionId]/page.tsx`**
  - 1画面でフロー全体を俯瞰できる「ウィザード」UI:
    1. プロンプト & ストーリー生成（生成ボタン / 再生成ボタン / 承認ボタン）
    2. 画像生成（生成ボタン）
    3. 日本語命題の生成・編集・承認
    4. 翻訳・APS・再翻訳の実行と結果確認・承認
  - 各ステップの完了状況をバッジ等で表示し、「最終的に承認された命題リスト」と「画像」「ストーリー」をまとめて確認できる。

---

## 3. フロー2: タイル表示 → 命題選択 → Polis型投票

**目的**: フロー1で完成した命題リストを「タイルUI」で確認し、その中から投票に使う命題を選び、Polis風の Yes/No/Pass 投票を行えるようにする。

### 3-1. テーブル

- **`statements`**
  - `id` (UUID, PK)
  - `session_id` (UUID, FK)
  - `proposition_id` (UUID, FK → propositions.id)
  - `text_ja` (text)  ※「〜すべきだ。」形式の投票用文
  - `selected_for_voting` (boolean)

- **`participants`**
  - `id` (UUID, PK)
  - `session_id` (UUID, FK)

- **`votes`**
  - `participant_id` (UUID, FK)
  - `statement_id` (UUID, FK)
  - `vote` (int, +1 / -1 / 0)

### 3-2. API

- **`GET /api/propositions?sessionId=...`**
  - 挙動: `status_aps_approved = true` の `propositions` を一覧で返す（タイル表示用）。

- **`POST /api/statements/from-propositions`**
  - Body: `{ sessionId, selectedPropositionIds }`
  - 挙動:
    - 選択された命題に対して、OpenAI で「Yes/No 投票文（〜すべきだ形式）」に再整形。
    - `statements` に `text_ja` と `proposition_id` を保存し、`selected_for_voting = true` にする。

- **`POST /api/participants/join`**
  - 挙動: ランダムUUIDで `participants` に1行作成し `{ participantId }` を返す（ゆるい匿名ID）。

- **`GET /api/statements?sessionId=...`**
  - 挙動: `selected_for_voting = true` の `statements` を返す。

- **`POST /api/vote`**
  - Body: `{ participantId, statementId, vote }`
  - 挙動: 既存レコードあればUPDATE、なければINSERT。

### 3-3. フロント（タイル & 投票 UI）

- **`app/sessions/[sessionId]/tiles/page.tsx`（命題タイル表示＆選択）**
  - `GET /api/propositions` で命題リストを取得し、カード（タイル）として表示。
  - チェックボックスなどで「投票に使う命題」を選択し、`/api/statements/from-propositions` を呼ぶ。

- **`app/sessions/[sessionId]/vote/page.tsx`（Polis風投票）**
  - 初回アクセス時:
    - cookie/localStorage から `participantId` を探し、なければ `/api/participants/join`。
    - `/api/statements` を呼んで投票用命題を取得。
  - UI:
    - 各命題カードに Yes / No / Pass ボタン。
    - 押すたびに `/api/vote` を呼ぶ。

---

## 4. フロー3: タイル表示 → 命題選択 → 回答可視化

**目的**: 投票結果をもとに、「どの命題にどういう回答分布が出ているか」をタイル＋簡易グラフで可視化する。

### 4-1. テーブル

- **`analysis_results`**（簡易版）
  - `session_id` (UUID, PK)
  - `results_json` (JSONB)
    - 例: `[{ statementId, textJa, agreeRate, disagreeRate, passRate }]`

### 4-2. API

- **`POST /api/analysis/run`**
  - Body: `{ sessionId }`
  - 挙動:
    - `votes` を集計し、各 `statementId` ごとに
      - `agreeRate` (+1の比率)
      - `disagreeRate` (-1の比率)
      - `passRate` (0の比率)
    - `statements` と結合して `results_json` を構築し、`analysis_results` にUPSERT。

- **`GET /api/analysis/result?sessionId=...`**
  - 挙動:
    - `analysis_results.results_json` を返す（なければ `POST /api/analysis/run` を内部呼び出ししてもよい）。

### 4-3. フロント（回答可視化）

- **`app/sessions/[sessionId]/results/page.tsx`**
  - 初回アクセス:
    - `/api/analysis/result` を呼び、`[{ statementId, textJa, agreeRate, ... }]` を取得。
  - UI:
    - 各命題をタイルとして並べ、棒グラフ or 比率表示で賛否・Pass を可視化。
    - 将来的な PCA / クラスタリング結果を載せるためのスペースも残しておく。

---

## 5. デプロイと環境変数

- **必要な環境変数の例**
  - `OPENAI_API_KEY`
  - `GOOGLE_PROJECT_ID`
  - `GOOGLE_LOCATION`
  - `GOOGLE_APPLICATION_CREDENTIALS`（または類似の認証方法）
  - `GOOGLE_IMAGE_MODEL`
  - `DATABASE_URL`（Postgres 接続文字列）

- **目標**
  - 上記 env を Vercel の環境変数に設定し、`git push` → Vercel デプロイするだけで、
    - フロー1: ストーリー・画像・命題リスト（APS検証込み）の生成
    - フロー2: 命題タイルからの選択 & Polis型投票
    - フロー3: 賛否分布の可視化
    が一通り動作する。

---

## 6. 機能別タスクの割り当てイメージ

- **Agent 1: フロー1（ストーリー〜命題生成 & APS検証のバックエンド）**
  - `sessions`, `stories`, `propositions` テーブル定義。
  - `/api/session`, `/api/story/*`, `/api/image/generate`, `/api/propositions/*` の実装。
- **Agent 2: フロー1のフロント（ウィザードUI）**
  - `page.tsx`, `sessions/[sessionId]/page.tsx` の実装（各ステップの承認UIを含む）。
- **Agent 3: フロー2（Polis投票）**
  - `statements`, `participants`, `votes` テーブル定義。
  - `/api/statements/*`, `/api/participants/join`, `/api/vote` の実装。
  - `sessions/[sessionId]/tiles/page.tsx`, `sessions/[sessionId]/vote/page.tsx` のUI実装。
- **Agent 4: フロー3（回答可視化）**
  - `analysis_results` テーブル定義。
  - `/api/analysis/*` の実装。
  - `sessions/[sessionId]/results/page.tsx` のUI実装。

これらを統合することで、`masterdocs.md` に記載の全体構想と、  
あなたがイメージしている

> プロンプト→ストーリー・明文化→承認→画像生成→命題改変→承認翻訳・APS・再翻訳→承認→完成  
> タイル表示→命題選択→Polis  
> タイル表示→命題選択→回答可視化

という3本のフローを備えた「最初の動く Web アプリ」が完成する。


