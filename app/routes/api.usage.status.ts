import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getOrCreateShopPlan, getPlanLimits } from "../services/plans.server";
import { getUsage } from "../services/usage.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    
    const shopPlan = await getOrCreateShopPlan(session.shop);
    const limits = getPlanLimits(shopPlan.planName);

    const aiAuditUsage = await getUsage(session.shop, "ai_audit");
    const suggestionApplyUsage = await getUsage(session.shop, "suggestion_apply");
    const productSyncUsage = await getUsage(session.shop, "product_sync"); // This represents how many times they synced, but product limit is based on total products in DB.
    
    // For "product_sync" usage representation, we could also just query the db count. Let's do that for accuracy.
    const { default: prisma } = await import("../db.server");
    const actualProductCount = await prisma.productSnapshot.count({
      where: { shop: session.shop }
    });

    return json({
      success: true,
      plan: shopPlan.planName,
      billingStatus: shopPlan.billingStatus,
      limits: {
        productLimit: limits.productLimit,
        aiAuditLimit: limits.aiAuditLimit,
        applyLimit: limits.applyLimit,
        bulkAudit: limits.bulkAudit,
      },
      usage: {
        ai_audit: aiAuditUsage,
        suggestion_apply: suggestionApplyUsage,
        product_sync: actualProductCount, 
      },
    });
  } catch (error: any) {
    console.error("Failed to load usage status:", error);
    return json({ 
      success: false, 
      error: error.message || "Failed to load usage status" 
    }, { status: 500 });
  }
};
