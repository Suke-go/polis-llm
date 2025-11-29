## 0. システム概要（SFプロトタイピング × APS × Polis）

**目的**  
SFプロトタイピングで生成した未来ストーリーから、APS（Gemma-APS）と LLM を使って政策的な命題を抽出し、Polis スタイルの意見投票・クラスタリング・可視化までを一気通貫で行うプロトタイプを構築する。  
**デプロイ先**は Vercel を想定し、**フロントエンドと API（サーバレス）を Next.js で一体運用**する。

- **SF レイヤ**: ユーザーがテーマや都市を入力 → LLM で Society 5.0 視点を踏まえた SF / Policy ストーリー生成
- **命題化レイヤ**:  
  - OpenAI API で詩的表現の抑制、論点抽出、日英翻訳、Yes/No 向け文への整形  
  - Gemma-APS（Google AI for Developers / gemma-aps）で英文を命題単位に分割
- **投票・分析レイヤ**: 抽出された約 30 命題を Polis 型 UI で提示し、投票データから意見クラスタ・代表コメント・コンセンサス命題を算出
- **可視化レイヤ**: 2D 意見空間（PCA）、クラスタごとの代表命題・分断命題、合意命題をブラウザで可視化

---

## 1. 技術スタックとインフラ

- **フロントエンド / BFF**
  - Next.js (App Router) + TypeScript
  - デプロイ: Vercel
  - UI: Tailwind CSS + Headless UI（あるいは shadcn/ui）

- **バックエンド（サーバレス API）**
  - Next.js の `app/api/**/route.ts` を利用
  - SF 生成〜命題抽出〜Polis パイプラインを 3–5 個程度の API に分割

- **外部 AI サービス**
  - **OpenAI API**
    - 用途:  
      - SF → Policy Story へのスタイル変換  
      - Issue / Conflict 抽出  
      - 日本語↔英語翻訳（高品質 LLM 翻訳）  
      - 命題の Yes/No 形式への整形・命題の再書き
  - **Gemma-APS（Google AI for Developers）**
    - 用途: Abstractive Proposition Segmentation（APS）
    - アクセス: Google Generative AI / Vertex AI 経由の推論エンドポイント（`gemma-aps`）
  - **Google 画像生成 API**
    - 用途: SF プロトタイピング用のイメージ生成（ストーリーの雰囲気を示す画像）
    - 例: `models/imagegeneration` 系（Imagen 3 相当など）

- **データベース**
  - 管理しやすい **ホスト型 Postgres** を想定（例: Supabase / Neon / Vercel Postgres のいずれか）
  - SF セッション／命題／投票を永続化して再分析できるようにする

- **認証**
  - 初期プロトタイプ: 匿名参加を前提に簡易な `session_id` ベース
  - 将来的に Magic Link / OAuth 連携も追加可能な構造にする

---

## 2. ドメインモデル

### 2-1. SF / Story サイド

- **`sessions`**
  - `id`: UUID
  - `title`: シナリオタイトル（例: 「自動運転レーンと商店街の未来」）
  - `city`: 対象都市・地区
  - `theme`: テーマ（モビリティ / 防災 / ケア / 教育 など）
  - `society5_tags`: JSONB（`["wellbeing", "resilience", ...]`）
  - `created_at`

- **`stories`**
  - `id`: UUID
  - `session_id`: FK → `sessions.id`
  - `sf_story_ja`: SF 的な初期ストーリー（日本語）
  - `policy_story_ja`: 詩的表現を抑制した政策ストーリー（日本語）
  - `policy_story_en`: 英訳（APS 前提）
  - `meta`: JSONB（スタイル変換・スケールチェック結果など）

- **`issues`**（APS 前の粗い論点）
  - `id`: UUID
  - `session_id`: FK
  - `label_ja`: 論点の短い説明
  - `stakeholders`: JSONB（関係ステークホルダー）
  - `pros_ja` / `cons_ja`: 賛成・反対の要約
  - `ja_text`: 命題候補（日本語）
  - `en_text`: 命題候補（英語）
  - `translation_diff_score`: 日英差分スコア
  - `needs_review`: boolean

### 2-2. APS / 命題サイド

- **`propositions`**
  - `id`: UUID
  - `session_id`: FK
  - `issue_id`: FK → `issues.id`（null も可）
  - `en_text`: Gemma-APS から得た英文命題
  - `ja_text`: OpenAI で逆翻訳した日本語命題
  - `quality_scores`: JSONB（atomic / self-contained / supported / comprehensive などのスコア）
  - `selected_for_voting`: boolean（30 命題への選定結果）
  - `controversy_score`: number（LLM 推定の賛否割れ度合い）
  - `complexity_score`: number（文長・構文複雑さ）

