import { GoogleAuth } from "google-auth-library";
import { readFileSync } from "fs";
import { join } from "path";

let authClient: GoogleAuth | null = null;

/**
 * サービスアカウントキーの認証情報を取得する
 * 1. 環境変数 GOOGLE_SERVICE_ACCOUNT_JSON から読み込む（優先）
 * 2. 環境変数 GOOGLE_SERVICE_ACCOUNT_PATH で指定されたファイルから読み込む
 * 3. デフォルトのファイル名から読み込む（ローカル開発用）
 */
function getServiceAccountCredentials(): any {
  // 方法1: 環境変数から JSON 文字列として読み込む
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson);
    } catch {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON must be a valid JSON string"
      );
    }
  }

  // 方法2: ファイルパスから読み込む
  const serviceAccountPath =
    process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
    join(process.cwd(), "env-design-54418957a0cd.json");

  try {
    const fileContent = readFileSync(serviceAccountPath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error(
      `Failed to read service account key from ${serviceAccountPath}. ` +
      `Please set GOOGLE_SERVICE_ACCOUNT_JSON environment variable or ensure the file exists. ` +
      `Error: ${error}`
    );
  }
}

/**
 * Vertex AI 用の OAuth2 アクセストークンを取得する
 * サービスアカウントキー（JSON）から認証情報を読み込む
 */
export async function getVertexAccessToken(): Promise<string> {
  const location = process.env.GOOGLE_LOCATION || "us-central1";

  if (!authClient) {
    const credentials = getServiceAccountCredentials();

    authClient = new GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/generative-language"
      ]
    });
  }

  const client = await authClient.getClient();
  const accessToken = await client.getAccessToken();

  if (!accessToken.token) {
    throw new Error("Failed to get access token");
  }

  return accessToken.token;
}

/**
 * Vertex AI の認証情報が利用可能かどうかを確認する
 */
export function hasVertexAuth(): boolean {
  // 環境変数に JSON 文字列がある場合
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return true;
  }
  // JSON ファイルが存在するか確認
  try {
    const serviceAccountPath =
      process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
      join(process.cwd(), "env-design-54418957a0cd.json");
    readFileSync(serviceAccountPath, "utf-8");
    return true;
  } catch {
    return false;
  }
}

/**
 * プロジェクト ID を取得する
 * 1. 環境変数 GOOGLE_PROJECT_ID から取得（優先）
 * 2. サービスアカウントキーの JSON から取得
 */
export function getProjectId(): string {
  if (process.env.GOOGLE_PROJECT_ID) {
    return process.env.GOOGLE_PROJECT_ID;
  }

  try {
    const credentials = getServiceAccountCredentials();
    if (credentials.project_id) {
      return credentials.project_id;
    }
  } catch {
    // エラーは無視（後でエラーメッセージを表示）
  }

  throw new Error(
    "GOOGLE_PROJECT_ID is not set and could not be determined from service account key"
  );
}

/**
 * Vertex AI のエンドポイント URL を構築する
 */
export function getVertexEndpoint(
  model: string,
  method: string = "generateContent"
): string {
  const projectId = getProjectId();
  const location = process.env.GOOGLE_LOCATION || "us-central1";

  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:${method}`;
}

