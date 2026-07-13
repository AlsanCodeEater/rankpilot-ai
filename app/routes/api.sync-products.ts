import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { syncShopifyProducts } from "../services/shopify-products.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    // 1. Authenticate admin request
    const { admin, session } = await authenticate.admin(request);
    
    // 3. Call syncShopifyProducts
    const result = await syncShopifyProducts(admin, session.shop);

    // 4. Return clean JSON
    return json({
      success: true,
      shop: result.shop,
      fetched: result.fetched,
      synced: result.synced,
      warning: result.warning,
      message: "Products synced successfully"
    });
  } catch (error: any) {
    console.error("Failed to sync products:", error);
    return json({ 
      success: false, 
      error: error.message || "Failed to sync products" 
    }, { status: 500 });
  }
};