### 2-3. Polis 型投票サイド

- **`participants`**
  - `id`: UUID
  - `session_id`: FK
  - `anon_label`: 匿名ラベル（例: `P-001`）
  - `attributes`: JSONB（任意属性：年代カテゴリなど）

- **`statements`**
  - 実体は `propositions` に近いが「投票用フォーマット」に整形されたもの
  - `id`: UUID
  - `session_id`: FK
  - `proposition_id`: FK → `propositions.id`
  - `text_ja`: 「〜すべきだ。」形式の日本語投票文
  - `text_en`: 対応する英文
  - `tags`: JSONB（Society5.0 観点 / ステークホルダー / トピック）

- **`votes`**
  - `participant_id`: FK
  - `statement_id`: FK
  - `vote`: integer（`+1` = Yes, `-1` = No, `0` = Pass）
  - `created_at`

この `votes` テーブルを行列化し、`plan_Polis.md` に記載の PCA → k-means → 代表コメント抽出 → コンセンサス計算を実行する。

---

## 3. ユースケース別フロー

### 3-1. シナリオ生成〜命題抽出フロー

1. **セッション作成（フロント）**
   - ユーザーがフォームで都市・テーマ・Society 5.0 観点を入力
   - `POST /api/session` → `sessions` レコード作成

2. **SF ストーリー生成（OpenAI + Google 画像）**
   - `POST /api/sf/generate`
   - OpenAI Chat Completions で SF ストーリー（日本語）生成  
     - プロンプトで「比喩を控えめ」「市レベルのスケール」を指定
   - 生成テキストをプロンプトとして Google 画像生成 API に投げ、キーイメージを生成
   - 結果を `stories.sf_story_ja` と、画像メタ情報として保存

3. **Policy Story Refiner（OpenAI）**
   - `POST /api/story/refine`
   - 入力: `sf_story_ja`
   - 出力:  
     - 詩的表現を抑えた Policy ストーリー（`policy_story_ja`）  
     - Society5.0 観点タグ、スケール判定結果

4. **Issue & Conflict Extractor（OpenAI）**
   - `POST /api/issues/extract`
   - 入力: `policy_story_ja`
   - 出力: 複数の論点レコード（`issues`）

5. **日英翻訳 & Consistency Check（OpenAI）**
   - `POST /api/issues/translate`
   - 各 `issues.ja_text` を高品質 LLM で英訳 → `en_text`
   - バックトランスレーションで差分スコアを算出 → `translation_diff_score` / `needs_review`

6. **APS エンジン（Gemma-APS）**
   - `POST /api/aps/segment`
   - まとまりのある英文テキストを結合して `gemma-aps` エンドポイントに送信
   - 返ってきた命題リストを `propositions` に保存し、品質スコアを付与

7. **Proposition Selector（OpenAI）**
   - `POST /api/propositions/select`
   - 入力: `propositions` + 各種スコア
   - OpenAI に  
     - Society5.0 カバレッジ  
     - ステークホルダー多様性  
     - controversy / complexity  
     を見ながら 30 件程度を選ばせる
   - 選ばれたものを `selected_for_voting = true` にし、Yes/No 投票用に再整形して `statements` を生成

### 3-2. Polis スタイル投票〜分析フロー

1. **参加者エントリー**
   - フロントで匿名参加ページを開く → `POST /api/participants/join`
   - `participants` レコード作成、**厳密な認証なしの一時 ID** をクッキーに保存  
     （Polis 本家では OAuth 等も選択肢だが、本プロトタイプでは「ゆるい匿名 ID」で十分とする）

2. **命題提示 & 投票 UI**
   - フロントで `GET /api/statements?session_id=...` を呼び、約 30 命題を取得
   - 命題カード + 「Yes / No / Pass」ボタンを表示
   - 各投票で `POST /api/vote` を叩き、`votes` に保存

3. **意見空間クラスタリング（バッチ or on-demand）**
   - `POST /api/analysis/run` で以下を実行（`plan_Polis.md` を実装）
     1. 参加者×命題行列 `V` 構築（`votes` → `V`）
     2. 欠損補完（列平均）、投票数の少ない参加者の除外
     3. PCA による 2D 座標取得 + 投票数によるスケーリング
     4. k-means によるマイクロクラスタ（K=100）、マクロクラスタ（K=2〜5 + シルエット）
     5. 各グループ g ごとに代表コメント / 分断コメント抽出  
        （`R_v(g,c)` + Fisher の Z 統計量、`C_v(c)`）
   - 分析結果を `analysis_results` のような JSONB テーブルに保存しておく

