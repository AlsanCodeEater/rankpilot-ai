import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    await authenticate.webhook(request);
  } catch (error) {
    console.error("Invalid customers/data_request webhook HMAC", error);
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response("OK", { status: 200 });
};
