import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { logger } from "../services/logger.server";

async function cleanupShopAfterUninstall(shop: string) {
  try {
    await db.session.deleteMany({ where: { shop } });
    
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
    
    // Update beta merchant status if it exists
    await db.betaMerchant.updateMany({
      where: { shop },
      data: { status: "uninstalled" }
    });

    // Finally delete the shop record
    await db.shop.deleteMany({ where: { shopDomain: shop } });
  } catch (error) {
    logger.error("App uninstall cleanup failed", { shop, error });
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  let shop: string;
  let topic: string;

  try {
    const result = await authenticate.webhook(request);
    shop = result.shop;
    topic = result.topic;
  } catch (error) {
    console.error("Invalid app/uninstalled webhook", error);
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("Queued uninstall cleanup", { shop });
  logger.info(`Received ${topic} webhook for ${shop}`);

  setTimeout(() => {
    cleanupShopAfterUninstall(shop).catch((error) => {
      logger.error("Background uninstall cleanup failed", { shop, error });
    });
  }, 0);

  return new Response("OK", { status: 200 });
};
