
const { GoogleGenAI } = require("@google/generative-ai");
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenAI(apiKey);

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available models:");
    models.models.forEach(m => {
      if (m.name.includes("image") || m.name.includes("imagen") || m.name.includes("gemini-3") || m.name.includes("gemini-2.5")) {
        console.log(`- ${m.name}: ${m.displayName} (${m.description})`);
        console.log(`  Capabilities: ${m.supportedGenerationMethods.join(", ")}`);
      }
    });
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
