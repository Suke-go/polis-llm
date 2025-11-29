import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE
    });
  }
  return openaiClient;
}

export async function simpleChatCompletion(options: {
  system: string;
  user: string;
}) {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user }
    ]
  });
  const content = res.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Empty OpenAI response");
  }
  return content;
}


