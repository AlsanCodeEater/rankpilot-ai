import {register} from "@shopify/web-pixels-extension";

register(({analytics, settings}) => {
  const endpoint = settings.endpoint as string;
  const shop = settings.shop as string;
  const secret = settings.secret as string;

  if (!endpoint || !shop || !secret) {
    console.warn("[RankPilot] Web Pixel missing required settings.");
    return;
  }

  function sendEvent(eventName: string, event: any) {
    // Extract IDs - using optional chaining to prevent crashes
    const productId = event?.data?.productVariant?.product?.id || event?.data?.product?.id || null;
    const collectionId = event?.data?.collection?.id || null;
    const searchQuery = event?.data?.searchResult?.query || null;

    const payload = {
      shop,
      secret,
      eventName,
      timestamp: new Date().toISOString(),
      productId,
      collectionId,
      searchQuery
    };

    fetch(endpoint, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).catch(err => console.error("[RankPilot] Failed to send pixel event", err));
  }

  // Subscribe to discovery events
  analytics.subscribe("product_viewed", (event) => sendEvent("product_viewed", event));
  analytics.subscribe("collection_viewed", (event) => sendEvent("collection_viewed", event));
  analytics.subscribe("search_submitted", (event) => sendEvent("search_submitted", event));
  analytics.subscribe("product_added_to_cart", (event) => sendEvent("product_added_to_cart", event));
  analytics.subscribe("checkout_started", (event) => sendEvent("checkout_started", event));
});
