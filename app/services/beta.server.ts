import prisma from "../db.server";
import { logger } from "./logger.server";

export function isAppOwnerShop(shop: string): boolean {
  if (!process.env.APP_OWNER_SHOP) return false;
  return shop.toLowerCase() === process.env.APP_OWNER_SHOP.toLowerCase();
}

export async function getBetaMerchants() {
  return prisma.betaMerchant.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function getBetaMerchantByShop(shop: string) {
  return prisma.betaMerchant.findUnique({ where: { shop } });
}

export async function createBetaMerchant(input: {
  shop: string;
  email?: string;
  storeName?: string;
  niche?: string;
  productCountEstimate?: number;
  betaDurationDays: number;
  notes?: string;
}) {
  const betaEndsAt = new Date();
  betaEndsAt.setDate(betaEndsAt.getDate() + input.betaDurationDays);

  return prisma.betaMerchant.upsert({
    where: { shop: input.shop },
    update: {
      email: input.email,
      storeName: input.storeName,
      niche: input.niche,
      productCountEstimate: input.productCountEstimate,
      notes: input.notes,
      betaEndsAt,
      status: "invited"
    },
    create: {
      shop: input.shop,
      email: input.email,
      storeName: input.storeName,
      niche: input.niche,
      productCountEstimate: input.productCountEstimate,
      notes: input.notes,
      betaEndsAt,
      status: "invited"
    }
  });
}

export async function activateBetaForShop(shop: string) {
  const merchant = await getBetaMerchantByShop(shop);
  if (!merchant) throw new Error("Beta merchant not found");

  await prisma.betaMerchant.update({
    where: { shop },
    data: { status: "active" }
  });

  await prisma.shopPlan.upsert({
    where: { shop },
    update: {
      planName: "BETA",
      billingStatus: "beta",
      trialEndsAt: merchant.betaEndsAt
    },
    create: {
      shop,
      planName: "BETA",
      billingStatus: "beta",
      trialEndsAt: merchant.betaEndsAt
    }
  });
  
  logger.info(`Activated BETA plan for ${shop}`);
}

export async function expireBetaForShop(shop: string) {
  await prisma.betaMerchant.update({
    where: { shop },
    data: { status: "expired" }
  });

  await prisma.shopPlan.update({
    where: { shop },
    data: {
      planName: "FREE",
      billingStatus: "free",
      trialEndsAt: null
    }
  });
  
  logger.info(`Expired BETA plan for ${shop}`);
}

export async function markFeedbackDone(shop: string) {
  await prisma.betaMerchant.update({
    where: { shop },
    data: { 
      status: "feedback_done",
      feedbackCollectedAt: new Date()
    }
  });
}

export async function applyBetaPlanIfEligible(shop: string) {
  const merchant = await getBetaMerchantByShop(shop);
  if (!merchant) return false;

  const now = new Date();
  if (merchant.betaEndsAt && merchant.betaEndsAt > now) {
    if (merchant.status === "invited") {
      await prisma.betaMerchant.update({
        where: { shop },
        data: { 
          status: "installed",
          installedAt: new Date()
        }
      });
    }

    await prisma.shopPlan.upsert({
      where: { shop },
      update: {
        planName: "BETA",
        billingStatus: "beta",
        trialEndsAt: merchant.betaEndsAt
      },
      create: {
        shop,
        planName: "BETA",
        billingStatus: "beta",
        trialEndsAt: merchant.betaEndsAt
      }
    });
    
    logger.info(`Auto-applied BETA plan for eligible shop ${shop}`);
    return true;
  } else if (merchant.betaEndsAt && merchant.betaEndsAt <= now && merchant.status !== "expired") {
    await prisma.betaMerchant.update({
      where: { shop },
      data: { status: "expired" }
    });
  }
  return false;
}

export async function checkAndExpireBetaIfNeeded(shop: string) {
  const shopPlan = await prisma.shopPlan.findUnique({ where: { shop } });
  
  if (shopPlan?.planName === "BETA" && shopPlan.trialEndsAt) {
    if (new Date() > shopPlan.trialEndsAt) {
      await expireBetaForShop(shop);
      return true;
    }
  }
  return false;
}
