import prisma from "../db.server";
import { getOrCreateShopPlan, getPlanLimits } from "./plans.server";

export function getCurrentPeriodKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function getUsage(shop: string, type: string) {
  const periodKey = getCurrentPeriodKey();
  const record = await prisma.usageRecord.findUnique({
    where: {
      shop_type_periodKey: {
        shop,
        type,
        periodKey,
      },
    },
  });

  return record?.count || 0;
}

export async function incrementUsage(shop: string, type: string, count = 1) {
  const periodKey = getCurrentPeriodKey();
  
  return prisma.usageRecord.upsert({
    where: {
      shop_type_periodKey: {
        shop,
        type,
        periodKey,
      },
    },
    update: {
      count: {
        increment: count,
      },
    },
    create: {
      shop,
      type,
      periodKey,
      count,
    },
  });
}

export async function checkUsageLimit(shop: string, type: "ai_audit" | "suggestion_apply" | "product_sync") {
  const shopPlan = await getOrCreateShopPlan(shop);
  const limits = getPlanLimits(shopPlan.planName);
  const currentUsage = await getUsage(shop, type);

  let limit = 0;
  let errorMsg = "";

  switch (type) {
    case "ai_audit":
      limit = limits.aiAuditLimit;
      errorMsg = "Monthly AI audit limit reached. Upgrade your plan to continue.";
      break;
    case "suggestion_apply":
      limit = limits.applyLimit;
      errorMsg = "Monthly suggestion apply limit reached. Upgrade your plan to continue.";
      break;
    case "product_sync":
      limit = limits.productLimit;
      errorMsg = "Product limit reached. Upgrade your plan to sync more products.";
      // Product sync isn't period-based, it's total limit check, but we handle the cutoff in the route itself.
      // We will just return the limit here so the route can decide.
      break;
  }

  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit,
    error: currentUsage >= limit ? errorMsg : null,
    upgradeRequired: currentUsage >= limit,
  };
}
