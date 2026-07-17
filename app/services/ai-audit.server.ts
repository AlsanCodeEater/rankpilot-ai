import { z } from "zod";
import { getAIClient } from "./ai-provider.server";

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

export type AiAuditResponse = z.infer<typeof AiAuditResponseSchema>;

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
  const { client, model, provider } = getAIClient();
  const prompt = buildPrompt(product);

  try {
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
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    
    // Clean markdown blocks if present (just in case, though openai + json_object usually returns raw json)
    let cleanResponse = rawResponse.trim();
    if (cleanResponse.startsWith("\`\`\`")) {
      cleanResponse = cleanResponse.replace(/^\`\`\`(?:json|JSON)?\s*/, "").replace(/\s*\`\`\`$/, "");
    }

    const parsedData = JSON.parse(cleanResponse);
    
    // Validate with Zod
    const validatedData = AiAuditResponseSchema.parse(parsedData);

    // Safety fallback: if AI found issues but generated 0 suggestions, map issues to basic suggestions
    if (validatedData.issues?.length > 0 && (!validatedData.suggestions || validatedData.suggestions.length === 0)) {
      validatedData.suggestions = validatedData.issues.map((issue) => ({
        type: "improve_seo_description", // closest generic fallback category
        issue: issue,
        reason: "AI detected an issue but did not provide a specific recommended fix.",
        oldValue: null,
        newValue: null,
        confidenceScore: 0.5,
      }));
    }

    return validatedData;

  } catch (error) {
    console.error(`AI Audit failed using ${provider} (${model}):`, error);
    
    return {
      score: 50,
      issues: ["AI audit failed or returned invalid JSON"],
      suggestions: [{
        type: "improve_seo_description",
        issue: "AI audit failed or returned invalid JSON",
        reason: "The AI service encountered an error. Please try auditing this product again.",
        oldValue: null,
        newValue: null,
        confidenceScore: 0,
      }],
    };
  }
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