4. **可視化**
   - フロントで `GET /api/analysis/result?session_id=...`
   - 返却内容:
     - 参加者座標 `x_i` とクラスタ ID
     - 各グループの代表命題・分断命題
     - 全グループコンセンサス命題（`C_v(c)` 高い順）
   - UI:
     - 2D 散布図（意見空間） + クラスタ別の色分け
     - 命題リストのフィルタ（グループ別 / コンセンサス度 / 分断度）

---

## 4. API 設計（ラフ）

### 4-1. SF / Story 系

- `POST /api/session`
  - Body: `{ title, city, theme, society5Tags }`
  - Res: `{ sessionId }`

- `POST /api/sf/generate`
  - Body: `{ sessionId }`
  - 処理: OpenAI でストーリー生成 → Google 画像生成 → `stories` 保存

- `POST /api/story/refine`
  - Body: `{ sessionId }`
  - 処理: `sf_story_ja` を Policy Story に変換

- `POST /api/issues/extract`
  - Body: `{ sessionId }`

- `POST /api/issues/translate`
  - Body: `{ sessionId }`

- `POST /api/aps/segment`
  - Body: `{ sessionId }`

- `POST /api/propositions/select`
  - Body: `{ sessionId, targetCount = 30 }`

### 4-2. 投票・分析系

- `POST /api/participants/join`
  - Res: `{ participantId }`
  - 挙動（簡略化方針）:
    - ランダムな UUID を生成し `participants` に 1 行だけ保存
    - 追加のプロフィール（年代・属性など）は任意項目とし、なくても投票可能
    - `participantId` はクッキー or localStorage に保存して、ページ再訪時も同じ ID を再利用できるようにする（Polis 本家のような厳密なユーザー管理までは行わない）

- `GET /api/statements`
  - Query: `sessionId`
  - Res: `Statement[]`（各命題の日本語テキスト・タグなど）
  - 実装イメージ:
    - `statements` テーブルから `session_id` でフィルタし、ランダム順 or 固定順で返す
    - 将来的には「まだ投票していない命題を優先して返す」ロジック（Polis 本家に近い挙動）も追加余地あり

- `POST /api/vote`
  - Body: `{ participantId, statementId, vote }`
  - 挙動:
    - 同じ `participantId` × `statementId` の組み合わせが既にあれば `UPDATE`、なければ `INSERT`
    - これにより「最後に選んだ投票結果」が常に保存される
    - 投票履歴はすべて DB にストレージしておき、集計・分析に再利用可能にする

- `POST /api/analysis/run`
  - Body: `{ sessionId }`
  - 最小実装:
    - `votes` を集計し、命題ごとの賛成率・反対率・Pass 率のみを計算して `analysis_results` に保存
    - バッチ処理 or 「結果ページアクセス時に on-demand で再計算」のどちらかを選択

- `GET /api/analysis/result`
  - Query: `sessionId`
  - 最小実装のレスポンス例:
    - `statements` と結合した次のような構造を返す:
      - `[{ statementId, textJa, agreeRate, disagreeRate, passRate }]`
    - 将来的にここに「PCA 座標」「クラスタ ID」「コンセンサススコア」などを追加する。

---

## 5. 外部サービス連携と環境変数

### 5-1. OpenAI API

- 利用想定:
  - Chat/Completions モデル（例: `gpt-4.1` 系）を想定
  - 翻訳・スタイル変換・論点抽出・選定などテキスト処理全般
- 主要環境変数:
  - `OPENAI_API_KEY`
  - `OPENAI_API_BASE`（必要なら）

### 5-2. Gemma-APS

- Google AI for Developers / Vertex AI にて `gemma-aps` モデルを利用
- 呼び出しは REST / gRPC のどちらか（Node 用 SDK 経由でも可）
- 主要環境変数:
  - `GOOGLE_PROJECT_ID`
  - `GOOGLE_LOCATION`（例: `us-central1`）
  - `GOOGLE_APPLICATION_CREDENTIALS`（Vercel では env にサービスアカウント JSON を入れ、起動時に一時ファイルに書き出すなどのパターンも可）

### 5-3. Google 画像生成 API

- 同じく Google Generative AI の画像生成エンドポイントを利用
- 主要環境変数:
  - `GOOGLE_IMAGE_MODEL`（例: `imagen-3.0` 相当のモデル名）

