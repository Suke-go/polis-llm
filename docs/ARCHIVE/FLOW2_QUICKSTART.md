# フロー2 クイックスタート

フロー1でデータを作成済みの場合の、最短検証手順です。

## 1. セッションIDを取得

### 方法A: Prisma Studio を使う（推奨）

```bash
npx prisma studio
```

1. ブラウザで `http://localhost:5555` が開く
2. **Session** テーブルをクリック
3. セッションの `id` をコピー

### 方法B: SQL で確認

```sql
SELECT id, title FROM "Session" ORDER BY "createdAt" DESC LIMIT 5;
```

## 2. APS 承認済みか確認

```sql
-- セッションIDを置き換えて実行
SELECT COUNT(*) as approved_count
FROM "Proposition"
WHERE "sessionId" = 'YOUR_SESSION_ID'
  AND status_aps_approved = true;
```

**0件の場合：** フロー1で APS 承認を実行するか、テスト用に手動で更新：

```sql
UPDATE "Proposition"
SET status_aps_approved = true
WHERE "sessionId" = 'YOUR_SESSION_ID';
```

## 3. タイルページにアクセス

```
http://localhost:3000/sessions/[SESSION_ID]/tiles
```

**確認ポイント：**
- ✅ セッションのタイトルと画像が表示される
- ✅ 命題がタイル形式で表示される
- ✅ チェックボックスが表示される

## 4. 命題を選択して登録

1. 複数の命題にチェックを入れる
2. 「**選択した X 件を投票対象として登録**」ボタンをクリック
3. 自動的に投票ページに遷移する

## 5. 投票を実行

1. 各命題カードの **Yes** / **No** / **Pass** をクリック
2. ボタンがハイライトされることを確認
3. ページをリロードして、投票状態が保持されることを確認

## 6. 複数参加者でテスト

別ブラウザ（またはシークレットウィンドウ）で同じURLにアクセス：
- 新しい参加者IDが生成される
- 同じ命題に別の投票ができる

## よくある問題

### 命題が表示されない

```sql
-- APS 承認済みに更新
UPDATE "Proposition"
SET status_aps_approved = true
WHERE "sessionId" = 'YOUR_SESSION_ID';
```

### 画像が表示されない

```sql
-- プレースホルダー画像を設定
UPDATE "Story"
SET image_url = 'https://via.placeholder.com/800x600?text=Test+Image'
WHERE "sessionId" = 'YOUR_SESSION_ID';
```

### 投票が保存されない

ブラウザの開発者ツール（F12）で：
1. **Console** タブでエラーを確認
2. **Network** タブで `POST /api/vote` のレスポンスを確認

## データ確認用SQL

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

