import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PLAN_LIMITS, type PlanName } from "../services/plans.server";
import prisma from "../db.server";

const APP_SUBSCRIPTION_CREATE = `#graphql
  mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean) {
    appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
      userErrors {
        field
        message
      }
      appSubscription {
        id
        status
      }
      confirmationUrl
    }
  }
`;

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const planName = formData.get("planName") as PlanName;

  if (!planName || !PLAN_LIMITS[planName]) {
    return json({ error: "Invalid plan name" }, { status: 400 });
  }

  if (planName === "FREE") {
    await prisma.shopPlan.upsert({
      where: { shop: session.shop },
      create: { shop: session.shop, planName: "FREE", billingStatus: "free" },
      update: { planName: "FREE", billingStatus: "free" },
    });
    return redirect(`/app/billing?plan=free&changed=1`);
  }

  const price = PLAN_LIMITS[planName].monthlyPrice;
  const returnUrl = `${process.env.SHOPIFY_APP_URL}/app/billing?billing=success&planName=${planName}`;

  const variables = {
    name: `RankPilot AI ${planName}`,
    returnUrl,
    test: true, // Keep true for development
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: price,
              currencyCode: "USD",
            },
            interval: "EVERY_30_DAYS",
          },
        },
      },
    ],
  };

  try {
    const response = await admin.graphql(APP_SUBSCRIPTION_CREATE, {
      variables,
    });

    const result = await response.json();
    const data = result.data?.appSubscriptionCreate;

    if (data?.userErrors?.length > 0) {
      console.error("Billing mutation userErrors:", data.userErrors);
      return json({ error: "Failed to create subscription" }, { status: 400 });
    }

    if (!data?.confirmationUrl) {
      return json({ error: "No confirmation URL returned from Shopify" }, { status: 500 });
    }

    return redirect(data.confirmationUrl);
  } catch (error) {
    console.error("Billing mutation error:", error);
    return json({ error: "Failed to create subscription due to internal error" }, { status: 500 });
  }
};
