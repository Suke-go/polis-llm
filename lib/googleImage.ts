export interface ImageResult {
  imageUrl: string;
}

export async function generateStoryImage(promptJaOrEn: string): Promise<ImageResult> {
  const endpoint = process.env.GOOGLE_IMAGE_ENDPOINT;
  const apiKey = process.env.GOOGLE_IMAGE_API_KEY;

  if (!endpoint || !apiKey) {
    // Fallback: placeholder image for local dev
    return {
      imageUrl:
        "https://via.placeholder.com/800x450.png?text=Story+Image+Placeholder"
    };
  }

  const res = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: promptJaOrEn,
      size: "800x450"
    })
  });

  if (!res.ok) {
    throw new Error(`Image API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as any;
  const imageUrl =
    json.imageUrl ??
    json.data?.[0]?.url ??
    "https://via.placeholder.com/800x450.png?text=Story+Image";
  return { imageUrl };
}


