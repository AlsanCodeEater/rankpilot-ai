import type { AdminApiContext } from "@shopify/shopify-app-remix/server";
import prisma from "../db.server";

const PRODUCTS_QUERY = `#graphql
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          vendor
          productType
          tags
          status
          bodyHtml
          totalInventory
          variantsCount {
            count
          }
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
        }
      }
    }
  }
`;

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: string;
  bodyHtml: string | null;
  totalInventory: number;
  variantsCount: { count: number };
  featuredMedia: {
    preview: {
      image: {
        url: string;
      };
    };
  } | null;
}

const COLLECTIONS_QUERY = `#graphql
  query GetCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          descriptionHtml
          sortOrder
          productsCount {
            count
          }
          image {
            url
          }
        }
      }
    }
  }
`;

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string | null;
  sortOrder: string;
  productsCount: { count: number };
  image: {
    url: string;
  } | null;
}

function extractGid(gid: string): string {
  // "gid://shopify/Product/123456" -> "123456"
  return gid.split("/").pop() || gid;
}

export async function getOrCreateShop(shopDomain: string) {
  return prisma.shop.upsert({
    where: { shopDomain },
    update: { updatedAt: new Date() },
    create: { shopDomain },
  });
}

export async function syncProducts(
  admin: AdminApiContext,
  shopDomain: string,
) {
  const shop = await getOrCreateShop(shopDomain);

  let hasNextPage = true;
  let cursor: string | null = null;
  let totalSynced = 0;

  while (hasNextPage) {
    const response = await admin.graphql(PRODUCTS_QUERY, {
      variables: {
        first: 50,
        after: cursor,
      },
    });

    const data = await response.json();
    const products = data.data?.products;

    if (!products) break;

    const edges = products.edges as Array<{ node: ShopifyProduct }>;

    for (const { node: product } of edges) {
      const shopifyProductId = extractGid(product.id);
      const imageUrl =
        product.featuredMedia?.preview?.image?.url || null;

      await prisma.productSnapshot.upsert({
        where: {
          shop_shopifyProductId: {
            shop: shopDomain,
            shopifyProductId,
          },
        },
        update: {
          title: product.title,
          handle: product.handle,
          vendor: product.vendor,
          productType: product.productType,
          tags: product.tags.join(", "),
          status: product.status,
          bodyHtml: product.bodyHtml,
          imageUrl,
          totalInventory: product.totalInventory ?? 0,
          variantsCount: product.variantsCount?.count ?? 0,
          lastSyncAt: new Date(),
        },
        create: {
          shop: shopDomain,
          shopifyProductId,
          title: product.title,
          handle: product.handle,
          vendor: product.vendor,
          productType: product.productType,
          tags: product.tags.join(", "),
          status: product.status,
          bodyHtml: product.bodyHtml,
          imageUrl,
          totalInventory: product.totalInventory ?? 0,
          variantsCount: product.variantsCount?.count ?? 0,
        },
      });

      totalSynced++;
    }

    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
  }

  // Sync collections
  const totalCollectionsSynced = await syncCollections(admin, shopDomain);

  // Update shop last sync time
  await prisma.shop.update({
    where: { id: shop.id },
    data: { lastSyncAt: new Date() },
  });

  return { totalSynced, totalCollectionsSynced, shopId: shop.id };
}

export async function syncCollections(
  admin: AdminApiContext,
  shop: string,
) {
  let hasNextPage = true;
  let cursor: string | null = null;
  let totalSynced = 0;

  while (hasNextPage) {
    const response = await admin.graphql(COLLECTIONS_QUERY, {
      variables: {
        first: 50,
        after: cursor,
      },
    });

    const data = await response.json();
    const collections = data.data?.collections;

    if (!collections) break;

    const edges = collections.edges as Array<{ node: ShopifyCollection }>;

    for (const { node: collection } of edges) {
      const shopifyCollectionId = extractGid(collection.id);
      const imageUrl = collection.image?.url || null;

      await prisma.collectionSnapshot.upsert({
        where: {
          shop_shopifyCollectionId: {
            shop,
            shopifyCollectionId,
          },
        },
        update: {
          title: collection.title,
          handle: collection.handle,
          bodyHtml: collection.descriptionHtml,
          sortOrder: collection.sortOrder,
          productsCount: collection.productsCount?.count ?? 0,
          imageUrl,
          lastSyncAt: new Date(),
        },
        create: {
          shop,
          shopifyCollectionId,
          title: collection.title,
          handle: collection.handle,
          bodyHtml: collection.descriptionHtml,
          sortOrder: collection.sortOrder,
          productsCount: collection.productsCount?.count ?? 0,
          imageUrl,
        },
      });

      totalSynced++;
    }

    hasNextPage = collections.pageInfo.hasNextPage;
    cursor = collections.pageInfo.endCursor;
  }

  return totalSynced;
}

export async function getProductSnapshots(shopDomain: string) {
  return prisma.productSnapshot.findMany({
    where: { shop: shopDomain },
    orderBy: { aiScore: "asc" },
    include: {
      _count: {
        select: { suggestions: true },
      },
    },
  });
}

export async function getShopStats(shopDomain: string) {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
  });

  if (!shop)
    return {
      totalProducts: 0,
      issuesFound: 0,
      suggestionsApplied: 0,
      avgQualityScore: 0,
      lastSyncAt: null,
    };

  const totalProducts = await prisma.productSnapshot.count({
    where: { shop: shopDomain },
  });

  const issuesFound = await prisma.aiSuggestion.count({
    where: { shop: shopDomain },
  });

  const suggestionsApplied = await prisma.aiSuggestion.count({
    where: { shop: shopDomain, status: "applied" },
  });

  const avgResult = await prisma.productSnapshot.aggregate({
    where: { shop: shopDomain, aiScore: { not: null } },
    _avg: { aiScore: true },
  });

  return {
    totalProducts,
    issuesFound,
    suggestionsApplied,
    avgQualityScore: avgResult._avg.aiScore ?? 0,
    lastSyncAt: shop.lastSyncAt,
  };
}
