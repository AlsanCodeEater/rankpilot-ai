import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { activateWebPixel } from "../services/pixel.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { session, admin } = await authenticate.admin(request);

  try {
    const result = await activateWebPixel(admin, session.shop);
    return json(result);
  } catch (error: any) {
    console.error("Web Pixel activation error:", error);
    return json({ error: error.message || "Failed to activate pixel" }, { status: 500 });
  }
};
