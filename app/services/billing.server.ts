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
