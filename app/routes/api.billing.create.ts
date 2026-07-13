import { json, type ActionFunctionArgs } from "@remix-run/node";
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
    return json({ error: "Cannot create paid subscription for FREE plan" }, { status: 400 });
  }

  const price = PLAN_LIMITS[planName].monthlyPrice;
  const returnUrl = `${process.env.SHOPIFY_APP_URL}/app/billing`;

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

    // Optionally save the intent in our database if needed, but for now we just return the URL
    // so the merchant can approve it. After approval, they return to returnUrl.
    return json({
      success: true,
      confirmationUrl: data.confirmationUrl,
    });
  } catch (error) {
    console.error("Billing mutation error:", error);
    return json({ error: "Failed to create subscription due to internal error" }, { status: 500 });
  }
};
