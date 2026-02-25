const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "imagen-4.0-ultra-generate-001",
      contents: "A futuristic cyberpunk city",
    });
    console.log("Success with imagen-4.0-ultra-generate-001");
    // See if parts exist
    const parts = response.candidates?.[0]?.content?.parts || [];
    console.log("Parts count:", parts.length);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

main();
