import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { logger } from "../services/logger.server";

async function cleanupShopData(shop: string) {
  try {
    // Child records first
    await db.aiSuggestion.deleteMany({ where: { shop } });
    await db.productAnalyticsDaily.deleteMany({ where: { shop } });
    await db.storeEvent.deleteMany({ where: { shop } });
    await db.usageRecord.deleteMany({ where: { shop } });

    // Parent/isolated records
    await db.productSnapshot.deleteMany({ where: { shop } });
    await db.collectionSnapshot.deleteMany({ where: { shop } });
    await db.pixelInstall.deleteMany({ where: { shop } });
    await db.shopSettings.deleteMany({ where: { shopDomain: shop } });
    await db.shopPlan.deleteMany({ where: { shop } });
    await db.session.deleteMany({ where: { shop } });
    
    // Update beta merchant status if it exists
    await db.betaMerchant.updateMany({
      where: { shop },
      data: { status: "uninstalled" }
    });

    // Finally delete the shop record
    await db.shop.deleteMany({ where: { shopDomain: shop } });
  } catch (error) {
    logger.error("Shop redact cleanup failed", { shop, error });
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  console.time("shop-redact-response");
  let shop: string;
  let topic: string;

  try {
    const result = await authenticate.webhook(request);
    shop = result.shop;
    topic = result.topic;
  } catch (error) {
    console.error("Invalid shop/redact webhook", error);
    console.timeEnd("shop-redact-response");
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("shop/redact received", { shop });
  logger.info(`Received ${topic} webhook for ${shop}`);

  setTimeout(() => {
    cleanupShopData(shop).catch((error) => {
      logger.error("Background shop redact cleanup failed", { shop, error });
    });
  }, 0);

  console.timeEnd("shop-redact-response");
  return new Response("OK", { status: 200 });
};
