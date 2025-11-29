# 移行ガイド

このガイドでは、Commons Groundのフェーズ間の移行方法について説明します。

## 目次

- [Phase 1 → Phase 2](#phase-1--phase-2)
- [Phase 2 → Phase 3](#phase-2--phase-3)
- [クイックスタート（Flow2）](#クイックスタートflow2)
- [トラブルシューティング](#トラブルシューティング)

## Phase 1 → Phase 2

### 前提条件

Phase 2に移行するには、**Phase 1を完了**させる必要があります：

✅ **必須条件**:
- セッションが作成されている
- ストーリーが生成・承認されている（`status_story_approved = true`）
- 画像が生成されている（`status_image_generated = true`）
- 命題が生成・承認されている（`status_edit_approved = true`）
- **APS が実行・承認されている（`status_aps_approved = true`）** ← **最重要**

### 移行方法

#### 方法1: APS ページから直接移行（推奨）

1. **Phase 1の最後のステップ（APS ページ）にアクセス**
   ```
   http://localhost:3000/sessions/[SESSION_ID]/aps
   ```

2. **APS 承認を完了**
   - 「APS 実行」ボタンをクリックして処理を実行
   - 結果を確認
   - 「APS 承認」ボタンをクリックして `status_aps_approved = true` にする

3. **Phase 2へのリンクをクリック**
   - ページ下部の「次のステップ: 投票と可視化」セクションに3つのリンクがあります：
     - **「Phase 2: 命題タイル選択 →」** - 命題を選択して投票対象に登録
     - **「Phase 2: 投票画面 →」** - 直接投票画面へ（既に選択済みの場合）
     - **「Phase 3: 結果可視化 →」** - 投票結果を確認

#### 方法2: 直接URLでアクセス

Phase 1が完了している場合、直接URLでアクセスできます：

```
# タイル選択ページ
http://localhost:3000/sessions/[SESSION_ID]/tiles

# 投票ページ
http://localhost:3000/sessions/[SESSION_ID]/vote

# 結果可視化ページ
http://localhost:3000/sessions/[SESSION_ID]/results
```

### Phase 2の手順

#### ステップ1: タイル選択（`/tiles`）

1. **APS 承認済みの命題がタイル形式で表示されます**
   - セッションのタイトルと画像が上部に表示
   - 各命題がカード形式で表示

2. **投票に使用したい命題を選択**
   - チェックボックスで複数の命題を選択
   - 最低1つは選択が必要

3. **「選択した X 件を投票対象として登録」ボタンをクリック**
   - OpenAI で投票文に整形（「〜すべきだ。」形式）
   - 自動的に投票画面（`/vote`）に遷移

#### ステップ2: 投票（`/vote`）

1. **投票対象の命題が表示されます**
   - 各命題カードに **Yes** / **No** / **Pass** ボタン

2. **各命題に対して投票**
   - **Yes** (+1): 賛成
   - **No** (-1): 反対
   - **Pass** (0): パス
   - ボタンをクリックすると即座に保存されます

3. **投票状態の確認**
   - 投票済みのボタンはハイライト表示
   - ページをリロードしても投票状態が保持されます

## Phase 2 → Phase 3

### 前提条件

Phase 3に移行するには、**Phase 2で投票が実行されている**必要があります：

✅ **必須条件**:
- 投票対象の命題が選択されている（`statements.selected_for_voting = true`）
- 少なくとも1人の参加者が投票している

### 移行方法

#### 方法1: 投票ページから移行

1. **投票ページ（`/vote`）にアクセス**
2. **「結果可視化へ」リンクをクリック**
   - 自動的に結果可視化ページ（`/results`）に遷移

#### 方法2: 直接URLでアクセス

```
http://localhost:3000/sessions/[SESSION_ID]/results
```

### Phase 3の手順

#### 結果可視化（`/results`）

1. **投票結果が自動的に集計されます**
   - 各命題ごとに賛成率・反対率・Pass率を計算
   - 棒グラフで可視化

2. **結果の確認**
   - 緑色の棒: 賛成率
   - 赤色の棒: 反対率
   - グレーの棒: Pass率
   - 総投票数も表示

## クイックスタート（Flow2）

Phase 1でデータを作成済みの場合の、最短検証手順です。

### 1. セッションIDを取得

#### 方法A: Prisma Studio を使う（推奨）

```bash
npx prisma studio
```

1. ブラウザで `http://localhost:5555` が開く
2. **Session** テーブルをクリック
3. セッションの `id` をコピー

#### 方法B: SQL で確認

```sql
SELECT id, title FROM "Session" ORDER BY "createdAt" DESC LIMIT 5;
```

### 2. APS 承認済みか確認

```sql
-- セッションIDを置き換えて実行
SELECT COUNT(*) as approved_count
FROM "Proposition"
WHERE "sessionId" = 'YOUR_SESSION_ID'
  AND status_aps_approved = true;
```

**0件の場合：** Phase 1で APS 承認を実行するか、テスト用に手動で更新：

```sql
UPDATE "Proposition"
SET status_aps_approved = true
WHERE "sessionId" = 'YOUR_SESSION_ID';
```

### 3. タイルページにアクセス

```
http://localhost:3000/sessions/[SESSION_ID]/tiles
```

**確認ポイント：**
- ✅ セッションのタイトルと画像が表示される
- ✅ 命題がタイル形式で表示される
- ✅ チェックボックスが表示される

### 4. 命題を選択して登録

1. 複数の命題にチェックを入れる
2. 「**選択した X 件を投票対象として登録**」ボタンをクリック
3. 自動的に投票ページに遷移する

### 5. 投票を実行

1. 各命題カードの **Yes** / **No** / **Pass** をクリック
2. ボタンがハイライトされることを確認
3. ページをリロードして、投票状態が保持されることを確認

### 6. 複数参加者でテスト

別ブラウザ（またはシークレットウィンドウ）で同じURLにアクセス：
- 新しい参加者IDが生成される
- 同じ命題に別の投票ができる

### データ確認用SQL

```sql
-- 投票結果を確認
SELECT 
  s.text_ja,
  CASE 
    WHEN v.vote = 1 THEN 'Yes'
    WHEN v.vote = -1 THEN 'No'
    WHEN v.vote = 0 THEN 'Pass'
  END as vote,
  COUNT(*) as vote_count
FROM "Vote" v
JOIN "Statement" s ON v."statementId" = s.id
WHERE s."sessionId" = 'YOUR_SESSION_ID'
GROUP BY s.text_ja, v.vote
ORDER BY s.text_ja, v.vote;
```

## トラブルシューティング

### 問題1: タイルページに命題が表示されない

**原因**: APS が承認されていない

**解決方法**:
1. `/sessions/[SESSION_ID]/aps` に戻る
2. 「APS 実行」を実行
3. 「APS 承認」をクリック

または、データベースで直接更新：
```sql
UPDATE "Proposition"
SET status_aps_approved = true
WHERE "sessionId" = 'YOUR_SESSION_ID';
```

### 問題2: 投票対象登録に失敗する

**原因**: 
- 選択された命題が0件
- API エラー（OpenAI API キーが設定されていないなど）

**解決方法**:
- 少なくとも1つの命題を選択
- ブラウザの開発者ツール（F12）でエラーログを確認
- 環境変数 `OPENAI_API_KEY` が設定されているか確認

### 問題3: 投票が保存されない

**原因**: 
- データベース接続エラー
- `participantId` が正しく生成されていない

**解決方法**:
- ブラウザの開発者ツール（F12）でエラーログを確認
- `localStorage` に `participantId` が保存されているか確認
- データベース接続を確認（`/api/health` にアクセス）

### 問題4: 画像が表示されない

**解決方法**:

```sql
-- プレースホルダー画像を設定
UPDATE "Story"
SET image_url = 'https://via.placeholder.com/800x600?text=Test+Image'
WHERE "sessionId" = 'YOUR_SESSION_ID';
```

### 問題5: 結果が表示されない

**確認事項**:
- 投票が正しく保存されているか（Prisma Studio で確認）
- `/api/analysis/run` が正常に実行されているか

**解決方法**:
- ログでエラーを確認
- データベースの `votes` テーブルを確認

## チェックリスト

### Phase 1 → Phase 2

- [ ] Phase 1のすべてのステップが完了している
- [ ] APS が承認されている（`status_aps_approved = true`）
- [ ] セッションIDを確認している
- [ ] ブラウザで `/sessions/[SESSION_ID]/tiles` にアクセスできる

### Phase 2 → Phase 3

- [ ] 投票対象の命題が選択されている
- [ ] 少なくとも1人の参加者が投票している
- [ ] ブラウザで `/sessions/[SESSION_ID]/results` にアクセスできる

## 次のステップ

Phase 2が完了したら：

- **Phase 3**: `/sessions/[SESSION_ID]/results` で結果を確認
- **新しいセッション**: ホームページ（`/`）から新しいセッションを作成
- **複数参加者でのテスト**: 別ブラウザで同じ投票ページにアクセスして複数の投票を収集

## 関連ドキュメント

- [アーキテクチャ](ARCHITECTURE.md) - フェーズ構造とデータフロー
- [開発ガイド](DEVELOPMENT.md) - 動作確認手順
- [セットアップガイド](GETTING_STARTED.md) - 環境構築

