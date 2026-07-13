import { json, type ActionFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";
import { getPixelInstall, validatePixelRequest } from "../services/pixel.server";

// Public endpoint, so we don't use authenticate.admin
export const action = async ({ request }: ActionFunctionArgs) => {
  // We only support POST
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // Handle preflight CORS if needed
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const payload = await request.json();
    const { shop, secret, eventName, timestamp, productId, collectionId, searchQuery } = payload;

    if (!shop || !secret || !eventName || !timestamp) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    const pixelInstall = await getPixelInstall(shop);
    
    if (!pixelInstall || pixelInstall.status !== "active") {
      return json({ error: "Pixel not active for this shop" }, { status: 403 });
    }

    if (!validatePixelRequest(secret, pixelInstall.secretHash)) {
      return json({ error: "Invalid secret" }, { status: 401 });
    }

    const eventDate = new Date(timestamp);
    const dateKey = eventDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Clean up IDs to extract just the numeric part or full GID if it's a GID
    // Let's store whatever the pixel sends, but typically we want the Shopify DB ID
    let rawProductId = productId;
    if (productId && productId.includes('gid://shopify/Product/')) {
      rawProductId = productId.split('/').pop();
    }

    // 1. Store the raw event
    await prisma.storeEvent.create({
      data: {
        shop,
        eventName,
        productId: rawProductId,
        collectionId,
        searchQuery,
        eventDate,
      }
    });

    // 2. Update aggregates if there's a productId
    if (rawProductId) {
      const isProductView = eventName === "product_viewed";
      const isAddToCart = eventName === "product_added_to_cart";
      const isSearch = eventName === "search_submitted";
      const isCollection = eventName === "collection_viewed";
      const isCheckout = eventName === "checkout_started";

      await prisma.productAnalyticsDaily.upsert({
        where: {
          shop_productId_dateKey: {
            shop,
            productId: rawProductId,
            dateKey
          }
        },
        update: {
          productViews: { increment: isProductView ? 1 : 0 },
          addToCarts: { increment: isAddToCart ? 1 : 0 },
          searchHits: { increment: isSearch ? 1 : 0 },
          collectionHits: { increment: isCollection ? 1 : 0 },
          checkoutStarts: { increment: isCheckout ? 1 : 0 },
        },
        create: {
          shop,
          productId: rawProductId,
          dateKey,
          productViews: isProductView ? 1 : 0,
          addToCarts: isAddToCart ? 1 : 0,
          searchHits: isSearch ? 1 : 0,
          collectionHits: isCollection ? 1 : 0,
          checkoutStarts: isCheckout ? 1 : 0,
        }
      });
    }

    // Must return CORS headers so the browser allows the fetch
    return json({ success: true }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
  } catch (error) {
    // Fail silently to avoid exposing stack traces to the storefront
    console.error("Pixel collect error:", error);
    return json({ success: false }, { 
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
};
