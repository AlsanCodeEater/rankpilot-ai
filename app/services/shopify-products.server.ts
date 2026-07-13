import prisma from "../db.server";
import { checkUsageLimit } from "./usage.server";

const GET_PRODUCTS_QUERY = `#graphql
  query GetProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        handle
        descriptionHtml
        vendor
        productType
        tags
        status
        totalInventory
        seo {
          title
          description
        }
        featuredImage {
          url
        }
      }
    }
  }
`;

export async function syncShopifyProducts(admin: any, shop: string) {
  const response = await admin.graphql(GET_PRODUCTS_QUERY, {
    variables: { first: 250 }, // Fetch more to allow higher limits to work
  });

  const result = await response.json();
  let products = result.data?.products?.nodes || [];

  // Enforce Product Sync Limits
  const usageCheck = await checkUsageLimit(shop, "product_sync");
  let warning: string | undefined;

  if (products.length > usageCheck.limit) {
    products = products.slice(0, usageCheck.limit);
    warning = `Plan limits allow ${usageCheck.limit} products. Upgrade to sync more.`;
  }

  let syncedCount = 0;

  for (const p of products) {
    const tagsStr = p.tags ? p.tags.join(", ") : null;
    const uniqueId = { shop_shopifyProductId: { shop, shopifyProductId: p.id } };

    await prisma.productSnapshot.upsert({
      where: uniqueId,
      create: {
        shop,
        shopifyProductId: p.id,
        title: p.title,
        handle: p.handle,
        description: p.descriptionHtml,
        vendor: p.vendor,
        productType: p.productType,
        tags: tagsStr,
        status: p.status,
        totalInventory: p.totalInventory || 0,
        seoTitle: p.seo?.title,
        seoDescription: p.seo?.description,
        imageUrl: p.featuredImage?.url,
      },
      update: {
        title: p.title,
        handle: p.handle,
        description: p.descriptionHtml,
        vendor: p.vendor,
        productType: p.productType,
        tags: tagsStr,
        status: p.status,
        totalInventory: p.totalInventory || 0,
        seoTitle: p.seo?.title,
        seoDescription: p.seo?.description,
        imageUrl: p.featuredImage?.url,
        lastScannedAt: new Date(),
      },
    });

    syncedCount++;
  }

  return {
    fetched: result.data?.products?.nodes?.length || 0,
    synced: syncedCount,
    shop,
    warning,
  };
}
