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
    const products = await prisma.productSnapshot.findMany({
      where: { shop: session.shop },
      select: { id: true, aiScore: true }
    });

    let updatedCount = 0;
    
    for (const product of products) {
      await recalculateProductScore(product.id, product.aiScore || undefined);
      updatedCount++;
    }

    return json({
      success: true,
      message: `Successfully recalculated issue counts and scores for ${updatedCount} products.`,
    });
  } catch (error: any) {
    return json({ error: error.message || "Failed to recalculate" }, { status: 500 });
  }
};
