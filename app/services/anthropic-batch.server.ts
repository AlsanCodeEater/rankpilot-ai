/**
 * v2-engine: catalog-scale audits via the Anthropic Message Batches API.
 *
 * Replaces the serial audit-all loop (20 products, 1.5s sleeps, sync calls)
 * with one batch submission that audits the whole flagged catalog at ~50% of
 * standard token price. Results are ingested with the SAME persistence
 * semantics as api.ai.audit-all.ts, so the existing Suggestions UI, scoring,
 * apply flow, and usage metering all keep working untouched.
 *
 * Env: ANTHROPIC_API_KEY (required), ANTHROPIC_BATCH_MODEL (default haiku).
 */
import Anthropic from "@anthropic-ai/sdk";
import prisma from "../db.server";
import { cleanPlaceholderText } from "./ai-audit.server";
import { recalculateProductScore } from "./suggestions.server";
import { incrementUsage } from "./usage.server";

const MODEL = process.env.ANTHROPIC_BATCH_MODEL || "claude-haiku-5-5";
const MAX_TOKENS = 1800;
const MAX_BATCH_PRODUCTS = parseInt(process.env.BATCH_AUDIT_MAX || "1000", 10);

const SUGGESTION_TYPES = [
  "improve_title",
  "improve_description",
  "improve_seo_title",
  "improve_seo_description",
  "add_tags",
  "improve_tags",
  "inventory_warning",
  "catalog_cleanup",
] as const;

export const AUDIT_TOOL = {
  name: "save_product_audit",
  description: "Save the audit result for this product.",
  // Newest models reject forced tool_choice; strict + auto is the supported way
  // to guarantee schema-valid input (platform.claude.com docs, Sonnet 5.5 migration).
  strict: true,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["aiScore", "issues", "suggestions"],
    properties: {
      aiScore: { type: "number", minimum: 0, maximum: 100 },
      issues: { type: "array", items: { type: "string" } },
      suggestions: {
        type: "array",
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type", "issue", "reason", "oldValue", "newValue", "confidenceScore"],
          properties: {
            type: { type: "string", enum: [...SUGGESTION_TYPES] },
            issue: { type: "string" },
            reason: { type: "string" },
            oldValue: { anyOf: [{ type: "string" }, { type: "null" }] },
            newValue: { anyOf: [{ type: "string" }, { type: "null" }] },
            confidenceScore: { type: "number", minimum: 0, maximum: 1 },
          },
        },
      },
    },
  },
};

function client() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY in environment variables");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

interface VoiceSettings {
  voiceTone?: string | null;
  voiceAudience?: string | null;
  voiceKeywords?: string | null;
  voiceBannedWords?: string | null;
}

export function buildBatchSystemPrompt(voice: VoiceSettings | null): string {
  return [
    "You are an expert Shopify merchandising copilot. Audit product data and save the result with the save_product_audit tool.",
    voice?.voiceTone ? `Brand tone for every suggested value: ${voice.voiceTone}.` : "",
    voice?.voiceAudience ? `The store's audience: ${voice.voiceAudience}.` : "",
    voice?.voiceKeywords ? `Weave in these keywords where natural (never stuff): ${voice.voiceKeywords}.` : "",
    voice?.voiceBannedWords ? `Never use these words: ${voice.voiceBannedWords}.` : "",
    "CRITICAL RULES FOR PLACEHOLDERS AND BRAND NAMES:",
    "1. NEVER use placeholders such as [Brand Name], [Brand], [Product Name], {{brand}}, or generic template variables.",
    "2. If product vendor/brand is missing, omit the brand entirely. Do not invent a fake brand.",
    "3. Every suggested newValue MUST be ready to apply directly to Shopify without human editing.",
    "4. Never invent product facts (materials, dimensions, certifications). Only rework what the source states.",
    "Keep every string under 300 characters. Maximum 8 suggestions.",
    "Always respond by calling the save_product_audit tool exactly once. Never reply in plain text.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildProductMessage(product: {
  title: string;
  handle: string | null;
  description: string | null;
  bodyHtml: string | null;
  vendor: string | null;
  productType: string | null;
  tags: string | null;
  status: string | null;
  totalInventory: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
}): string {
  return `Audit the following Shopify product data as a merchandising expert.

Product Data:
- Title: ${product.title || "N/A"}
- Handle: ${product.handle || "N/A"}
- Description: ${product.description || product.bodyHtml || "N/A"}
- Vendor: ${product.vendor || "N/A"}
- Product Type: ${product.productType || "N/A"}
- Tags: ${product.tags || "N/A"}
- Status: ${product.status || "N/A"}
- Total Inventory: ${product.totalInventory ?? "N/A"}
- SEO Title: ${product.seoTitle || "N/A"}
- SEO Description: ${product.seoDescription || "N/A"}`;
}

