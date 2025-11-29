#!/usr/bin/env node

/**
 * JSONファイルを環境変数用の1行文字列に変換するヘルパースクリプト
 * 
 * 使用方法:
 *   node scripts/json-to-env.js <json-file-path>
 * 
 * 例:
 *   node scripts/json-to-env.js env-design-54418957a0cd.json
 */

const fs = require('fs');
const path = require('path');

// コマンドライン引数からファイルパスを取得
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('エラー: JSONファイルのパスを指定してください');
  console.error('使用方法: node scripts/json-to-env.js <json-file-path>');
  process.exit(1);
}

// ファイルの存在確認
const fullPath = path.resolve(jsonFilePath);
if (!fs.existsSync(fullPath)) {
  console.error(`エラー: ファイルが見つかりません: ${fullPath}`);
  process.exit(1);
}

try {
  // JSONファイルを読み込む
  const jsonContent = fs.readFileSync(fullPath, 'utf-8');
  
  // JSONをパースして検証
  const jsonObject = JSON.parse(jsonContent);
  
  // 1行の文字列に変換（改行は既にエスケープされている）
  const oneLineJson = JSON.stringify(jsonObject);
  
  console.log('\n=== 環境変数用のJSON文字列 ===\n');
  console.log(oneLineJson);
  console.log('\n=== 使用方法 ===\n');
  console.log('1. 上記の文字列をコピー');
  console.log('2. Vercelダッシュボードの「Settings」→「Environment Variables」に移動');
  console.log('3. 新しい環境変数を追加:');
  console.log('   - Key: GOOGLE_SERVICE_ACCOUNT_JSON');
  console.log('   - Value: (上記の文字列を貼り付け)');
  console.log('   - Environment: Production, Preview, Development (必要に応じて選択)');
  console.log('4. 「Save」をクリック\n');
  
  // クリップボードにコピーするための指示（Windows PowerShell用）
  if (process.platform === 'win32') {
    console.log('=== PowerShellでクリップボードにコピーする場合 ===\n');
    console.log(`echo '${oneLineJson}' | Set-Clipboard\n`);
  } else {
    console.log('=== クリップボードにコピーする場合 (macOS/Linux) ===\n');
    console.log(`echo '${oneLineJson}' | pbcopy  # macOS`);
    console.log(`echo '${oneLineJson}' | xclip -selection clipboard  # Linux\n`);
  }
  
} catch (error) {
  console.error('エラー: JSONファイルの読み込みまたはパースに失敗しました');
  console.error(error.message);
  process.exit(1);
}

