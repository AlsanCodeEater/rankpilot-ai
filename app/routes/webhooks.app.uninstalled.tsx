import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { logger } from "../services/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  logger.info(`Received ${topic} webhook for ${shop}`);

  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  // Mark pixel inactive and clear secrets
  await db.pixelInstall.updateMany({
    where: { shop },
    data: { status: "inactive", webPixelId: null, secretHash: "redacted" }
  });

  // Reset shop plan billing status
  await db.shopPlan.updateMany({
    where: { shop },
    data: { billingStatus: "uninstalled", shopifySubscriptionId: null }
  });

  return new Response();
};
