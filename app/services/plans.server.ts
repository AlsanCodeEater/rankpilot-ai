import prisma from "../db.server";

export const PLAN_LIMITS = {
  FREE: {
    monthlyPrice: 0,
    productLimit: 50,
    aiAuditLimit: 25,
    applyLimit: 10,
    bulkAudit: false,
    analytics: false,
    advancedAnalytics: false,
  },
  STARTER: {
    monthlyPrice: 9,
    productLimit: 500,
    aiAuditLimit: 500,
    applyLimit: 100,
    bulkAudit: true,
    analytics: false,
    advancedAnalytics: false,
  },
  GROWTH: {
    monthlyPrice: 29,
    productLimit: 2500,
    aiAuditLimit: 2500,
    applyLimit: 500,
    bulkAudit: true,
    analytics: true,
    advancedAnalytics: false,
  },
  PRO: {
    monthlyPrice: 79,
    productLimit: 10000,
    aiAuditLimit: 10000,
    applyLimit: 2000,
    bulkAudit: true,
    analytics: true,
    advancedAnalytics: true,
  },
  BETA: {
    monthlyPrice: 0,
    productLimit: 2500,
    aiAuditLimit: 2500,
    applyLimit: 500,
    bulkAudit: true,
    analytics: true,
    advancedAnalytics: true,
  },
};

export type PlanName = keyof typeof PLAN_LIMITS;

export async function getOrCreateShopPlan(shop: string) {
  let shopPlan = await prisma.shopPlan.findUnique({
    where: { shop },
  });

  if (!shopPlan) {
    shopPlan = await prisma.shopPlan.create({
      data: {
        shop,
        planName: "FREE",
        billingStatus: "free",
      },
    });
  }

  return shopPlan;
}

export function getPlanLimits(planName: string) {
  const limits = PLAN_LIMITS[planName as PlanName];
  if (!limits) {
    return PLAN_LIMITS.FREE; // Default to free if unknown plan
  }
  return limits;
}

export async function canUseFeature(shop: string, featureType: "bulkAudit") {
  const shopPlan = await getOrCreateShopPlan(shop);
  const limits = getPlanLimits(shopPlan.planName);

  if (featureType === "bulkAudit") {
    return limits.bulkAudit;
  }
  
  return false;
}
