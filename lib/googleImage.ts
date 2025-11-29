export interface ImageResult {
  imageUrl: string;
}

/**
 * 画像生成プロバイダーのタイプ
 */
type ImageProvider = "gemini" | "imagen";

/**
 * 使用する画像生成プロバイダーを取得
 * 環境変数 IMAGE_GENERATION_PROVIDER で指定可能（デフォルト: gemini）
 */
function getImageProvider(): ImageProvider {
  const provider = process.env.IMAGE_GENERATION_PROVIDER?.toLowerCase();
  if (provider === "imagen" || provider === "gemini") {
    return provider;
  }
  return "gemini"; // デフォルトは Gemini
}

export async function generateStoryImage(promptJaOrEn: string): Promise<ImageResult> {
  const provider = getImageProvider();
  
  if (provider === "gemini") {
    return generateWithGemini(promptJaOrEn);
  } else {
    return generateWithImagen(promptJaOrEn);
  }
}

/**
 * Gemini 2.5 Flash Image API を使用して画像を生成
 * OAuth2 認証が必要なため、Vertex AI 認証を使用
 */
async function generateWithGemini(promptJaOrEn: string): Promise<ImageResult> {
  // まず API キーで試す（一部のエンドポイントでは動作する可能性がある）
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const { getVertexAccessToken, hasVertexAuth } = await import("./vertexAuth");
  const hasVertexAuthCredentials = hasVertexAuth();

  if (!apiKey && !hasVertexAuthCredentials) {
    return {
      imageUrl:
        "https://via.placeholder.com/800x450.png?text=Story+Image+Placeholder+%28Auth+Missing%29"
    };
  }

  try {
    // まず API キーで試す（動作しない可能性が高いが試行）
    if (apiKey) {
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";
      console.log("Trying Gemini Image API (gemini-2.5-flash-image) with API key");

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: promptJaOrEn
              }
            ]
          }
        ]
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (res.ok) {
        const responseText = await res.text();
        let json: any;
        try {
          json = JSON.parse(responseText);
        } catch (parseError) {
          // JSON パースエラーは無視して Vertex AI を試す
        }

        if (json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
          const imageBytes = json.candidates[0].content.parts[0].inlineData.data;
          const imageUrl = `data:image/png;base64,${imageBytes}`;
          console.log("Image generated successfully with Gemini 2.5 Flash Image (API key)");
          return { imageUrl };
        }
      } else if (res.status !== 401) {
        // 401 以外のエラーはログに記録して Vertex AI を試す
        const responseText = await res.text();
        console.log(`Gemini Image API (API key) response status:`, res.status);
      }
      // 401 の場合は Vertex AI 認証を試す
    }

    // Vertex AI 認証を使用（Generative Language API エンドポイント）
    if (hasVertexAuthCredentials) {
      const accessToken = await getVertexAccessToken();
      
      // Generative Language API のエンドポイント（OAuth2 認証を使用）
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";
      console.log("Trying Gemini Image API (gemini-2.5-flash-image) with OAuth2");

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: promptJaOrEn
              }
            ]
          }
        ]
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await res.text();
      console.log(`Gemini Image API (Vertex AI) response status:`, res.status);

      if (res.ok) {
        let json: any;
        try {
          json = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          return {
            imageUrl:
              "https://via.placeholder.com/800x450.png?text=Invalid+JSON+Response"
          };
        }

        // Gemini Image API のレスポンス形式: candidates[0].content.parts 配列内の inlineData を探す
        const candidate = json.candidates?.[0];
        if (candidate?.content?.parts) {
          // parts 配列をループして inlineData を持つ要素を探す
          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              const imageBytes = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";
              const imageUrl = `data:${mimeType};base64,${imageBytes}`;
              console.log("Image generated successfully with Gemini 2.5 Flash Image (Vertex AI)");
              return { imageUrl };
            }
          }
        }

        // 代替形式: parts[0].inlineData.data（最初の要素が画像の場合）
        if (json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
          const part = json.candidates[0].content.parts[0];
          const imageBytes = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          const imageUrl = `data:${mimeType};base64,${imageBytes}`;
          console.log("Image generated successfully with Gemini 2.5 Flash Image (Vertex AI, first part)");
          return { imageUrl };
        }

        // 代替形式: data フィールドが直接ある場合
        if (json.data) {
          const imageBytes = json.data;
          const imageUrl = `data:image/png;base64,${imageBytes}`;
          console.log("Image generated successfully with Gemini 2.5 Flash Image (Vertex AI, direct data)");
          return { imageUrl };
        }

        console.warn("Unexpected response format:", JSON.stringify(json).substring(0, 500));
        return {
          imageUrl:
            "https://via.placeholder.com/800x450.png?text=Unexpected+Response+Format"
        };
      } else {
        console.error(`Gemini Image API (Vertex AI) error:`, res.status, responseText.substring(0, 500));
        return {
          imageUrl:
            "https://via.placeholder.com/800x450.png?text=Image+Generation+Failed"
        };
      }
    }
  } catch (error) {
    console.error("Gemini Image generation error:", error);
    return {
      imageUrl:
        "https://via.placeholder.com/800x450.png?text=Image+Generation+Error"
    };
  }

  // API キーも Vertex AI 認証も失敗した場合
  return {
    imageUrl:
      "https://via.placeholder.com/800x450.png?text=Image+Generation+Failed"
  };
}

