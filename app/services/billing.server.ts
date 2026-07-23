import prisma from "../db.server";

export async function verifyActiveShopifySubscription(admin: any, expectedPlanHandle: string) {
  const query = `#graphql
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          test
          lineItems {
            plan {
              pricingDetails {
                __typename
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const result = await response.json();
    const subscriptions = result.data?.currentAppInstallation?.activeSubscriptions || [];

    const activeSub = subscriptions.find((sub: any) => sub.status === "ACTIVE" && sub.name.includes(expectedPlanHandle));

    if (activeSub) {
      return {
        active: true,
        subscriptionId: activeSub.id,
        planHandle: expectedPlanHandle,
        status: activeSub.status,
      };
    }

    return { active: false };
  } catch (error) {
    console.error("verifyActiveShopifySubscription error:", error);
    return { active: false };
  }
}

export async function cancelActiveShopifySubscription(admin: any) {
  const query = `#graphql
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const result = await response.json();
    const subscriptions = result.data?.currentAppInstallation?.activeSubscriptions || [];

    const activeSub = subscriptions.find((sub: any) => sub.status === "ACTIVE");

    if (activeSub) {
      const cancelMutation = `#graphql
        mutation AppSubscriptionCancel($id: ID!) {
          appSubscriptionCancel(id: $id) {
            appSubscription {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const cancelResponse = await admin.graphql(cancelMutation, {
        variables: { id: activeSub.id },
      });
      const cancelResult = await cancelResponse.json();

      if (cancelResult.data?.appSubscriptionCancel?.userErrors?.length > 0) {
        console.error("Cancel errors:", cancelResult.data.appSubscriptionCancel.userErrors);
        return { success: false, error: "Failed to cancel subscription" };
      }

      return { success: true };
    }

    // If no active subscription exists, canceling is technically successful (nothing to cancel)
    return { success: true };
  } catch (error) {
    console.error("cancelActiveShopifySubscription error:", error);
    return { success: false, error: "Internal error canceling subscription" };
  }
}

export async function syncShopBillingPlan(admin: any, shop: string) {
  const query = `#graphql
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          trialDays
          createdAt
          currentPeriodEnd
          lineItems {
            id
            plan {
              pricingDetails {
                __typename
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(query);
    const result = await response.json();
    const subscriptions = result.data?.currentAppInstallation?.activeSubscriptions || [];

    if (subscriptions.length === 0) {
      // Do not crash if currentAppInstallation.activeSubscriptions is empty.
      // E.g. Shopify App Pricing fallback. Keep local plan.
      const currentShopPlan = await prisma.shopPlan.findUnique({ where: { shop } });
      if (currentShopPlan) return currentShopPlan;
      return { planName: "FREE", billingStatus: "free" };
    }

    // Find the first active subscription
    const activeSub = subscriptions.find((sub: any) => sub.status === "ACTIVE");

    if (!activeSub) {
      // Handle the case where they cancelled or no active subscription
      const updatedPlan = await prisma.shopPlan.upsert({
        where: { shop },
        create: { shop, planName: "FREE", billingStatus: "free" },
        update: { planName: "FREE", billingStatus: "free", trialEndsAt: null, currentPeriodEnd: null },
      });
      return updatedPlan;
    }

    // Map Shopify plan to local plan handle
    const subName = activeSub.name.toUpperCase();
    let finalPlanHandle = "FREE";
    if (subName.includes("STARTER")) finalPlanHandle = "STARTER";
    else if (subName.includes("GROWTH")) finalPlanHandle = "GROWTH";
    else if (subName.includes("PRO")) finalPlanHandle = "PRO";
    else if (subName.includes("BETA")) finalPlanHandle = "BETA";
    else finalPlanHandle = activeSub.name; // fallback to raw name if doesn't match

    let finalBillingStatus = "active";
    let finalTrialEndsAt: Date | null = null;
    let finalCurrentPeriodEnd = activeSub.currentPeriodEnd ? new Date(activeSub.currentPeriodEnd) : null;

    // Determine Trial state
    if (activeSub.trialDays && activeSub.trialDays > 0 && activeSub.createdAt) {
      const createdAtDate = new Date(activeSub.createdAt);
      const trialEndDate = new Date(createdAtDate.getTime() + activeSub.trialDays * 24 * 60 * 60 * 1000);

      if (trialEndDate > new Date()) {
        finalBillingStatus = "trial";
        finalTrialEndsAt = trialEndDate;
      }
    }

    const updatedPlan = await prisma.shopPlan.upsert({
      where: { shop },
      create: {
        shop,
        planName: finalPlanHandle,
        billingStatus: finalBillingStatus,
        shopifySubscriptionId: activeSub.id,
        trialEndsAt: finalTrialEndsAt,
        currentPeriodEnd: finalCurrentPeriodEnd,
      },
      update: {
        planName: finalPlanHandle,
        billingStatus: finalBillingStatus,
        shopifySubscriptionId: activeSub.id,
        trialEndsAt: finalTrialEndsAt,
        currentPeriodEnd: finalCurrentPeriodEnd,
      },
    });

    return updatedPlan;
  } catch (error) {
    console.error("syncShopBillingPlan error:", error);
    const currentShopPlan = await prisma.shopPlan.findUnique({ where: { shop } });
    if (currentShopPlan) return currentShopPlan;
    return { planName: "FREE", billingStatus: "free" };
  }
}
