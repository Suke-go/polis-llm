# フロー2 検証手順

フロー2（タイル表示 → 命題選択 → Polis型投票）の検証方法を説明します。

## 前提条件

フロー1で以下のデータが作成済みである必要があります：
- ✅ セッション（`sessions` テーブル）
- ✅ ストーリー（`stories` テーブル、`status_story_approved = true`、`image_url` が設定されていると良い）
- ✅ 命題（`propositions` テーブル、**`status_aps_approved = true`** が必須）

## ステップ1: 既存セッションの確認

### 方法1: Prisma Studio で確認

```bash
npx prisma studio
```

ブラウザで `http://localhost:5555` が開きます。

1. **Session** テーブルを開く
2. セッションの `id` をコピー（例: `abc123-def456-...`）
3. **Proposition** テーブルで、該当セッションの命題を確認
   - `status_aps_approved` が `true` になっていることを確認

### 方法2: データベースクエリで確認

```sql
-- セッション一覧を取得
SELECT id, title, "createdAt" FROM "Session" ORDER BY "createdAt" DESC;

-- 特定セッションの APS 承認済み命題を確認
SELECT id, ja_text, status_aps_approved 
FROM "Proposition" 
WHERE "sessionId" = 'YOUR_SESSION_ID' 
  AND status_aps_approved = true;
```

### 方法3: フロントエンドから確認

1. ブラウザで `http://localhost:3000` を開く
2. 既存のセッション一覧が表示されていれば、そこからセッションIDを確認
3. または、フロー1のウィザード画面（`/sessions/[sessionId]`）で APS 承認済みか確認

## ステップ2: タイルページで命題を選択

### 2-1. タイルページにアクセス

```
http://localhost:3000/sessions/[SESSION_ID]/tiles
```

例：
```
http://localhost:3000/sessions/abc123-def456-ghi789/tiles
```

### 2-2. 表示内容の確認

✅ **セッションのタイトルと画像**が大きく表示される  
✅ **APS 承認済みの命題**がタイル形式で表示される（短いプレビューのみ）  
✅ 各タイルに**チェックボックス**が表示される

### 2-3. 命題を選択

1. 投票に回したい命題のチェックボックスをクリック
2. 選択されたタイルは青色のハイライトが表示される
3. 複数の命題を選択可能

### 2-4. 投票対象として登録

1. 画面下部の「**選択した X 件を投票対象として登録**」ボタンをクリック
2. 成功メッセージが表示され、自動的に投票画面に遷移

**期待される動作：**
- ✅ `POST /api/statements/from-propositions` が呼ばれる
- ✅ 選択された命題が `statements` テーブルに保存される
- ✅ `selected_for_voting = true` になる
- ✅ `/sessions/[sessionId]/vote` にリダイレクトされる

## ステップ3: 投票ページで投票

### 3-1. 投票ページにアクセス

```
http://localhost:3000/sessions/[SESSION_ID]/vote
```

または、タイルページから自動遷移されます。

### 3-2. 参加者IDの自動生成

初回アクセス時：
- ✅ `localStorage` に `polis-participant-[SESSION_ID]` キーで参加者IDが保存される
- ✅ `POST /api/participants/join` が呼ばれ、`participants` テーブルにレコードが作成される

### 3-3. 投票用命題の表示

✅ **選択された命題が一問ずつ**カード形式で表示される  
✅ 各カードに **Yes / No / Pass** ボタンが表示される  
✅ 命題の全文が表示される（タイルページとは異なり、詳細表示）

### 3-4. 投票を実行

1. 各命題カードの **Yes** / **No** / **Pass** ボタンをクリック
2. クリックしたボタンがハイライトされる（アクティブ状態）
3. `POST /api/vote` が呼ばれ、`votes` テーブルに保存される

**期待される動作：**
- ✅ 投票が即座に反映される（ハイライト表示）
- ✅ 同じ命題に再度投票すると、前回の投票が上書きされる（UPDATE）
- ✅ ページをリロードしても、前回の投票状態が保持される

