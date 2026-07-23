import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { syncShopBillingPlan } from "../services/billing.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const plan = await syncShopBillingPlan(admin, session.shop);
    return json({ success: true, plan });
  } catch (error: any) {
    console.error("Manual billing sync failed", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
