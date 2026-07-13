import prisma from "../db.server";
import { auditProductWithAI } from "./ai-audit.server";

// --- Public API ---


export async function runAiAnalysis(shopDomain: string) {
  // The API key is now securely managed via environment variables in ai-provider.server.ts

  // Get shop
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shop) {
    throw new Error("Shop not found. Please sync products first.");
  }

  // Get products to analyze (limited by AI_AUDIT_LIMIT)
  const auditLimit = parseInt(process.env.AI_AUDIT_LIMIT || "20", 10);
  const products = await prisma.productSnapshot.findMany({
    where: { shop: shopDomain },
    orderBy: { updatedAt: "desc" },
    take: auditLimit,
  });

  if (products.length === 0) {
    throw new Error("No products found. Please sync products first.");
  }

  let totalAnalyzed = 0;
  let totalSuggestions = 0;
  const errors: string[] = [];

  for (const product of products) {
    try {
      const result = await auditProductWithAI(product);

      // Update product quality score
      await prisma.productSnapshot.update({
        where: { id: product.id },
        data: {
          aiScore: result.score,
        },
      });

      // Clear old pending suggestions
      await prisma.aiSuggestion.deleteMany({
        where: {
          productSnapshotId: product.id,
          status: "pending",
        },
      });

      // Save new suggestions
      for (const suggestion of result.suggestions) {
        await prisma.aiSuggestion.create({
          data: {
            shop: shopDomain,
            productSnapshotId: product.id,
            shopifyProductId: product.shopifyProductId,
            suggestionType: suggestion.type,
            issue: suggestion.issue,
            reason: suggestion.reason,
            oldValue: suggestion.oldValue || null,
            newValue: suggestion.newValue || null,
            confidenceScore: suggestion.confidenceScore,
            status: "pending",
          },
        });
        totalSuggestions++;
      }

      totalAnalyzed++;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`Product "${product.title}": ${message}`);
      console.error(`AI analysis failed for product ${product.id}:`, error);
    }
  }

  return {
    totalAnalyzed,
    totalProducts: products.length,
    totalSuggestions,
    errors,
  };
}

export async function getShopSettings(shopDomain: string) {
  return prisma.shopSettings.findUnique({
    where: { shopDomain },
  });
}

export async function saveShopSettings(
  shopDomain: string,
  data: {
    aiProvider: string;
    aiApiKey: string;
    aiModel: string;
    syncFrequency: string;
  },
) {
  return prisma.shopSettings.upsert({
    where: { shopDomain },
    update: {
      aiProvider: data.aiProvider,
      aiApiKey: data.aiApiKey,
      aiModel: data.aiModel,
      syncFrequency: data.syncFrequency,
    },
    create: {
      shopDomain,
      aiProvider: data.aiProvider,
      aiApiKey: data.aiApiKey,
      aiModel: data.aiModel,
      syncFrequency: data.syncFrequency,
    },
  });
}
