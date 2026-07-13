import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { logger } from "../services/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);
  
  logger.info(`Received ${topic} webhook for ${shop}`, { payload });

  // RankPilot AI does not store customer personal data, so there is nothing to delete.
  return new Response();
};
