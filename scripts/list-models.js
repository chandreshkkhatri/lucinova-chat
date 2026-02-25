const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function main() {
  try {
    const list = await ai.models.list();
    for await (const model of list) {
       console.log(model.name, model.supportedGenerationMethods);
    }
  } catch (e) {
    console.error(e);
  }
}

main();