### 5-4. DB 関連

- 例として Supabase を採用する場合:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  
（DB 種別は実装時に確定し、この章をアップデートする）

### 5-5. 外部 API 呼び出しの共通パターン

このプロトタイプでは OpenAI / Google（Gemma-APS, 画像生成）など複数の外部 API を呼びますが、**呼び出し方の基本パターンは共通**にしておくと実装が整理しやすい。

- **ベース URL とエンドポイントの分離**
  - 例: `OPENAI_API_BASE`（任意）+ `/v1/chat/completions` のように、  
    「ベース URL は環境変数、パスはコード側に固定」で分ける。
  - Google 側も同様に、`GOOGLE_LOCATION`・`GOOGLE_PROJECT_ID` などから組み立て。

- **認証ヘッダーの共通化**
  - 典型的には `Authorization: Bearer {API_KEY}` 形式のヘッダーを付与。
  - Next.js では **サーバ側のみ** から呼び出し、`API_KEY` は `.env` に置きフロントには決して出さない。
  - 共通ユーティリティ関数として
    - `callOpenAI(path, body)`
    - `callGoogleAps(path, body)`
    - `callGoogleImage(path, body)`
    などを作り、そこでヘッダー／ベース URL／タイムアウト処理を一元管理する。

- **リクエスト送信とレスポンス処理**
  - HTTP メソッド（主に `POST`）＋ `JSON` ボディで呼び出す。
  - レスポンスを JSON パースし、
    - 成功時: 必要なフィールドだけをドメインモデルにマッピング
    - 失敗時: `status code` とエラーメッセージをログに残し、フロントには簡潔なエラーコードだけ返す

- **レートリミット（呼び出し回数制限）の考慮**
  - 多くの API では一定時間あたりの上限があり、超えると `429 Too Many Requests` が返る。
  - 実装レベルでは:
    - セッションごとに呼び出し回数を制御（例: ストーリー生成を1セッション1回まで等）
    - `429` の場合に指数バックオフで数回だけリトライ
    - それでも失敗する場合は「時間をおいて再度試して下さい」系のメッセージを返す。

- **Webhook / 非同期通知の利用余地**
  - 現時点のスコープでは「同期 API 呼び出し」で十分だが、将来:
    - 長時間かかるバッチ分析（大量の Polis 投票データ解析など）
    - 画像生成のバルク処理
    等を行う場合、Webhook やキューを使った **非同期実行 + 完了通知** の設計も検討余地がある。
  - その場合も、  
    - 「外部 API 呼び出し」層  
    - 「結果を DB に反映する」層  
    を分離しておくと拡張しやすい。

---

## 6. Vercel / Next.js 構成

- ディレクトリ構造（例）

```text
app/
  page.tsx                      # トップ：概要と「新しいセッションを作成」
  sessions/[sessionId]/page.tsx # セッション詳細・SF/Policy ストーリー閲覧
  sessions/[sessionId]/vote/page.tsx      # 市民向け投票 UI
  sessions/[sessionId]/results/page.tsx   # 可視化ダッシュボード
  api/
    session/route.ts
    sf/generate/route.ts
    story/refine/route.ts
    issues/extract/route.ts
    issues/translate/route.ts
    aps/segment/route.ts
    propositions/select/route.ts
    participants/join/route.ts
    statements/route.ts
    vote/route.ts
    analysis/run/route.ts
    analysis/result/route.ts
```

- ランタイム
  - APS / 解析などで外部ライブラリ（NumPy 相当など）を使う場合は `runtime: "nodejs"` を指定し、必要なら専用の分析ワーカー API を Node ランタイムに寄せる。
  - 軽量な LLM 呼び出し中心の API は edge runtime も検討可だが、まずは Node ランタイムで統一してシンプルにする。

---

## 7. 実装優先度の提案

1. **最小プロトタイプ**
   - `sessions` / `statements` / `participants` / `votes` のみ実装
   - 命題は手書き or 固定 JSON で用意し、Polis 型投票＋クラスタリングのみ先に動かす
2. **APS なしバージョン**
   - SF プロンプト → Policy Story → Issue 抽出 → 30 命題生成までを OpenAI のみで構成
3. **Gemma-APS 導入**
   - 英文生成フローを追加し、Gemma-APS に差し替え
4. **Society 5.0 / ステークホルダー可視化の強化**
   - タグベースフィルタ、命題タイル UI、グループ別ビューなど

この `masterdocs.md` をベースに、Next.js プロジェクト雛形・DB スキーマ・各 API ハンドラを順次実装していく。


