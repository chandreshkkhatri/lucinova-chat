import { googleClient } from "@/ai";

/**
 * Generate a simple text response using Google GenAI (for titles, summaries)
 */
export async function generateSimpleText(modelId: string, prompt: string) {
  try {
    const response = await googleClient.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text || "";
  } catch (error) {
    console.error("[Chat API] Generate text failed:", error);
    return "";
  }
}
