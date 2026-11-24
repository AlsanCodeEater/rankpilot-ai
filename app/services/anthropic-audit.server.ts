/**
 * v2-engine: single-product audit via Anthropic's own API (no OpenRouter).
 * Same tool-forced schema and brand-voice prompt as the batch pipeline, same
 * AiAuditResponse contract as the legacy OpenRouter path, so every caller of
 * auditProductWithAI works unchanged.
 */
import Anthropic from "@anthropic-ai/sdk";
import prisma from "../db.server";
import { isPaidPlan } from "./ai-provider.server";
import { AUDIT_TOOL, buildBatchSystemPrompt, buildProductMessage } from "./anthropic-batch.server";
import { AiAuditResponseSchema, type AiAuditResponse } from "./ai-audit.server";

// Model IDs current as of Nov 2026 — override via env if Anthropic rotates them.
const FREE_MODEL = process.env.ANTHROPIC_FREE_MODEL || "claude-haiku-5-5";
const PAID_MODEL = process.env.ANTHROPIC_PAID_MODEL || "claude-sonnet-5-5";
const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || "30000", 10);

export async function auditProductWithAnthropic(
  product: any,
  planName?: string | null,
  billingStatus?: string | null,
): Promise<AiAuditResponse> {
  const model = isPaidPlan(planName, billingStatus) ? PAID_MODEL : FREE_MODEL;

  try {
    const settings = product?.shop
      ? await prisma.shopSettings.findUnique({ where: { shopDomain: product.shop } })
      : null;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create(
      {
        model,
        max_tokens: 1800,
        system: buildBatchSystemPrompt(settings),
        tools: [AUDIT_TOOL],
        tool_choice: { type: "auto" },
        messages: [{ role: "user", content: buildProductMessage(product) }],
      },
      { timeout: TIMEOUT_MS },
    );

    const toolUse = response.content.find((b) => b.type === "tool_use");
    const input = toolUse && "input" in toolUse ? toolUse.input : null;
    if (!input) {
      return {
        success: false,
        error: "AI returned no structured result. Please try again.",
        errorType: "EMPTY_RESPONSE",
        retryAfterSeconds: 30,
      };
    }

    const validated = AiAuditResponseSchema.safeParse(input);
    if (!validated.success) {
      console.error("Anthropic audit schema validation failed", {
        model,
        error: validated.error.message.slice(0, 300),
      });
      return {
        success: false,
        error: "AI returned an invalid response format. Please try again.",
        errorType: "INVALID_JSON",
        retryAfterSeconds: 30,
      };
    }

    return {
      success: true,
      aiScore: validated.data.aiScore,
      issues: validated.data.issues,
      suggestions: validated.data.suggestions,
    };
  } catch (error: any) {
    const status = error?.status ?? error?.response?.status;
    console.error(`Anthropic audit failed (${model}):`, { error: error?.message, status });

    if (error?.name === "APIConnectionTimeoutError" || /timed? ?out/i.test(String(error?.message))) {
      return { success: false, error: "AI audit timed out. Please try again.", errorType: "AI_TIMEOUT", retryAfterSeconds: 30 };
    }
    if (status === 429) {
      return { success: false, error: "AI service is busy. Please wait a moment and try again.", errorType: "RATE_LIMIT", retryAfterSeconds: 60 };
    }
    if (status === 529 || status === 503 || status === 502) {
      return { success: false, error: "AI service is busy. Please wait a moment and try again.", errorType: "PROVIDER_OVERLOADED", retryAfterSeconds: 60 };
    }
    if (status === 401 || status === 403) {
      return { success: false, error: "AI provider rejected the API key. Check ANTHROPIC_API_KEY.", errorType: "AI_PROVIDER_ERROR", retryAfterSeconds: 30 };
    }
    return { success: false, error: error?.message || "An unknown network error occurred.", errorType: "NETWORK_ERROR", retryAfterSeconds: 30 };
  }
}
