/**
 * v2-engine: rollback. An applied suggestion stores its oldValue, so revert
 * writes that original back to Shopify and the local snapshot.
 */
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import prisma from "../db.server";
import { recalculateProductScore } from "./suggestions.server";

const UPDATE_PRODUCT = `#graphql
  mutation RevertProductField($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id }
      userErrors { field message }
    }
  }
`;

async function runUpdate(admin: AdminApiContext, input: Record<string, unknown>) {
  const response = await admin.graphql(UPDATE_PRODUCT, { variables: { input } });
  const result = await response.json();
  const errors = result.data?.productUpdate?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(`Shopify error: ${errors.map((e: { message: string }) => e.message).join(", ")}`);
  }
}

export async function revertSuggestion(admin: AdminApiContext, shop: string, suggestionId: string) {
  const suggestion = await prisma.aiSuggestion.findUnique({
    where: { id: suggestionId },
    include: { productSnapshot: true },
  });

  if (!suggestion) throw new Error("Suggestion not found");
  if (suggestion.shop !== shop) throw new Error("Suggestion does not belong to this shop");
  if (suggestion.status !== "applied") throw new Error("Only applied suggestions can be reverted");
  if (!suggestion.productSnapshot) throw new Error("No product linked to this suggestion");
  if (suggestion.oldValue == null) throw new Error("No original value stored for this suggestion");

  const gid = `gid://shopify/Product/${suggestion.productSnapshot.shopifyProductId}`;
  const oldValue = suggestion.oldValue;
  const snapshotData: Record<string, unknown> = {};

  switch (suggestion.suggestionType) {
    case "rewrite_title":
    case "improve_title":
      await runUpdate(admin, { id: gid, title: oldValue });
      snapshotData.title = oldValue;
      break;
    case "improve_description":
      await runUpdate(admin, { id: gid, descriptionHtml: oldValue });
      snapshotData.bodyHtml = oldValue;
      break;
    case "add_tags":
    case "improve_tags": {
      const tags = oldValue.split(",").map((t: string) => t.trim()).filter(Boolean);
      await runUpdate(admin, { id: gid, tags });
      snapshotData.tags = tags.join(", ");
      break;
    }
    case "improve_seo_title":
      await runUpdate(admin, { id: gid, seo: { title: oldValue } });
      snapshotData.seoTitle = oldValue;
      break;
    case "improve_seo_description":
      await runUpdate(admin, { id: gid, seo: { description: oldValue } });
      snapshotData.seoDescription = oldValue;
      break;
    default:
      throw new Error(`Suggestion type "${suggestion.suggestionType}" cannot be reverted`);
  }

  await prisma.productSnapshot.update({
    where: { id: suggestion.productSnapshot.id },
    data: snapshotData,
  });

  await prisma.aiSuggestion.update({
    where: { id: suggestionId },
    data: { status: "reverted" },
  });

  await recalculateProductScore(suggestion.productSnapshotId);

  return { success: true, status: "reverted", message: "Original content restored" };
}
