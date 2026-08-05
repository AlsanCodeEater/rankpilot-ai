import { z } from "zod";
import { getAIClient } from "./ai-provider.server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Define the expected AI output schema using Zod
const AiSuggestionSchema = z.object({
  type: z.enum([
    "improve_title",
    "improve_description",
    "improve_seo_title",
    "improve_seo_description",
    "add_tags",
    "improve_tags",
    "inventory_warning",
    "catalog_cleanup"
  ]),
  issue: z.string(),
  reason: z.string(),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  confidenceScore: z.number().min(0).max(1),
});

const AiAuditResponseSchema = z.object({
  aiScore: z.number().min(0).max(100),
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
  errorType: "AI_TIMEOUT" | "INVALID_JSON" | "AI_PROVIDER_ERROR" | "EMPTY_RESPONSE" | "NETWORK_ERROR" | "RATE_LIMIT" | "PROVIDER_OVERLOADED" | "UNKNOWN";
  retryAfterSeconds?: number;
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

ADDITIONAL STRICT RULES:
- Return only valid JSON.
- No markdown.
- No backticks.
- No explanation outside JSON.
- Do not include newline-heavy long text.
- Keep every string under 300 characters.
- Do not use unescaped quotes inside string values.
- If data is missing, use null.
- Maximum 8 suggestions.
`;
}

export function parseAuditJson(rawText: string) {
  try {
    let cleanText = rawText.trim();
    if (cleanText.startsWith("\`\`\`")) {
      cleanText = cleanText.replace(/^\`\`\`(?:json|JSON)?\s*/, "").replace(/\s*\`\`\`$/, "");
    }
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    const parsedData = JSON.parse(cleanText);
    const validatedData = AiAuditResponseSchema.parse(parsedData);
    return { success: true, data: validatedData };
  } catch (error: any) {
    return { success: false, errorType: "INVALID_JSON" as const, parseError: error.message };
  }
}

const productAuditJsonSchema: any = {
  type: "json_schema",
  json_schema: {
    name: "product_audit_result",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["aiScore", "issues", "suggestions"],
      properties: {
        aiScore: {
          type: "number",
          minimum: 0,
          maximum: 100
        },
        issues: {
          type: "array",
          items: { type: "string" }
        },
        suggestions: {
          type: "array",
          maxItems: 8,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "type",
              "issue",
              "reason",
              "oldValue",
              "newValue",
              "confidenceScore"
            ],
            properties: {
              type: {
                type: "string",
                enum: [
                  "improve_title",
                  "improve_description",
                  "improve_seo_title",
                  "improve_seo_description",
                  "add_tags",
                  "improve_tags",
                  "inventory_warning",
                  "catalog_cleanup"
                ]
              },
              issue: { type: "string" },
              reason: { type: "string" },
              oldValue: {
                anyOf: [{ type: "string" }, { type: "null" }]
              },
              newValue: {
                anyOf: [{ type: "string" }, { type: "null" }]
              },
              confidenceScore: {
                type: "number",
                minimum: 0,
                maximum: 1
              }
            }
          }
        }
      }
    }
  }
};

async function executeAIRequest(client: any, model: string, messages: any[], response_format: any) {
  const aiPromise = client.chat.completions.create({
    model,
    messages,
    temperature: 0, // Using 0 for more deterministic JSON
    max_tokens: 1800,
    stream: false,
    response_format,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const err = new Error("AI audit timed out. Please try again.");
      err.name = "AbortError";
      reject(err);
    }, parseInt(process.env.AI_TIMEOUT_MS || "30000", 10));
  });

  return Promise.race([aiPromise, timeoutPromise]) as Promise<any>;
}

export async function auditProductWithAI(product: any, planName?: string | null, billingStatus?: string | null): Promise<AiAuditResponse> {
  const prompt = buildPrompt(product);
  
  const providersToTry = [undefined]; // First try default provider (OpenRouter)
  if (process.env.ZAI_API_KEY) {
    providersToTry.push(process.env.AI_FALLBACK_PROVIDER || "zai");
  }

  for (const providerOverride of providersToTry) {
    const { client, model, provider } = getAIClient(providerOverride, planName, billingStatus);

    
    // We get 2 attempts per provider for normal / schema fallback
    for (let attempt = 1; attempt <= 2; attempt++) {
      console.log("AI audit provider selected", { provider, model, attempt });

      try {
        let responseFormat = productAuditJsonSchema;
        // On attempt 2, if schema might have failed, we try json_object
        if (attempt === 2) {
          console.log(`${provider} retrying with json_object`);
          responseFormat = { type: "json_object" };
        }

        const messages = [
          {
            role: "system",
            content: "You are an expert Shopify merchandising copilot. Audit product data and return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ];

        let response = await executeAIRequest(client, model, messages, responseFormat);
        let rawResponse = response.choices[0]?.message?.content || "{}";
        let parseResult = parseAuditJson(rawResponse);

        if (!parseResult.success) {
          // Attempt Repair
          console.log("AI JSON parse failed, attempting repair", {
            provider,
            model,
            errorType: parseResult.errorType,
            parseError: parseResult.parseError,
            rawPreview: rawResponse.slice(0, 300)
          });

          const repairMessages = [
            ...messages,
            { role: "assistant", content: rawResponse },
            {
              role: "user",
              content: "Fix this broken JSON into valid JSON matching the required schema. Return only valid JSON. Do not add explanations.",
            },
          ];

          response = await executeAIRequest(client, model, repairMessages, { type: "json_object" });
          rawResponse = response.choices[0]?.message?.content || "{}";
          parseResult = parseAuditJson(rawResponse);
        }

        if (parseResult.success) {
          const validatedData = parseResult.data;
          // Safety fallback: if AI found issues but generated 0 suggestions
          if (validatedData.issues?.length > 0 && (!validatedData.suggestions || validatedData.suggestions.length === 0)) {
            return {
              success: false,
              error: "AI audit completed but no actionable suggestions were generated. Please try again.",
              errorType: "EMPTY_RESPONSE",
              retryAfterSeconds: 30
            };
          }

          return {
            success: true,
            aiScore: validatedData.aiScore,
            issues: validatedData.issues,
            suggestions: validatedData.suggestions,
          };
        } else {
          // Parse failed even after repair, we'll continue the loop to try the next attempt/provider
          console.error("AI JSON parse failed after repair", {
            provider,
            model,
            errorType: parseResult.errorType,
            parseError: parseResult.parseError,
            rawPreview: rawResponse.slice(0, 300)
          });
          
          if (attempt === 2 && providerOverride === undefined && providersToTry.length > 1) {
             // Will fallback to Z.ai
             break; // break the attempt loop to go to next provider
          } else if (attempt === 2) {
             return {
                success: false,
                error: "AI returned an invalid response format. Please try again.",
                errorType: "INVALID_JSON",
                retryAfterSeconds: 30
             };
          }
        }

      } catch (error: any) {
        const isAbort = error.name === "AbortError";
        const status = error.status || error.response?.status;
        
        console.error(`AI Audit failed using ${provider} (${model}):`, {
          error: error.message,
          status,
          name: error.name
        });

        // If openrouter json schema is unsupported (usually 400), we continue to attempt 2 to fallback to json_object
        if (status === 400 && attempt === 1 && error.message.includes("response_format")) {
           console.log("OpenRouter json_schema unsupported, retrying with json_object");
           continue; 
        }

        if (isAbort) {
          return {
            success: false,
            error: "AI audit timed out. Please try again.",
            errorType: "AI_TIMEOUT",
            retryAfterSeconds: 30
          };
        }

        if (status === 429 || status === 503 || status === 502) {
           const errorType = status === 429 ? "RATE_LIMIT" : "PROVIDER_OVERLOADED";
           return {
             success: false,
             error: "AI service is busy. Please wait a moment and try again.",
             errorType,
             retryAfterSeconds: 60
           };
        }

        if (error instanceof SyntaxError || error.name === "ZodError") {
          return {
            success: false,
            error: "AI returned an invalid response format. Please try again.",
            errorType: "INVALID_JSON",
            retryAfterSeconds: 30
          };
        }

        return {
          success: false,
          error: error.message || "An unknown network error occurred.",
          errorType: "NETWORK_ERROR",
          retryAfterSeconds: 30
        };
      }
    }
  }

  return {
    success: false,
    error: "AI service failed after retries.",
    errorType: "UNKNOWN",
    retryAfterSeconds: 30
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
