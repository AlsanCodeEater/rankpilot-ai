import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { recalculateProductScore } from "../services/suggestions.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);
  
  // Security guard: only allow the app owner shop
  if (process.env.APP_OWNER_SHOP && session.shop !== process.env.APP_OWNER_SHOP) {
    return json({ error: "Unauthorized. App owner only." }, { status: 403 });
  }

  try {
    // Find all suggestions containing [Brand Name], [Brand], [Product Name], or {{
    const badSuggestions = await prisma.aiSuggestion.findMany({
      where: {
        shop: session.shop,
        status: { in: ["pending", "approved"] },
        OR: [
          { newValue: { contains: "[Brand Name]" } },
          { newValue: { contains: "[Brand]" } },
          { newValue: { contains: "[Product Name]" } },
          { newValue: { contains: "{{" } },
        ]
      }
    });

    let rejectedCount = 0;
    const affectedProducts = new Set<string>();
    
    for (const suggestion of badSuggestions) {
      await prisma.aiSuggestion.update({
        where: { id: suggestion.id },
        data: { status: "rejected" }
      });
      rejectedCount++;
      affectedProducts.add(suggestion.productSnapshotId);
    }

    // Recalculate AI score for affected products
    for (const productId of affectedProducts) {
      await recalculateProductScore(productId);
    }

    return json({
      success: true,
      message: `Cleaned up! Rejected ${rejectedCount} bad suggestions containing placeholders across ${affectedProducts.size} products.`,
      rejectedCount,
      affectedProducts: Array.from(affectedProducts),
    });
  } catch (error: any) {
    return json({ error: error.message || "Failed to clean placeholders" }, { status: 500 });
  }
};
