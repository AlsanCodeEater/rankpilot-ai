import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { logger } from "../services/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);
  
  logger.info(`Received ${topic} webhook for ${shop}`, { payload });

  // 48 hours after a store uninstalls your app, Shopify will send a shop/redact webhook.
  // We should delete store configurations. We do not delete ProductAnalyticsDaily if we want to retain anonymous aggregated data, 
  // but we can delete products, settings, and secrets.
  
  await db.shopSettings.deleteMany({ where: { shopDomain: shop } });
  
  // Wipe pixel data entirely
  await db.pixelInstall.deleteMany({ where: { shop } });
  
  // Wipe session if any remain
  await db.session.deleteMany({ where: { shop } });

  // Note: We leave ProductSnapshot and Analytics data untouched to preserve aggregate AI performance history, 
  // but you can adjust this if needed by deleting them as well.

  return new Response();
};
