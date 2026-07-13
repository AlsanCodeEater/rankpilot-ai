import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import prisma from "../db.server";

const UPDATE_PRODUCT_TITLE = `#graphql
  mutation UpdateProductTitle($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_PRODUCT_TAGS = `#graphql
  mutation UpdateProductTags($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function applySuggestion(
  admin: AdminApiContext,
  suggestionId: string,
) {
  const suggestion = await prisma.aiSuggestion.findUnique({
    where: { id: suggestionId },
    include: {
      productSnapshot: true,
    },
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  if (suggestion.status !== "approved") {
    throw new Error("Suggestion must be approved before applying");
  }

  if (!suggestion.productSnapshot) {
    throw new Error("No product linked to this suggestion");
  }

  const shopifyProductId = `gid://shopify/Product/${suggestion.productSnapshot.shopifyProductId}`;

  if (!suggestion.newValue) {
    throw new Error("Suggestion has no new value to apply");
  }

  let mutationResult;

  switch (suggestion.suggestionType) {
    case "rewrite_title": {
      const response = await admin.graphql(UPDATE_PRODUCT_TITLE, {
        variables: {
          input: {
            id: shopifyProductId,
            title: suggestion.newValue,
          },
        },
      });
      mutationResult = await response.json();
      const titleErrors =
        mutationResult.data?.productUpdate?.userErrors || [];
      if (titleErrors.length > 0) {
        throw new Error(
          `Shopify error: ${titleErrors.map((e: { message: string }) => e.message).join(", ")}`,
        );
      }
      // Update local snapshot
      await prisma.productSnapshot.update({
        where: { id: suggestion.productSnapshot.id },
        data: { title: suggestion.newValue },
      });
      break;
    }

    case "add_tags": {
      // newValue should be comma-separated tags
      const newTags = suggestion.newValue
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const response = await admin.graphql(UPDATE_PRODUCT_TAGS, {
        variables: {
          input: {
            id: shopifyProductId,
            tags: newTags,
          },
        },
      });
      mutationResult = await response.json();
      const tagErrors =
        mutationResult.data?.productUpdate?.userErrors || [];
      if (tagErrors.length > 0) {
        throw new Error(
          `Shopify error: ${tagErrors.map((e: { message: string }) => e.message).join(", ")}`,
        );
      }
      // Update local snapshot
      await prisma.productSnapshot.update({
        where: { id: suggestion.productSnapshot.id },
        data: { tags: newTags.join(", ") },
      });
      break;
    }

    case "inventory_warning": {
      // Set product to DRAFT status
      const response = await admin.graphql(UPDATE_PRODUCT_TITLE, {
        variables: {
          input: {
            id: shopifyProductId,
            status: "DRAFT",
          },
        },
      });
      mutationResult = await response.json();
      const suppressErrors =
        mutationResult.data?.productUpdate?.userErrors || [];
      if (suppressErrors.length > 0) {
        throw new Error(
          `Shopify error: ${suppressErrors.map((e: { message: string }) => e.message).join(", ")}`,
        );
      }
      // Update local snapshot
      await prisma.productSnapshot.update({
        where: { id: suggestion.productSnapshot.id },
        data: { status: "DRAFT" },
      });
      break;
    }

    case "search_keyword_gap": {
      // For search keywords — store as metafield
      // This requires additional Shopify API setup, log for now
      console.log(
        `Metafield update for ${shopifyProductId}: ${suggestion.newValue}`,
      );
      break;
    }

    case "improve_seo_title": {
      console.log(
        `improve_seo_title for ${shopifyProductId}: ${suggestion.newValue}`,
      );
      break;
    }

    case "improve_seo_description": {
      console.log(
        `improve_seo_description for ${shopifyProductId}: ${suggestion.newValue}`,
      );
      break;
    }

    case "improve_description": {
      console.log(
        `improve_description for ${shopifyProductId}: ${suggestion.newValue}`,
      );
      break;
    }

    default:
      throw new Error(
        `Unsupported suggestion type: ${suggestion.suggestionType}`,
      );
  }

  // Increase quality score based on confidence (max +15 pts)
  const scoreBump = Math.round(suggestion.confidenceScore * 15); 
  const newScore = Math.min(100, (suggestion.productSnapshot.aiScore || 0) + scoreBump);

  // Update local snapshot score
  await prisma.productSnapshot.update({
    where: { id: suggestion.productSnapshot.id },
    data: { aiScore: newScore },
  });

  // Mark suggestion as applied
  await prisma.aiSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: "applied",
      appliedAt: new Date(),
    },
  });

  return { success: true, newScore };
}