/** Submit one batch covering up to `limit` products (worst-scored first). */
export async function submitBatchAudit(shop: string, limit: number) {
  const take = Math.min(Math.max(limit, 1), MAX_BATCH_PRODUCTS);
  const products = await prisma.productSnapshot.findMany({
    where: { shop },
    orderBy: [{ aiScore: { sort: "asc", nulls: "first" } }, { updatedAt: "desc" }],
    take,
  });
  if (products.length === 0) throw new Error("No synced products to audit. Run a product sync first.");

  const settings = await prisma.shopSettings.findUnique({ where: { shopDomain: shop } });
  const system = buildBatchSystemPrompt(settings);

  const requests = products.map((p: (typeof products)[number]) => ({
    custom_id: p.id, // ProductSnapshot cuid, <=64 chars
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      tools: [AUDIT_TOOL],
      tool_choice: { type: "auto" as const },
      messages: [{ role: "user" as const, content: buildProductMessage(p) }],
    },
  }));

  const batch = await client().messages.batches.create({ requests });

  return prisma.batchAuditRun.create({
    data: { shop, anthropicBatchId: batch.id, status: "submitted", requested: products.length },
  });
}

interface AuditToolOutput {
  aiScore: number;
  issues: string[];
  suggestions: {
    type: string;
    issue: string;
    reason: string;
    oldValue: string | null;
    newValue: string | null;
    confidenceScore: number;
  }[];
}

const PLACEHOLDER_TEST = /\[(brand name|brand|product name|your brand|your product|company name)\]/i;

/** Poll the batch; when it has ended, ingest results. Safe to call repeatedly. */
export async function syncBatchAudit(runId: string) {
  const run = await prisma.batchAuditRun.findUniqueOrThrow({ where: { id: runId } });
  if (run.status === "completed" || run.status === "failed") return run;

  const anthropic = client();
  const batch = await anthropic.messages.batches.retrieve(run.anthropicBatchId);
  if (batch.processing_status !== "ended") {
    return prisma.batchAuditRun.update({ where: { id: runId }, data: { status: "in_progress" } });
  }

  let completed = 0;
  let failed = 0;
  let totalSuggestions = 0;

  for await (const entry of await anthropic.messages.batches.results(run.anthropicBatchId)) {
    const product = await prisma.productSnapshot.findUnique({ where: { id: entry.custom_id } });
    if (!product || product.shop !== run.shop) {
      failed += 1;
      continue;
    }

    let output: AuditToolOutput | null = null;
    if (entry.result.type === "succeeded") {
      const toolUse = entry.result.message.content.find((b) => b.type === "tool_use");
      if (toolUse && "input" in toolUse) output = toolUse.input as AuditToolOutput;
    }
    if (!output || !Array.isArray(output.suggestions)) {
      failed += 1;
      continue;
    }

    // Same persistence semantics as api.ai.audit-all.ts:
    await prisma.aiSuggestion.deleteMany({
      where: { productSnapshotId: product.id, status: "pending" },
    });

    for (const suggestion of output.suggestions) {
      const issue = cleanPlaceholderText(suggestion.issue, product) || suggestion.issue;
      const reason = cleanPlaceholderText(suggestion.reason, product) || suggestion.reason;
      const newValue = cleanPlaceholderText(suggestion.newValue, product);
      if (newValue && PLACEHOLDER_TEST.test(newValue)) continue;

      let oldValue: string | null = null;
      switch (suggestion.type) {
        case "rewrite_title":
        case "improve_title":
          oldValue = product.title;
          break;
        case "improve_description":
          oldValue = product.description || product.bodyHtml;
          break;
        case "add_tags":
        case "improve_tags":
          oldValue = product.tags;
          break;
        case "improve_seo_title":
          oldValue = product.seoTitle;
          break;
        case "improve_seo_description":
          oldValue = product.seoDescription;
          break;
      }

      await prisma.aiSuggestion.create({
        data: {
          shop: run.shop,
          productSnapshotId: product.id,
          shopifyProductId: product.shopifyProductId,
          suggestionType: suggestion.type,
          issue,
          reason,
          oldValue,
          newValue,
          confidenceScore: suggestion.confidenceScore,
          status: "pending",
        },
      });
      totalSuggestions += 1;
    }

    await recalculateProductScore(product.id, output.aiScore);
    completed += 1;
  }

  if (completed > 0) {
    await incrementUsage(run.shop, "ai_audit", completed);
  }

  return prisma.batchAuditRun.update({
    where: { id: runId },
    data: { status: "completed", completed, failed, totalSuggestions, finishedAt: new Date() },
  });
}
