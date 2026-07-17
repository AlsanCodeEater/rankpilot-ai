import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import prisma from "../db.server";

// --- GraphQL Mutation ---

const PRODUCT_UPDATE_MUTATION = `#graphql
  mutation ProductUpdate($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        title
        descriptionHtml
        tags
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// --- Get Suggestions ---

export async function getSuggestionsForShop(shop: string) {
  return prisma.aiSuggestion.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    include: {
      productSnapshot: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          tags: true,
          seoTitle: true,
          seoDescription: true,
          shopifyProductId: true,
        },
      },
    },
  });
}

// --- Approve ---

export async function approveSuggestion(shop: string, suggestionId: string) {
  const suggestion = await prisma.aiSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  if (suggestion.shop !== shop) {
    throw new Error("Suggestion does not belong to this shop");
  }

  if (suggestion.status !== "pending") {
    throw new Error(
      `Cannot approve suggestion with status "${suggestion.status}". Only pending suggestions can be approved.`,
    );
  }

  await prisma.aiSuggestion.update({
    where: { id: suggestionId },
    data: { status: "approved" },
  });

  return { success: true, status: "approved", message: "Suggestion approved" };
}

// --- Reject ---

export async function rejectSuggestion(shop: string, suggestionId: string) {
  const suggestion = await prisma.aiSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  if (suggestion.shop !== shop) {
    throw new Error("Suggestion does not belong to this shop");
  }

  if (suggestion.status !== "pending" && suggestion.status !== "approved") {
    throw new Error(
      `Cannot reject suggestion with status "${suggestion.status}". Only pending or approved suggestions can be rejected.`,
    );
  }

  await prisma.aiSuggestion.update({
    where: { id: suggestionId },
    data: { status: "rejected" },
  });

  return { success: true, status: "rejected", message: "Suggestion rejected" };
}

// --- Apply to Shopify ---

export async function applySuggestionToShopify(
  admin: AdminApiContext,
  shop: string,
  suggestionId: string,
) {
  // 1. Find suggestion with product snapshot
  const suggestion = await prisma.aiSuggestion.findUnique({
    where: { id: suggestionId },
    include: {
      productSnapshot: true,
    },
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  if (suggestion.shop !== shop) {
    throw new Error("Suggestion does not belong to this shop");
  }

  if (suggestion.status !== "approved") {
    throw new Error(
      `Cannot apply suggestion with status "${suggestion.status}". Only approved suggestions can be applied.`,
    );
  }

  if (!suggestion.productSnapshot) {
    throw new Error("No product linked to this suggestion");
  }

  // 2. Handle non-applicable types (informational only)
  if (
    suggestion.suggestionType === "inventory_warning" ||
    suggestion.suggestionType === "search_keyword_gap"
  ) {
    const errorMsg = "This suggestion type is informational and cannot be applied automatically.";
    await prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: "failed",
        errorMessage: errorMsg,
      },
    });
    return {
      success: false,
      error: errorMsg,
    };
  }

  if (!suggestion.newValue) {
    throw new Error("Suggestion has no new value to apply");
  }

  const product = suggestion.productSnapshot;
  const rawId = product.shopifyProductId;
  // Strip any existing prefixes and extract just the numeric ID to guarantee no double-prefix
  const numericId = rawId.split("/").pop() || rawId;
  const shopifyGid = `gid://shopify/Product/${numericId}`;

  // 3. Build product update input based on suggestion type
  const productInput: Record<string, unknown> = { id: shopifyGid };

  switch (suggestion.suggestionType) {
    case "rewrite_title": {
      productInput.title = suggestion.newValue;
      break;
    }

    case "improve_description": {
      productInput.descriptionHtml = suggestion.newValue;
      break;
    }

    case "add_tags": {
      // Merge existing tags with new tags (Shopify overwrites tags on update)
      const existingTags = product.tags
        ? product.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const newTags = suggestion.newValue
        ? suggestion.newValue
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const mergedTags = Array.from(new Set([...existingTags, ...newTags]));
      productInput.tags = mergedTags;
      break;
    }

    case "improve_seo_title": {
      productInput.seo = {
        title: suggestion.newValue,
      };
      break;
    }

    case "improve_seo_description": {
      productInput.seo = {
        description: suggestion.newValue,
      };
      break;
    }

    default: {
      // Unknown type — mark as failed
      await prisma.aiSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: "failed",
          errorMessage: `Unsupported suggestion type: ${suggestion.suggestionType}`,
        },
      });
      throw new Error(
        `Unsupported suggestion type: ${suggestion.suggestionType}`,
      );
    }
  }

  // 4. Execute Shopify GraphQL mutation
  try {
    const response = await admin.graphql(PRODUCT_UPDATE_MUTATION, {
      variables: { product: productInput },
    });

    const result = await response.json();
    const userErrors = result.data?.productUpdate?.userErrors || [];

    if (userErrors.length > 0) {
      const errorMsg = userErrors
        .map((e: { field: string[]; message: string }) => e.message)
        .join(", ");

      // Mark as failed with Shopify error
      await prisma.aiSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: "failed",
          errorMessage: errorMsg,
        },
      });

      return { success: false, error: `Shopify error: ${errorMsg}` };
    }

    // 5. Success — update suggestion status
    await prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: "applied",
        appliedAt: new Date(),
      },
    });

    // 6. Update local ProductSnapshot to reflect the change
    const snapshotUpdate: Record<string, unknown> = {};
    switch (suggestion.suggestionType) {
      case "rewrite_title":
        snapshotUpdate.title = suggestion.newValue;
        break;
      case "improve_description":
        snapshotUpdate.bodyHtml = suggestion.newValue;
        snapshotUpdate.description = suggestion.newValue;
        break;
      case "add_tags":
        snapshotUpdate.tags = (productInput.tags as string[]).join(", ");
        break;
      case "improve_seo_title":
        snapshotUpdate.seoTitle = suggestion.newValue;
        break;
      case "improve_seo_description":
        snapshotUpdate.seoDescription = suggestion.newValue;
        break;
    }

    // 7. Recalculate issueCount and aiScore based on remaining active suggestions
    const activeIssueCount = await prisma.aiSuggestion.count({
      where: {
        productSnapshotId: product.id,
        status: {
          in: ["pending", "approved", "failed"]
        }
      }
    });

    const nextScore =
      activeIssueCount === 0
        ? Math.max(product.aiScore || 0, 95)
        : Math.min(99, Math.max(product.aiScore || 50, 100 - activeIssueCount * 10));

    console.log("Suggestion apply result", {
      shop,
      suggestionId,
      productSnapshotId: product.id,
      oldIssueCount: product.issueCount,
      activeIssueCount,
      oldScore: product.aiScore,
      nextScore,
      suggestionType: suggestion.suggestionType
    });

    await prisma.productSnapshot.update({
      where: { id: product.id },
      data: {
        ...snapshotUpdate,
        issueCount: activeIssueCount,
        aiScore: nextScore,
        lastScannedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      status: "applied",
      message: "Suggestion applied to Shopify",
    };
  } catch (error) {
    // If the error is already a known response, rethrow it
    if (
      error instanceof Error &&
      (error.message.startsWith("Shopify error:") ||
        error.message.startsWith("Unsupported suggestion type:"))
    ) {
      throw error;
    }

    // Unexpected error — mark as failed
    const errorMsg =
      error instanceof Error ? error.message : "Unknown error";
    await prisma.aiSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: "failed",
        errorMessage: errorMsg,
      },
    });

    return { success: false, error: `Failed to apply suggestion: ${errorMsg}` };
  }
}
