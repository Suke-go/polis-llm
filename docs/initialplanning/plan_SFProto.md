うん、この流れめちゃくちゃいいです。
こちら側では、あなたが書いてくれたプロセスをそのまま「システム設計」に落とし込みます。

---

## 0. コンセプト整理（SFプロトタイピング × Society5.0 × APS × Polis）

* **SFプロトタイピング**
  SF的なストーリーを使って、技術・社会制度の「ありうる未来」を描き、そこから逆算して今やるべきことを考える方法。都市計画やロジスティクスでも、市民や事業者と一緒に将来シナリオを議論する手法として提案されています。([ResearchGate][1])

* **Society 5.0**
  日本政府が掲げる「経済発展と社会課題解決を両立させる、人間中心の“超スマート社会”」のビジョン。サイバー空間とフィジカル空間を高度に統合し、持続可能性・レジリエンス・安全・多様なウェルビーイングを重視することが特徴。([内閣府ホームページ][2])

* **APS（Abstractive Proposition Segmentation）**
  複雑なテキストを

  > 「文法的に正しくて、自立して意味が分かり、1つの事実・主張だけを含む短い文」
  > に分解するタスク。Gemma-APS などのモデルが公開されていて、教師LLM（Gemini）からの distillation によって小さいモデルでも高精度に命題分割できます。([ACL Anthology][3])

* **Polis 型の合意形成 UI**
  参加者がステートメントに「賛成・反対・パス」で投票すると、機械学習で参加者を意見空間上にマッピング・クラスタリングし、「グループをまたいだ合意（group-informed consensus）」を可視化するオープンソースのツール。([Participedia][4])

この4つをつなぐと、

> SFプロトタイピングで描かれた未来ストーリー
> → LLMで非詩的な政策ストーリーへ整形
> → 争点・対立軸を抽出
> → 英訳 → APSで「命題30個」に分解
> → Polis型UIで市民が投票し、合意と対立を可視化

という“SFからポリシーまで一気通貫”のラインが作れます。

---

## 1. 全体アーキテクチャ

### モジュール一覧

1. **Futures Generator（SFプロトタイピング生成）**

   * 入力：ユーザーのキーワード・制約（都市、テーマ、Society5.0の観点など）
   * 出力：AI画像＋日本語の未来シナリオ（まだ命題ではない文章）

2. **Policy Story Refiner（詩的表現抑制 & 課題スケール制御）**

   * 入力：上記シナリオ
   * 出力：

     * 詩的比喩を減らした「政策ストーリーライン」
     * 潜在的な論点リスト（何が問題になりそうかの列挙）

3. **Issue & Conflict Extractor（論点・対立抽出 LLM）**

   * 入力：政策ストーリーライン＋論点メモ
   * 出力：

     * 「対立が起きそうな内容」を短文で列挙（まだAPS前の“粗い命題候補”）

4. **EN Translation & Consistency Checker（英訳＋整合性チェック）**

   * 入力：日本語命題候補
   * 出力：

     * 英文命題
     * 日英対応マップ＋品質スコア

5. **APS Engine（Gemma-APS）**

   * 入力：英語のテキスト（まとめて or ブロックごと）
   * 出力：APS で分解された細かい命題（英語）

6. **Proposition Selector（30命題に絞り込むフィルタ）**

   * 入力：APS命題（数十〜百個）
   * 出力：Yes/No投票に適した命題30個（日本語・英語両方）

7. **Polis-like Deliberation UI**

   * 入力：命題リスト＋参加者の投票
   * 出力：

     * 参加者クラスタ
     * 命題ごとの賛否率
     * グループ横断のコンセンサス命題

---

## 2. ステップ別の設計案

### 2-1. SFプロトタイピング & Society 5.0 フレーム

**目的**：
「何となくカッコいい未来」ではなく、Society5.0 の **人間中心・課題解決＆経済発展の両立・レジリエンス** とちゃんと紐づいたストーリーにする。([内閣府ホームページ][2])

**設計ポイント**

