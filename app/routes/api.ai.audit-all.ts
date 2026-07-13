import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { auditProductWithAI } from "../services/ai-audit.server";
import { canUseFeature } from "../services/plans.server";
import { checkUsageLimit, incrementUsage } from "../services/usage.server";
import { checkAndExpireBetaIfNeeded } from "../services/beta.server";

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

  for (const product of products) {
    try {
      // 2. The AI should audit synced Shopify products and return JSON
      const result = await auditProductWithAI(product);

      await prisma.productSnapshot.update({
        where: { id: product.id },
        data: {
          aiScore: result.score,
        },
      });

      await prisma.aiSuggestion.deleteMany({
        where: {
          productSnapshotId: product.id,
          status: "pending",
        },
      });

      // 3. Save suggestions in AiSuggestion table
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
        totalSuggestions++;
      }
      
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
