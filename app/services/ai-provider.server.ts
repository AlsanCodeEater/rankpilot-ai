import OpenAI from "openai";

export function normalizePlanName(planName?: string | null) {
  return String(planName || "FREE").toUpperCase();
}

export function isPaidPlan(planName?: string | null, billingStatus?: string | null) {
  const plan = normalizePlanName(planName);
  const status = String(billingStatus || "").toLowerCase();

  return (
    ["STARTER", "GROWTH", "PRO"].includes(plan) &&
    ["active", "trial", "trialing"].includes(status)
  );
}

export function getOpenRouterModelForPlan(planName?: string | null, billingStatus?: string | null) {
  const plan = normalizePlanName(planName);
  const status = String(billingStatus || "").toLowerCase();

  // Free or inactive users use free/cheap model
  if (!["active", "trial", "trialing"].includes(status) && plan !== "BETA") {
    return process.env.OPENROUTER_FREE_MODEL || "google/gemini-2.5-flash";
  }

  if (plan === "PRO") {
    return process.env.OPENROUTER_PRO_MODEL || "anthropic/claude-sonnet-4";
  }

  if (plan === "GROWTH") {
    return process.env.OPENROUTER_GROWTH_MODEL || "anthropic/claude-sonnet-4";
  }

  if (plan === "STARTER") {
    return process.env.OPENROUTER_STARTER_MODEL || "google/gemini-2.5-pro";
  }
  
  if (plan === "BETA") {
    return process.env.OPENROUTER_PRO_MODEL || "anthropic/claude-sonnet-4";
  }

  return process.env.OPENROUTER_FREE_MODEL || "google/gemini-2.5-flash";
}

export function getAIClient(providerOverride?: string, planName?: string | null, billingStatus?: string | null) {
  const provider = providerOverride || process.env.AI_PROVIDER || "openrouter";

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
      model: getOpenRouterModelForPlan(planName, billingStatus),
      provider: "openrouter",
    };
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}