/**
 * Imagen API を使用して画像を生成（Vertex AI または API キー経由）
 */
async function generateWithImagen(promptJaOrEn: string): Promise<ImageResult> {
  const { getVertexAccessToken, getVertexEndpoint, hasVertexAuth } = await import("./vertexAuth");
  
  // まず API キーで試す（Google AI Studio 経由）
  const apiKey = process.env.GOOGLE_API_KEY;
  
  // Vertex AI の認証情報があるか確認
  const hasVertexAuthCredentials = hasVertexAuth();

  // API キーも Vertex AI 認証もない場合はプレースホルダー
  if (!apiKey && !hasVertexAuthCredentials) {
    return {
      imageUrl:
        "https://via.placeholder.com/800x450.png?text=Story+Image+Placeholder"
    };
  }

  try {
    const models = [
      "imagen-4.0-generate-001",
      "imagen-3.0-generate-002"
    ];
    
    // まず API キーで試す（Google AI Studio 経由）
    if (apiKey) {
      for (const model of models) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;
        console.log(`Trying Imagen API (API key) with model: ${model}`);
        
        const requestBody = {
          instances: [
            {
              prompt: promptJaOrEn
            }
          ],
          parameters: {
            sampleCount: 1
          }
        };
        
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            body: JSON.stringify(requestBody)
          });

          const responseText = await res.text();
          console.log(`Imagen API (API key, ${model}) response status:`, res.status);

          if (res.ok) {
            const json = JSON.parse(responseText);
            // レスポンス処理（後続のコードと同じ）
            if (json.generatedImages?.[0]?.image?.imageBytes) {
              const imageBytes = json.generatedImages[0].image.imageBytes;
              const imageUrl = `data:image/png;base64,${imageBytes}`;
              console.log(`Image generated successfully with ${model} (API key)`);
              return { imageUrl };
            }
            if (json.generatedImages?.[0]?.image?.image_bytes) {
              const imageBytes = json.generatedImages[0].image.image_bytes;
              const imageUrl = `data:image/png;base64,${imageBytes}`;
              console.log(`Image generated successfully with ${model} (API key, snake_case)`);
              return { imageUrl };
            }
          } else if (res.status !== 401) {
            // 401 以外のエラーは次のモデルを試す
            if (res.status === 404 && models.indexOf(model) < models.length - 1) {
              continue;
            }
          }
          // 401 の場合は Vertex AI を試す
        } catch (error) {
          console.error(`Error with API key for ${model}:`, error);
          // 次のモデルまたは Vertex AI を試す
        }
      }
    }

    // Vertex AI 認証で試す
    if (hasVertexAuthCredentials) {
      const accessToken = await getVertexAccessToken();
      
      // Vertex AI の Imagen モデル名（実際の Vertex AI のモデル名を使用）
      const vertexModels = [
        "imagegeneration-002",  // Imagen 3
        "imagegeneration-003"   // Imagen 4（利用可能な場合）
      ];
      
      for (const model of vertexModels) {
        // Vertex AI の Imagen は predict メソッドを使用
        const endpoint = getVertexEndpoint(model, "predict");
        console.log(`Trying Imagen API (Vertex AI) with model: ${model}`);
        
        // Vertex AI の Imagen リクエスト形式（predict メソッド用）
        const requestBody = {
          instances: [
            {
              prompt: promptJaOrEn
            }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "16:9",
            safetyFilterLevel: "block_some",
            personGeneration: "allow_all"
          }
        };
        
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
          });

          const responseText = await res.text();
          console.log(`Imagen API (Vertex AI, ${model}) response status:`, res.status);

          if (res.ok) {
            let json: any;
            try {
              json = JSON.parse(responseText);
            } catch (parseError) {
              console.error("Failed to parse JSON response:", parseError);
              if (vertexModels.indexOf(model) < vertexModels.length - 1) {
                continue;
              }
              break;
            }

            // Vertex AI の Imagen レスポンス形式の確認
            // 形式1: generatedImages[0].bytesBase64Encoded
            if (json.generatedImages?.[0]?.bytesBase64Encoded) {
              const imageBytes = json.generatedImages[0].bytesBase64Encoded;
              const imageUrl = `data:image/png;base64,${imageBytes}`;
              console.log(`Image generated successfully with ${model} (Vertex AI, bytesBase64Encoded)`);
              return { imageUrl };
            }
            // 形式2: generatedImages[0].image.imageBytes
            if (json.generatedImages?.[0]?.image?.imageBytes) {
              const imageBytes = json.generatedImages[0].image.imageBytes;
              const imageUrl = `data:image/png;base64,${imageBytes}`;
              console.log(`Image generated successfully with ${model} (Vertex AI)`);
              return { imageUrl };
            }
            // 形式3: generatedImages[0].image.image_bytes (snake_case)
            if (json.generatedImages?.[0]?.image?.image_bytes) {
              const imageBytes = json.generatedImages[0].image.image_bytes;
              const imageUrl = `data:image/png;base64,${imageBytes}`;
              console.log(`Image generated successfully with ${model} (Vertex AI, snake_case)`);
              return { imageUrl };
            }
            // 形式4: predictions[0].bytesBase64Encoded (predict メソッドの場合)
            if (json.predictions?.[0]?.bytesBase64Encoded) {
              const imageBytes = json.predictions[0].bytesBase64Encoded;
              const imageUrl = `data:image/png;base64,${imageBytes}`;
              console.log(`Image generated successfully with ${model} (Vertex AI, predictions)`);
              return { imageUrl };
            }

            // 期待する形式が見つからない場合は次のモデルを試す
            if (vertexModels.indexOf(model) < vertexModels.length - 1) {
              console.warn(`Unexpected response format for ${model}, trying next...`);
              continue;
            }
          } else {
            // エラーハンドリング
            if (res.status === 404 && vertexModels.indexOf(model) < vertexModels.length - 1) {
              console.log(`Model ${model} not found, trying next model...`);
              continue;
            }
            // 403 エラー: API が有効化されていない
            if (res.status === 403) {
              let errorMessage = "Vertex AI API is not enabled";
              try {
                const errorJson = JSON.parse(responseText);
                if (errorJson.error?.message) {
                  errorMessage = errorJson.error.message;
                }
              } catch {
                // JSON パースに失敗した場合はデフォルトメッセージを使用
              }
              console.error(`Imagen API (Vertex AI, ${model}) error: 403 - ${errorMessage}`);
              // 最後のモデルでも 403 の場合は、API が有効化されていないことを示す
              if (vertexModels.indexOf(model) === vertexModels.length - 1) {
                console.warn("Vertex AI API is not enabled. Please enable it in Google Cloud Console.");
                break;
              }
              continue;
            }
            console.error(`Imagen API (Vertex AI, ${model}) error:`, res.status, responseText.substring(0, 500));
            if (vertexModels.indexOf(model) === vertexModels.length - 1) {
              break;
            }
            continue;
          }
        } catch (fetchError) {
          console.error(`Error calling Vertex AI ${model}:`, fetchError);
          if (vertexModels.indexOf(model) < vertexModels.length - 1) {
            continue;
          }
          break;
        }
      }
    }

    // すべてのモデルで失敗した場合
    return {
      imageUrl:
        "https://via.placeholder.com/800x450.png?text=All+Models+Failed"
    };
  } catch (error) {
    console.error("Imagen Image generation error:", error);
    return {
      imageUrl:
        "https://via.placeholder.com/800x450.png?text=Image+Generation+Error"
    };
  }
}
