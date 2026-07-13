import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { auditProductWithAI } from "../services/ai-audit.server";
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

    // Update product score
    await prisma.productSnapshot.update({
      where: { id: product.id },
      data: {
        aiScore: result.score,
        issueCount: result.issues?.length || 0,
      },
    });

    // Clear old pending suggestions
    await prisma.aiSuggestion.deleteMany({
      where: {
        productSnapshotId: product.id,
        status: "pending",
      },
    });

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
    }

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
