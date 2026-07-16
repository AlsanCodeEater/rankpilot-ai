import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { logger } from "../services/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);
  
  logger.info(`Received ${topic} webhook for ${shop}`, { payload });

  // We should delete store configurations and all shop data
  
  await db.aiSuggestion.deleteMany({ where: { shop } });
  await db.productSnapshot.deleteMany({ where: { shop } });
  await db.collectionSnapshot.deleteMany({ where: { shop } });
  await db.usageRecord.deleteMany({ where: { shopDomain: shop } });
  await db.storeEvent.deleteMany({ where: { shop } });
  await db.productAnalyticsDaily.deleteMany({ where: { shop } });
  
  await db.shopSettings.deleteMany({ where: { shopDomain: shop } });
  await db.pixelInstall.deleteMany({ where: { shop } });
  await db.session.deleteMany({ where: { shop } });
  
  await db.betaMerchant.deleteMany({ where: { shopDomain: shop } });
  await db.shopPlan.deleteMany({ where: { shop } });
  await db.shop.deleteMany({ where: { shopDomain: shop } });

  return new Response();
};
