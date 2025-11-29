# Vertex AI API の有効化手順

## エラー: 403 PERMISSION_DENIED

### エラー1: API が有効化されていない

以下のエラーが発生した場合、Vertex AI API が有効化されていません：

```
Vertex AI API has not been used in project gen-lang-client-0324265442 before or it is disabled.
```

## 解決方法

### 1. Google Cloud Console で Vertex AI API を有効化

以下の URL にアクセスして、Generative Language API を有効化してください：

**https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=env-design**

または、以下の手順で有効化できます：

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト `env-design` を選択
3. 「API とサービス」→「ライブラリ」に移動
4. 「Generative Language API」を検索
5. 「有効にする」をクリック

### 2. Imagen API の有効化（必要な場合）

Imagen API が別途必要な場合は、以下も有効化してください：

1. 「API とサービス」→「ライブラリ」に移動
2. 「Imagen API」または「Generative AI API」を検索
3. 「有効にする」をクリック

### 3. サービスアカウントの権限確認

サービスアカウント `env-design@env-design.iam.gserviceaccount.com` に以下のロールが付与されているか確認してください：

- **Vertex AI User** (`roles/aiplatform.user`) - Vertex AI を使用する場合
- **Service Account User** (`roles/iam.serviceAccountUser`)

権限の確認方法：

1. [IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=env-design) にアクセス
2. サービスアカウントを検索
3. ロールを確認し、必要に応じて追加

### 4. 有効化後の待機時間

API を有効化した後、数分待ってから再度試してください。API の有効化がシステム全体に反映されるまで時間がかかる場合があります。

## トラブルシューティング

### エラー2: 認証スコープが不足している

以下のエラーが発生した場合、OAuth2 トークンのスコープが不足しています：

```
Request had insufficient authentication scopes.
ACCESS_TOKEN_SCOPE_INSUFFICIENT
```

**解決方法**: コードは自動的に必要なスコープ（`cloud-platform` と `generative-language`）を要求します。サービスアカウントキーが正しく読み込まれているか確認してください。

### 403 エラーが続く場合

1. **API が有効化されているか確認**
   - [API とサービス](https://console.cloud.google.com/apis/dashboard?project=env-design) で Generative Language API の状態を確認

2. **請求アカウントが設定されているか確認**
   - Generative Language API を使用するには、請求アカウントが必要です
   - [請求](https://console.cloud.google.com/billing?project=env-design) で請求アカウントを確認

3. **サービスアカウントの権限を再確認**
   - サービスアカウントに適切なロールが付与されているか確認

4. **OAuth2 スコープの確認**
   - コードは `cloud-platform` と `generative-language` スコープを使用します
   - サービスアカウントキーが正しく読み込まれているか確認

### その他のエラー

- **401 UNAUTHENTICATED**: 認証情報が正しくない、またはサービスアカウントキーが無効
- **404 NOT FOUND**: モデル名またはエンドポイント URL が間違っている
- **429 TOO_MANY_REQUESTS**: クォータ超過。しばらく待ってから再試行

## 参考リンク

- [Generative Language API の有効化](https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=env-design)
- [Vertex AI のドキュメント](https://cloud.google.com/vertex-ai/docs)
- [Imagen のドキュメント](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)

