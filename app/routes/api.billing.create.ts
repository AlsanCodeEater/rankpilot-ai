import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PLAN_LIMITS, type PlanName } from "../services/plans.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session, redirect: shopifyRedirect } = await authenticate.admin(request);
    const formData = await request.formData();
    const planName = String(formData.get("planName") || "");

    if (!planName) {
      return shopifyRedirect("/app/billing?billing_error=missing_plan");
    }

    const appHandle = process.env.SHOPIFY_APP_HANDLE;
    if (!appHandle) {
      console.error("SHOPIFY_APP_HANDLE missing");
      return shopifyRedirect("/app/billing?billing_error=missing_app_handle");
    }

    const storeHandle = session.shop.replace(".myshopify.com", "");
    const pricingUrl = `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`;

    throw shopifyRedirect(pricingUrl, { target: "_top" });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("Billing plan change failed", error);
    return redirect("/app/billing?billing_error=plan_change_failed");
  }
};
