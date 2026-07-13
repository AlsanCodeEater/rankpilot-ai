import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getAIClient } from "../services/ai-provider.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. Authenticate Shopify admin request if inside app context
  await authenticate.admin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 2. Call the configured AI provider
    const { client, model, provider } = getAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: 'Return JSON only: { "ok": true, "provider": "...", "model": "..." }'
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content || "{}";
    
    // Parse result
    let parsedResult = {};
    try {
      let cleanResponse = rawContent.trim();
      if (cleanResponse.startsWith("\`\`\`")) {
        cleanResponse = cleanResponse.replace(/^\`\`\`(?:json|JSON)?\s*/, "").replace(/\s*\`\`\`$/, "");
      }
      parsedResult = JSON.parse(cleanResponse);
    } catch (e) {
      parsedResult = { error: "Failed to parse JSON", raw: rawContent };
    }

    // 4. Return provider, model, and parsed result
    return json({
      success: true,
      provider,
      model,
      result: parsedResult
    });

  } catch (error: any) {
    console.error("AI test route error:", error);
    return json({ 
      error: error.message || "Unknown error occurred" 
    }, { status: 500 });
  }
};
