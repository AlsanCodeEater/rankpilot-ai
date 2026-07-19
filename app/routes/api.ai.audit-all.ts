import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { auditProductWithAI, cleanPlaceholderText } from "../services/ai-audit.server";
import { recalculateProductScore } from "../services/suggestions.server";
import { canUseFeature } from "../services/plans.server";
import { checkUsageLimit, incrementUsage } from "../services/usage.server";
import { checkAndExpireBetaIfNeeded } from "../services/beta.server";
import { getAIClient } from "../services/ai-provider.server";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);
  
  await checkAndExpireBetaIfNeeded(session.shop);

  // 1. Check if bulk audit is allowed
  const hasBulkAudit = await canUseFeature(session.shop, "bulkAudit");
  if (!hasBulkAudit) {
    return json({
      success: false,
      error: "Bulk AI audit is available on Starter plan and above.",
      upgradeRequired: true
    });
  }

  // 2. Check usage limits
  const usageCheck = await checkUsageLimit(session.shop, "ai_audit");
  if (!usageCheck.allowed) {
    return json({
      success: false,
      error: usageCheck.error,
      upgradeRequired: usageCheck.upgradeRequired
    });
  }

  const remainingQuota = usageCheck.limit - usageCheck.currentUsage;
  const auditLimit = parseInt(process.env.AI_AUDIT_LIMIT || "20", 10);
  const maxToAudit = Math.min(auditLimit, remainingQuota);

  const products = await prisma.productSnapshot.findMany({
    where: { shop: session.shop },
    orderBy: { updatedAt: "desc" },
    take: maxToAudit,
  });

  if (products.length === 0) {
    return json({ error: "No products found. Please sync first." }, { status: 400 });
  }

  let totalAnalyzed = 0;
  let totalSuggestions = 0;
  const errors: any[] = [];

  for (const product of products) {
    if (totalAnalyzed > 0) {
      await sleep(1500); // Wait 1.5s between products to prevent provider rate limits
    }

    try {
      // 2. The AI should audit synced Shopify products and return JSON
      const result = await auditProductWithAI(product);

      if (!result.success) {
        console.error("Audit failed", {
          shop: session.shop,
          productId: product.id,
          errorType: result.errorType,
          error: result.error
        });
        errors.push({ productId: product.id, error: result.error, errorType: result.errorType });
        continue;
      }

      if (result.suggestions.length === 0) {
        errors.push({ productId: product.id, error: "AI returned 0 actionable suggestions", errorType: "EMPTY_RESPONSE" });
        continue;
      }

      await prisma.aiSuggestion.deleteMany({
        where: {
          productSnapshotId: product.id,
          status: "pending",
        },
      });

      let createdSuggestions = 0;
      // 3. Save suggestions in AiSuggestion table
      for (const suggestion of result.suggestions) {
        const issue = cleanPlaceholderText(suggestion.issue, product) || suggestion.issue;
        const reason = cleanPlaceholderText(suggestion.reason, product) || suggestion.reason;
        const newValue = cleanPlaceholderText(suggestion.newValue, product);

        if (newValue && /\[(brand name|brand|product name|your brand|your product|company name)\]/i.test(newValue)) {
          console.warn("Removed placeholder from AI suggestion", { productId: product.id, suggestionType: suggestion.type });
          continue;
        }

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
        totalSuggestions++;
        createdSuggestions++;
      }

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
      
      totalAnalyzed++;
    } catch (error) {
      console.error(`Failed to audit product ${product.id}:`, error);
      errors.push({ productId: product.id, error: String(error) });
    }
  }

  if (totalAnalyzed > 0) {
    await incrementUsage(session.shop, "ai_audit", totalAnalyzed);
  }

  return json({
    success: true,
    message: "Bulk AI analysis complete",
    totalAnalyzed,
    totalSuggestions,
    errors,
  });
};
