import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { auditProductWithAI } from "../services/ai-audit.server";
import { recalculateProductScore } from "../services/suggestions.server";
import { checkUsageLimit, incrementUsage } from "../services/usage.server";
import { checkAndExpireBetaIfNeeded } from "../services/beta.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);
  
  await checkAndExpireBetaIfNeeded(session.shop);

  const formData = await request.formData();
  // Support both keys depending on where it's called from
  const productId = (formData.get("productSnapshotId") || formData.get("productId")) as string;

  if (!productId) {
    return json({ error: "Missing product ID" }, { status: 400 });
  }

  const usageCheck = await checkUsageLimit(session.shop, "ai_audit");
  if (!usageCheck.allowed) {
    return json({
      success: false,
      error: usageCheck.error,
      upgradeRequired: usageCheck.upgradeRequired
    });
  }

  const product = await prisma.productSnapshot.findUnique({
    where: { id: productId },
  });

  if (!product || product.shop !== session.shop) {
    return json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const result = await auditProductWithAI(product);

    // Clear old pending suggestions
    await prisma.aiSuggestion.deleteMany({
      where: {
        productSnapshotId: product.id,
        status: "pending",
      },
    });

    let createdSuggestions = 0;
    // Save new suggestions
    for (const suggestion of result.suggestions) {
      await prisma.aiSuggestion.create({
        data: {
          shop: session.shop,
          productSnapshotId: product.id,
          shopifyProductId: product.shopifyProductId,
          suggestionType: suggestion.type,
          issue: suggestion.issue,
          reason: suggestion.reason,
          oldValue: suggestion.oldValue || null,
          newValue: suggestion.newValue || null,
          confidenceScore: suggestion.confidenceScore,
          status: "pending",
        },
      });
      createdSuggestions++;
    }

    // Accurately count actionable pending suggestions and calculate the score
    const recalcResult = await recalculateProductScore(product.id, result.score);
    const pendingCount = recalcResult?.activeActionableIssueCount || 0;
    const finalScore = recalcResult?.nextScore || result.score;

    console.log({
      productId: product.id,
      shop: session.shop,
      aiScore: finalScore,
      issueCount: pendingCount,
      suggestionsReturned: result.suggestions?.length || 0,
      suggestionsCreated: createdSuggestions
    });

    // Increment usage by 1 after successful audit
    await incrementUsage(session.shop, "ai_audit", 1);

    return json({
      success: true,
      score: result.score,
      suggestions: result.suggestions,
      message: "Product audited successfully",
    });
  } catch (error: any) {
    console.error("Audit product error:", error);
    return json({ error: error.message || "Failed to audit product" }, { status: 500 });
  }
};