* 入力フォーム例

  * 対象となる都市・地区
  * テーマ（モビリティ／防災／ケア／教育…）
  * 主要なステークホルダー（高齢者・子育て世代・観光客 etc.）
  * Society5.0 的な観点の優先度（ウェルビーイング／持続可能性／包摂性…）

* プロンプト方針（日本語 LLM）

  * 「SFっぽい未来だが、**現実の延長線上で起こりうるレベル**にとどめる」
  * 「比喩・詩的表現（○○のような世界・星の囁き…）は極力避け、**状況描写＋制度・インフラ**を中心に」
  * 「問題の大きさを誇張しない。**市レベル／区レベル** のスケールに限定する」

SFプロトタイピングは、未来の社会課題と技術の組み合わせを議論する手法として、都市計画やロジスティクスでも民主的な政策議論に使えるとされています。([White Rose Research Online][5])

---

### 2-2. Policy Story Refiner：詩的表現カット＆「課題の盛りすぎ」防止

**目的**：
SFのアウトプットをそのまま使うと、比喩だらけ・世界崩壊・陰謀論っぽくなりがちなので、

* 政策議論に耐えるレベルの **中立的・説明的** な文章にしつつ、
* **課題のスケールや深刻さを“盛りすぎない”** ように制御する。

**処理内容**

1. **スタイル変換**

   * ルールベース＋LLMで

     * メタファー → 具体的な状態説明
     * 感情語の削減（「最悪だ」「地獄のよう」など）
   * 例：

     * before: 「都市は金属の森となり、人々はデータの影に怯えている。」
     * after : 「都市には高層ビルが増加し、監視カメラやデータ収集システムの増加に不安を感じる市民がいる。」

2. **Society5.0 フレームとのマッピング**

   * 各段落を

     * 経済発展
     * 社会課題解決（高齢化、過疎、気候、災害…）
     * 人間中心性・ウェルビーイング
       にタグ付け（LLMでラベリング）。([内閣府ホームページ][2])
   * バランスが極端（問題ばかり or 成功談ばかり）の場合、
     → LLMに「反対側の視点も1段落追加させる」など。

3. **課題スケールチェック**

   * LLMに「この課題のスケール（町内／市／都道府県／国家／世界）を判定させる」
   * 事前に設定した許容スケールを超えている場合、

     * 「市レベルで起こりうるレベルに具体化して書き直す」と指示する。

---

### 2-3. Issue & Conflict Extractor：論点・対立候補の抽出

**目的**：
SF＋Society5.0 ベースのストーリーから
「どこで誰と誰の利害がぶつかりそうか」を明示化する。

**設計**

* LLMへの指示例

  * 「以下のストーリーから、**政策論争になりそうな点**を箇条書きにしてください。」
  * 各項目について：

    * 関係するステークホルダー
    * 想定される賛成理由／反対理由
    * 関係する Society5.0 の観点（安全性・公平性・効率 etc.）

* 出力フォーマット（日本語）

  ```text
  [Issue ID] I-01
  [短い説明] 都心部への自動運転車の優先レーン導入
  [ステークホルダー] 通勤者, 商店街, 高齢者
  [賛成の主な理由] 通勤時間短縮, 交通事故の減少
  [反対の主な理由] 駐車スペース減少, 歩行者空間の圧迫
  ```

ここまではまだ **APS前の「粗い論点」** です。

---

### 2-4. EN Translation & Consistency Checker：英訳の誤りを抑える

Gemma-APS は英語向けにチューニングされています。([Google AI for Developers][6])
なので日本語→英語のステップの品質がかなり重要です。

**1. 英訳方針**

* ここで扱うのは「Issue & Conflict Extractor で出てきた短文」。
* 翻訳モデルには：

  * 高品質な LLM 翻訳（例：汎用 LLM）
  * 又は専用 MT（NLLB 系など）
* 翻訳時のプロンプト制約：

  * 「意訳ではなく、**元の主張を一切落とさず、追加もしない** こと」
  * 「長い1文にまとめず、原文の1文を1英文に対応させること」

