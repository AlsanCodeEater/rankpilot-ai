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
  const { shop, topic } = await authenticate.webhook(request);

  logger.info(`Received ${topic} webhook for ${shop}`);
  console.log("Queued uninstall cleanup", { shop });

  setImmediate(() => {
    cleanupShopAfterUninstall(shop).catch((error) => {
      logger.error("Background uninstall cleanup failed", { shop, error });
    });
  });

  return new Response("OK", { status: 200 });
};
