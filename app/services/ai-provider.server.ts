import OpenAI from "openai";

export function getAIClient(providerOverride?: string) {
  const provider = providerOverride || process.env.AI_PROVIDER || "zai";

  if (provider === "zai") {
    if (!process.env.ZAI_API_KEY) {
      throw new Error("Missing ZAI_API_KEY in environment variables");
    }
    const client = new OpenAI({
      apiKey: process.env.ZAI_API_KEY,
      baseURL: process.env.ZAI_BASE_URL || "https://api.z.ai/api/paas/v4",
    });
    return {
      client,
      model: process.env.ZAI_MODEL || "glm-4.7-flash",
      provider: "zai",
    };
  }

  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("Missing OPENROUTER_API_KEY in environment variables");
    }
    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-OpenRouter-Title": process.env.APP_NAME || "RankPilot AI",
      },
    });
    return {
      client,
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
      provider: "openrouter",
    };
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}