**2. バックチェック**

* バックトランスレーション（英→日）を行い、
* もう一つの LLM に、

  * 「原文の日本語と、英訳→再翻訳の日本語を比較して、意味の差分を列挙して」と要求。
* 差分が大きいものだけ人間がレビュー、または再翻訳をトリガー。

**3. 日英対応マップ**

* 各命題候補に ID を付与し、

  * `JP_text`, `EN_text`, `diff_score`, `manual_review_flag`
    を持つ JSON にして後工程に渡す。

---

### 2-5. APS Engine：Gemma-APS による命題化

**メインエンジン**：Gemma-APS（2B or 7B）([Google AI for Developers][6])

* 役割：
  英文テキストを

  > 「simple, self-contained, well-formed sentences（簡潔で、自立した、文法的に正しい文）」([Medium][7])
  > に分解し直す。

**実行方法**

* ある程度まとまりのある「論点群」をひと塊にして APS に投入

  * 例：

    * 「自動運転レーン」の論点をまとめた英文をひとつの input に
* 出力フォーマット：

  ```text
  1. Self-driving car lanes in the city center could reduce commuting time.
  2. Self-driving car lanes in the city center could reduce traffic accidents.
  3. Dedicated lanes for self-driving cars might reduce parking spaces for local shops.
  4. Some pedestrians are concerned that self-driving car lanes will narrow sidewalks.
  ...
  ```

APS 論文では、

* `well-formed / atomic / self-contained / supported / comprehensive` といった複数の観点から命題品質を自動評価する指標も提案されており、内部的な QA として流用可能です。([ACL Anthology][3])

---

### 2-6. Proposition Selector：Yes/No投票用に30命題へ絞る

Polis のようなシステムでは、参加者の負担を抑えるため、1回のセッションで扱うステートメント数はある程度に抑える必要があります。([DEMDIS][8])

**選定基準の例**

1. **多様な論点カバレッジ**

   * Society5.0 観点（安全・効率・公平・ウェルビーイング…）ごとに最低 N 件は含める。
2. **ステークホルダー多様性**

   * 住民・事業者・行政など、関わる主体が偏らないように。
3. **賛否が割れそうな論点**

   * LLMに「賛否が割れそうな度合い（controversy score）」を推定させる。
   * スコアが中〜高のものを優先（あまりにも自明に賛成されそうな文は数を絞る）。
4. **表現のシンプルさ**

   * 認知負荷を下げるため、文長や構文の複雑さに制限をかける。

**Yes/No向け再整形**

* 各命題を「Yes/Noで答えられる形」に書き直す（英→日両方）。

  * before:

    * “Self-driving car lanes in the city center could reduce commuting time.”
  * after (投票文):

    * 「都心部に自動運転車専用レーンを整備すべきだ。」
* LLM に以下を守らせる：

  * 主語を政策主体（市・自治体など）に
  * 「べきだ」「すべきではない」など、態度を一方に寄せる形にして Yes/No を明確化。

---

## 3. Polisっぽい UI / 分析ロジック

Polis 自体は、オープンエンドのステートメント＋「Agree / Disagree / Pass」の投票を集め、

* 参加者を「意見パターン」でクラスタリングし、
* クラスタを超えて支持される「コンセンサス文」を抽出する仕組みです。([Participedia][4])

### 3-1. UIの基本要素

* 参加者に順番に命題を提示

  * Yes / No / Pass の3ボタン
* リアルタイム集計ビュー（主に主催者向け）

  * 命題ごとの賛成率・反対率
  * 参加者クラスタの数と規模

### 3-2. バックエンドのデータ構造

* `participants` テーブル

  * `participant_id`, 属性（任意・匿名でもOK）
* `statements` テーブル

  * `statement_id`, 日本語文, 英文, タグ（Society5.0観点, ステークホルダー etc.）
* `votes` テーブル

  * `participant_id`, `statement_id`, `vote`（+1=Yes, -1=No, 0=Pass）

参加者 × 命題の行列を作り、これを「意見空間」として扱います。([DEMDIS][8])

