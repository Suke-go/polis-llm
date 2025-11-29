export interface ApsResult {
  propositions: string[];
}

const START_MARKER = "<s>";
const END_MARKER = "</s>";
const SEP = "\n";

/**
 * Hugging Face model card 推奨のフォーマットに合わせて
 * 英文テキストを Gemma-APS 入力用に整形する。
 *
 * ここでは簡易に「改行ごとに 1 文」とみなし、各行を <s>...</s> で囲む。
 */
function createPropositionsInput(text: string): string {
  const lines = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parts = lines.map((line) => `${START_MARKER} ${line} ${END_MARKER}`);
  return parts.join(SEP);
}

/**
 * Hugging Face の process_propositions_output の TypeScript 版。
 * <s> ... </s> ブロックごとに、改行で命題を分割して二次元配列で返す。
 */
function processPropositionsOutput(text: string): string[][] {
  const pattern = new RegExp(
    `${START_MARKER}([\\s\\S]*?)${END_MARKER}`,
    "g"
  );
  const grouped: string[][] = [];

  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(text)) !== null) {
    const groupRaw = match[1] ?? "";
    const cleaned = groupRaw.trim();
    if (!cleaned) continue;

    const props = cleaned
      .split(SEP)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^[-*•]\s*/, "").trim());

    if (props.length) {
      grouped.push(props);
    }
  }

  return grouped;
}

/**
 * Gemma-APS (google/gemma-7b-aps-it) を
 * Hugging Face Inference API 経由で呼び出す。
 */
export async function callGemmaAps(
  concatenatedEnglishText: string
): Promise<ApsResult> {
  const hfToken =
    process.env.HF_API_TOKEN ?? process.env.HUGGING_FACE_API_KEY ?? "";

  if (!hfToken) {
    // Fallback: トークン未設定時は単純な行分割のみ
    const propositions = concatenatedEnglishText
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return { propositions };
  }

  const endpoint =
    "https://api-inference.huggingface.co/models/google/gemma-7b-aps-it";

  const inputs = createPropositionsInput(concatenatedEnglishText);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${hfToken}`
    },
    body: JSON.stringify({
      inputs,
      parameters: {
        max_new_tokens: 2048,
        return_full_text: false,
        do_sample: false
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemma-APS HF error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as any;
  const generatedText: string | undefined =
    Array.isArray(json) && json[0]?.generated_text
      ? json[0].generated_text
      : undefined;

  if (!generatedText) {
    throw new Error("Gemma-APS HF: empty generated_text");
  }

  const grouped = processPropositionsOutput(generatedText);
  const flat = grouped.flat().map((s) => s.trim()).filter(Boolean);

  return { propositions: flat };
}