### 3-5. 複数参加者でのテスト

別ブラウザまたはシークレットウィンドウで同じURLにアクセス：
- ✅ 新しい参加者IDが生成される
- ✅ 同じ命題に対して別の投票が可能
- ✅ 各参加者の投票は独立して保存される

## ステップ4: データベースでの確認

### 4-1. Statements テーブル

```sql
-- 投票対象として登録された命題を確認
SELECT s.id, s.text_ja, s.selected_for_voting, p.ja_text as original_proposition
FROM "Statement" s
JOIN "Proposition" p ON s."propositionId" = p.id
WHERE s."sessionId" = 'YOUR_SESSION_ID'
  AND s.selected_for_voting = true;
```

### 4-2. Participants テーブル

```sql
-- 参加者一覧を確認
SELECT id, "sessionId", "createdAt"
FROM "Participant"
WHERE "sessionId" = 'YOUR_SESSION_ID'
ORDER BY "createdAt" DESC;
```

### 4-3. Votes テーブル

```sql
-- 投票結果を確認
SELECT 
  v."participantId",
  v."statementId",
  v.vote,
  s.text_ja as statement_text,
  CASE 
    WHEN v.vote = 1 THEN 'Yes'
    WHEN v.vote = -1 THEN 'No'
    WHEN v.vote = 0 THEN 'Pass'
  END as vote_label
FROM "Vote" v
JOIN "Statement" s ON v."statementId" = s.id
WHERE s."sessionId" = 'YOUR_SESSION_ID'
ORDER BY v."createdAt" DESC;
```

## トラブルシューティング

### 問題1: タイルページに命題が表示されない

**原因：**
- `status_aps_approved = false` の命題しかない
- セッションIDが間違っている

**解決方法：**
```sql
-- APS 承認済みに更新（テスト用）
UPDATE "Proposition"
SET status_aps_approved = true
WHERE "sessionId" = 'YOUR_SESSION_ID';
```

### 問題2: 投票ページに命題が表示されない

**原因：**
- タイルページで「投票対象として登録」を実行していない
- `statements` テーブルに `selected_for_voting = true` のレコードがない

**解決方法：**
1. タイルページに戻って、命題を選択して登録
2. または、直接データベースで確認：
```sql
SELECT COUNT(*) FROM "Statement" 
WHERE "sessionId" = 'YOUR_SESSION_ID' 
  AND selected_for_voting = true;
```

### 問題3: 投票が保存されない

**確認項目：**
- ブラウザのコンソールでエラーを確認
- ネットワークタブで `POST /api/vote` のレスポンスを確認
- `participants` テーブルに参加者IDが存在するか確認

### 問題4: 画像が表示されない

**原因：**
- `stories.image_url` が `null`
- 画像URLが無効

**解決方法：**
```sql
-- テスト用のプレースホルダー画像を設定
UPDATE "Story"
SET image_url = 'https://via.placeholder.com/800x600?text=Test+Image'
WHERE "sessionId" = 'YOUR_SESSION_ID';
```

## 検証チェックリスト

- [ ] タイルページでセッションのタイトルと画像が表示される
- [ ] APS 承認済みの命題がタイル形式で表示される
- [ ] 命題を複数選択できる
- [ ] 「投票対象として登録」ボタンで登録できる
- [ ] 投票ページに自動遷移する
- [ ] 投票ページで命題が一問ずつ表示される
- [ ] Yes/No/Pass ボタンが動作する
- [ ] 投票が即座に反映される（ハイライト表示）
- [ ] ページをリロードしても投票状態が保持される
- [ ] 複数参加者で独立して投票できる
- [ ] データベースに正しく保存されている

## 次のステップ

フロー2の検証が完了したら：
- フロー3（回答可視化）の実装に進む
- 投票結果の集計・分析機能を追加する

