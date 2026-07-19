import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { auditProductWithAI, cleanPlaceholderText } from "../services/ai-audit.server";
import { recalculateProductScore } from "../services/suggestions.server";
import { checkUsageLimit, incrementUsage } from "../services/usage.server";
import { checkAndExpireBetaIfNeeded } from "../services/beta.server";

const activeAudits = new Map<string, number>();

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);
  
  await checkAndExpireBetaIfNeeded(session.shop);

  const now = Date.now();
  const lastAudit = activeAudits.get(session.shop);
  if (lastAudit && now - lastAudit < 30000) {
    return json({
      success: false,
      errorType: "AUDIT_IN_PROGRESS",
      error: "An audit is already running. Please wait for it to finish."
    }, { status: 429 });
  }

  activeAudits.set(session.shop, now);

  const formData = await request.formData();
  // Support both keys depending on where it's called from
  const productId = (formData.get("productSnapshotId") || formData.get("productId")) as string;

  if (!productId) {
    activeAudits.delete(session.shop);
    return json({ error: "Missing product ID" }, { status: 400 });
  }

  const usageCheck = await checkUsageLimit(session.shop, "ai_audit");
  if (!usageCheck.allowed) {
    activeAudits.delete(session.shop);
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
    activeAudits.delete(session.shop);
    return json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const result = await auditProductWithAI(product);

    if (!result.success) {
      console.error("AI audit failed", {
        shop: session.shop,
        productId,
        error: result.error,
        errorType: result.errorType
      });

      let status = 502;
      if (result.errorType === "RATE_LIMIT") status = 429;
      if (result.errorType === "PROVIDER_OVERLOADED") status = 503;
      if (result.errorType === "AI_TIMEOUT") status = 504;
      if (result.errorType === "INVALID_JSON") status = 422;

      return json(
        {
          success: false,
          error: result.error || "AI audit failed. Please try again.",
          errorType: result.errorType,
          retryAfterSeconds: 60
        },
        { status }
      );
    }

    if (result.suggestions.length === 0) {
      return json(
        {
          success: false,
          error: "AI audit completed but no actionable suggestions were generated. Please try again."
        },
        { status: 422 }
      );
    }

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
      const issue = cleanPlaceholderText(suggestion.issue, product) || suggestion.issue;
      const reason = cleanPlaceholderText(suggestion.reason, product) || suggestion.reason;
      const newValue = cleanPlaceholderText(suggestion.newValue, product);

      if (newValue && /\[(brand name|brand|product name|your brand|your product|company name)\]/i.test(newValue)) {
        console.warn("Removed placeholder from AI suggestion", { productId: product.id, suggestionType: suggestion.type });
        continue; // Discard bad suggestion entirely
      }

      let oldValue: string | null = null;
      switch (suggestion.type) {
        case "rewrite_title":
        case "improve_title": // fallthrough for safety
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
          shop: session.shop,
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
      createdSuggestions++;
    }

    // Accurately count actionable pending suggestions and calculate the score
    const recalcResult = await recalculateProductScore(product.id, result.aiScore);
    const pendingCount = recalcResult?.activeActionableIssueCount || 0;
    const finalScore = recalcResult?.nextScore || result.aiScore;

    console.log("Audit completed", {
      productId: product.id,
      shop: session.shop,
      success: result.success,
      aiScore: finalScore,
      issueCount: pendingCount,
      suggestionsReturned: result.suggestions.length,
      suggestionsCreated: createdSuggestions
    });

    // Increment usage by 1 after successful audit
    await incrementUsage(session.shop, "ai_audit", 1);

    return json({
      success: true,
      score: result.aiScore,
      suggestions: result.suggestions,
      message: "Product audited successfully",
    });
  } catch (error: any) {
    console.error("Audit product error:", error);
    return json({ error: error.message || "Failed to audit product" }, { status: 500 });
  } finally {
    activeAudits.delete(session.shop);
  }
};
