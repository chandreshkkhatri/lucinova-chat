const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testImageGeneration(modelId, prompt, tools = null) {
  console.log(`\nTesting: ${modelId}`);
  if (tools) console.log(`Tools attached: ${JSON.stringify(tools)}`);
  
  const startTime = Date.now();
  try {
    const config = { responseModalities: ['TEXT', 'IMAGE'] };
    if (tools) config.tools = tools;

    console.log("Generating...");
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: config
    });
    
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const parts = response.candidates?.[0]?.content?.parts || [];
    const hasImage = parts.some(p => p.inlineData);
    const textParts = parts.filter(p => p.text).map(p => p.text).join(" ");
    
    console.log(`SUCCESS [${timeTaken}s]`);
    console.log(`Has image: ${hasImage}`);
    if (textParts) console.log(`Response text: ${textParts.substring(0, 50)}...`);
    
  } catch (err) {
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`FAILED [${timeTaken}s]`);
    console.error(err.message || err);
  }
}

async function main() {
  const prompt = "A futuristic cyberpunk city with neon lights";
  
  await testImageGeneration("gemini-2.0-flash-exp-image-generation", prompt);
  await testImageGeneration("gemini-2.5-flash-image", prompt);
  await testImageGeneration("gemini-3-pro-image-preview", prompt);
  
}

main();
