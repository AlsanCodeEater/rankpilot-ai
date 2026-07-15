import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  console.time("api.dashboard.stats");

  const [
    totalProducts,
    productAggregates,
    lowScoreProducts,
    pendingSuggestions,
    suggestionsApplied,
    shopRecord,
  ] = await Promise.all([
    prisma.productSnapshot.count({ where: { shop } }),
    prisma.productSnapshot.aggregate({
      where: { shop, aiScore: { not: null } },
      _avg: { aiScore: true },
      _sum: { issueCount: true },
    }),
    prisma.productSnapshot.count({ where: { shop, aiScore: { lt: 60 } } }),
    prisma.aiSuggestion.count({ where: { shop, status: "pending" } }),
    prisma.aiSuggestion.count({ where: { shop, status: "applied" } }),
    prisma.shop.findUnique({ where: { shopDomain: shop } }),
  ]);

  const stats = {
    totalProducts,
    issuesFound: productAggregates._sum.issueCount ?? 0,
    pendingSuggestions,
    suggestionsApplied,
    averageScore: productAggregates._avg.aiScore ?? 0,
    lowScoreProducts,
    lastSyncAt: shopRecord?.lastSyncAt ?? null,
  };

  console.timeEnd("api.dashboard.stats");

  return json({ stats });
};
