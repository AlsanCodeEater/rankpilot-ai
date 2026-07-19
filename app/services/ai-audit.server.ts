import { z } from "zod";
import { getAIClient } from "./ai-provider.server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Define the expected AI output schema using Zod
const AiSuggestionSchema = z.object({
  type: z.enum([
    "rewrite_title",
    "improve_description",
    "add_tags",
    "improve_seo_title",
    "improve_seo_description",
    "inventory_warning",
    "search_keyword_gap",
  ]),
  issue: z.string(),
  reason: z.string(),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  confidenceScore: z.number().min(0).max(1),
});

const AiAuditResponseSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(z.string()),
  suggestions: z.array(AiSuggestionSchema),
});

export type AiSuggestionInput = z.infer<typeof AiSuggestionSchema>;

export type AuditSuccess = {
  success: true;
  aiScore: number;
  issues: string[];
  suggestions: AiSuggestionInput[];
};

export type AuditFailure = {
  success: false;
  error: string;
  errorType: "AI_TIMEOUT" | "INVALID_JSON" | "AI_PROVIDER_ERROR" | "EMPTY_RESPONSE";
};

export type AiAuditResponse = AuditSuccess | AuditFailure;

// Helper to define the prompt
function buildPrompt(product: any): string {
  return `
Audit the following Shopify product data as a merchandising expert.

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
- SEO Description: ${product.seoDescription || "N/A"}

CRITICAL RULES FOR PLACEHOLDERS AND BRAND NAMES:
1. NEVER use placeholders such as [Brand Name], [Brand], [Product Name], {{brand}}, or generic template variables in your output.
2. If product vendor/brand is missing, omit the brand entirely from the suggestion. Do not invent a fake brand.
3. If the current product title contains [Brand Name], remove it and create a clean merchant-ready title.
4. Every suggested value (newValue) MUST be ready to apply directly to Shopify without any human editing.

Please check for:
- weak title or missing buyer keywords
- weak description
- missing tags
- weak SEO title or description
- missing product type
- low inventory or out-of-stock issue
- poor Shopify search/filter discovery

Return ONLY valid JSON matching this exact structure:
{
  "score": <0-100 number>,
  "issues": ["Issue 1", "Issue 2"],
  "suggestions": [
    {
      "type": "<one of: rewrite_title, improve_description, add_tags, improve_seo_title, improve_seo_description, inventory_warning, search_keyword_gap>",
      "issue": "...",
      "reason": "...",
      "oldValue": "...",
      "newValue": "...",
      "confidenceScore": <0.0-1.0 number>
    }
  ]
}
`;
}

export async function auditProductWithAI(product: any): Promise<AiAuditResponse> {
  const prompt = buildPrompt(product);
  const maxRetries = 1;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // If it's a retry and we have a fallback provider configured, we can try falling back.
    const useFallback = attempt > 0 && process.env.AI_FALLBACK_PROVIDER ? process.env.AI_FALLBACK_PROVIDER : undefined;
    const { client, model, provider } = getAIClient(useFallback);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are an expert Shopify merchandising copilot. Audit product data and return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        stream: false,
        response_format: { type: "json_object" },
      }, { signal: controller.signal as any });

      clearTimeout(timeoutId);

      const rawResponse = response.choices[0]?.message?.content || "{}";
      
      // Clean markdown blocks if present
      let cleanResponse = rawResponse.trim();
      if (cleanResponse.startsWith("\`\`\`")) {
        cleanResponse = cleanResponse.replace(/^\`\`\`(?:json|JSON)?\s*/, "").replace(/\s*\`\`\`$/, "");
      }

      const parsedData = JSON.parse(cleanResponse);
      const validatedData = AiAuditResponseSchema.parse(parsedData);

      // Safety fallback: if AI found issues but generated 0 suggestions
      if (validatedData.issues?.length > 0 && (!validatedData.suggestions || validatedData.suggestions.length === 0)) {
        return {
          success: false,
          error: "AI audit completed but no actionable suggestions were generated. Please try again.",
          errorType: "EMPTY_RESPONSE",
        };
      }

      return {
        success: true,
        aiScore: validatedData.score,
        issues: validatedData.issues,
        suggestions: validatedData.suggestions,
      };

    } catch (error: any) {
      const isAbort = error.name === "AbortError";
      const status = error.status || error.response?.status;
      
      console.error(`AI Audit failed (Attempt ${attempt + 1}) using ${provider} (${model}):`, {
        error: error.message,
        status,
        name: error.name
      });

      if (isAbort) {
        return {
          success: false,
          error: "AI audit timed out. Please try again.",
          errorType: "AI_TIMEOUT",
        };
      }

      if (status === 429 || status === 503 || status === 502) {
        if (attempt < maxRetries) {
          console.log(`Retrying AI audit in 2 seconds...`);
          await sleep(2000);
          continue;
        }

        const errorType = status === 429 ? "RATE_LIMIT" : "PROVIDER_OVERLOADED";
        return {
          success: false,
          error: "AI service is busy. Please wait a moment and try again.",
          errorType,
        };
      }

      // If it's a JSON parsing error
      if (error instanceof SyntaxError || error.name === "ZodError") {
        return {
          success: false,
          error: "AI returned an invalid response format. Please try again.",
          errorType: "INVALID_JSON",
        };
      }

      return {
        success: false,
        error: error.message || "An unknown network error occurred.",
        errorType: "NETWORK_ERROR",
      };
    }
  }

  // Fallback return (should not reach here)
  return {
    success: false,
    error: "AI service failed after retries.",
    errorType: "UNKNOWN"
  };
}

const PLACEHOLDER_REGEX = /\[(brand name|brand|product name|your brand|your product|company name)\]|\{\{.*?\}\}|<[^>]+>/gi;

export function cleanPlaceholderText(value: string | null | undefined, product: any): string | null {
  if (!value) return value || null;

  const fallbackBrand = product.vendor || product.brand || product.shopName || "";

  let cleaned = value.replace(PLACEHOLDER_REGEX, fallbackBrand);

  // If no fallbackBrand, remove empty placeholder leftovers
  cleaned = cleaned
    .replace(/\s{2,}/g, " ")
    .replace(/\s+-\s+$/g, "")
    .replace(/^\s+-\s+/g, "")
    .trim();

  return cleaned;
}
