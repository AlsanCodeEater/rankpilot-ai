import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { logger } from "../services/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  let shop: string;
  let topic: string;
  let payload: any;

  try {
    const result = await authenticate.webhook(request);
    shop = result.shop;
    topic = result.topic;
    payload = result.payload;
  } catch (error) {
    console.error("Invalid customers/data_request webhook", error);
    return new Response("Unauthorized", { status: 401 });
  }

  setTimeout(() => {
    logger.info(`Received ${topic} webhook for ${shop}`, { payload });
    // RankPilot AI does not store customer personal data, so there is nothing to provide.
  }, 0);

  return new Response("OK", { status: 200 });
};