### 3-3. クラスタリング & コンセンサス抽出

Polis の論文に近い形で、以下のような処理が考えられます：([DEMDIS][8])

1. **次元削減**

   * 参加者ごとの投票ベクトル（命題次元）を PCA などで 2〜3次元に削減。
2. **クラスタリング**

   * k-means などで参加者を数クラスタに分ける。
3. **コンセンサス文**

   * 各命題について、

     * 全体賛成率
     * 各クラスタごとの賛成率
       を計算し、
       「どのクラスタでも賛成率が高い＝橋渡し命題（bridging statement）」を抽出。([Participedia][4])

### 3-4. フィードバックの出し方

* 市民向けダッシュボード

  * 「あなたはこのグループに近いです」
  * 「異なるグループと共通して支持している命題」
* 政策担当者向け

  * グループ別に強く賛成されている命題
  * グループ間で分断が大きい命題
  * Society5.0のどの観点について合意形成が進んでいるか／遅れているか

---

## 4. リスクと評価のポイント

### 4-1. 「課題を盛りすぎる」問題への対策

* **プロンプトレベルの制御**

  * SF/Policy Story 生成時に、

    * スケール制約
    * 感情語・破滅表現の禁止
      を明示。
* **ポストホック評価**

  * LLM に「このストーリーは、問題の深刻さを誇張していないか」をレビューさせる。
  * “catastrophizing” スコアのような内部指標を導入して、閾値を超えたら修正を要求。

### 4-2. 翻訳・APSの誤り

* 高品質翻訳＋バックトランスレーションチェック
* APS 出力については、Hosseini らの指標（atomic / self-contained / supported / comprehensive）に近いチェックを LLM で行い、低スコアな命題は落とす。([ACL Anthology][3])

### 4-3. 市民の負担 & バイアス

* 命題は30件程度に絞る（あなたの想定どおり）。
* 文の長さ・専門用語を制限し、必要ならツールチップで説明を付ける。
* 参加者属性の偏り（ITリテラシーの高い層だけ etc.）は別途モニタリングが必要。
* 他のAIベース参加ツールでも、テキスト解析によるテーマ抽出・毒性検出・トレンド分析などが使われていますが、同様に**透明性と説明可能性**が重要と指摘されています。([Democracy Technologies][9])

### 4-4. 命題の可視化
* タイルUIで，画像と命題を一括表示
* 命題の要素に合わせて分類ができる感じ？しゅう

[1]: https://www.researchgate.net/publication/331621218_Science_Fiction_Prototypes_as_a_Method_for_Discussing_Socio-Technical_Issues_within_Emerging_Technology_Research_and_Foresight?utm_source=chatgpt.com "Science Fiction Prototypes as a Method for Discussing ..."
[2]: https://www8.cao.go.jp/cstp/english/society5_0/index.html?utm_source=chatgpt.com "Society 5.0"
[3]: https://aclanthology.org/2024.findings-emnlp.517/?utm_source=chatgpt.com "Scalable and Domain-General Abstractive Proposition ..."
[4]: https://participedia.net/method/polis?utm_source=chatgpt.com "Polis"
[5]: https://eprints.whiterose.ac.uk/id/eprint/84580/?utm_source=chatgpt.com "Exploring Future Cityscapes through Urban Logistics ..."
[6]: https://ai.google.dev/gemma/docs/gemma-aps?utm_source=chatgpt.com "Gemma for abstractive proposition segmentation (APS)"
[7]: https://ritvik19.medium.com/papers-explained-244-gemma-aps-8fac1838b9ef?utm_source=chatgpt.com "Papers Explained 244: Gemma APS - Ritvik Rastogi"
[8]: https://www.demdis.sk/content/files/2022/11/Polis-manusript.pdf?utm_source=chatgpt.com "Polis: Scaling Deliberation by Mapping High Dimensional ..."
[9]: https://democracy-technologies.org/ai-data/6-participation-tools-using-ai-data/?utm_source=chatgpt.com "6 Participation Tools That Use AI"
