import prisma from "../db.server";

export async function getProductAnalyticsSummary(shop: string) {
  const result = await prisma.productAnalyticsDaily.aggregate({
    where: { shop },
    _sum: {
      productViews: true,
      addToCarts: true,
      searchHits: true,
      collectionHits: true,
      checkoutStarts: true,
    }
  });

  return {
    productViews: result._sum.productViews || 0,
    addToCarts: result._sum.addToCarts || 0,
    searchHits: result._sum.searchHits || 0,
    collectionHits: result._sum.collectionHits || 0,
    checkoutStarts: result._sum.checkoutStarts || 0,
  };
}

export async function getProductBeforeAfterImpact(shop: string) {
  // Get all products that have had suggestions applied
  const productsWithSuggestions = await prisma.productSnapshot.findMany({
    where: {
      shop,
      suggestions: {
        some: {
          status: "applied"
        }
      }
    },
    include: {
      suggestions: {
        where: { status: "applied" },
        orderBy: { appliedAt: 'asc' },
        take: 1
      }
    }
  });

  const impactData = [];

  for (const product of productsWithSuggestions) {
    if (!product.suggestions[0]?.appliedAt) continue;
    
    const appliedAt = product.suggestions[0].appliedAt;
    
    // Create Date objects for before/after windows (7 days)
    const sevenDaysBefore = new Date(appliedAt);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
    
    const sevenDaysAfter = new Date(appliedAt);
    sevenDaysAfter.setDate(sevenDaysAfter.getDate() + 7);

    // Get analytics before
    const beforeStats = await prisma.storeEvent.groupBy({
      by: ['eventName'],
      where: {
        shop,
        productId: product.id,
        eventDate: {
          gte: sevenDaysBefore,
          lt: appliedAt
        }
      },
      _count: true
    });

    // Get analytics after
    const afterStats = await prisma.storeEvent.groupBy({
      by: ['eventName'],
      where: {
        shop,
        productId: product.id,
        eventDate: {
          gte: appliedAt,
          lte: sevenDaysAfter
        }
      },
      _count: true
    });

    const getEventCount = (stats: any[], name: string) => 
      stats.find(s => s.eventName === name)?._count || 0;

    const viewsBefore = getEventCount(beforeStats, "product_viewed");
    const viewsAfter = getEventCount(afterStats, "product_viewed");
    const cartsBefore = getEventCount(beforeStats, "product_added_to_cart");
    const cartsAfter = getEventCount(afterStats, "product_added_to_cart");

    let improvement = 0;
    if (viewsBefore > 0 || viewsAfter > 0) {
      improvement = ((viewsAfter - viewsBefore) / Math.max(viewsBefore, 1)) * 100;
    }

    impactData.push({
      id: product.id,
      title: product.title,
      aiScore: product.aiScore,
      appliedDate: appliedAt.toISOString(),
      viewsBefore,
      viewsAfter,
      cartsBefore,
      cartsAfter,
      improvement: Math.round(improvement),
      status: product.status
    });
  }

  return impactData.sort((a, b) => b.improvement - a.improvement);
}

export async function getTopImprovedProducts(shop: string) {
  const impact = await getProductBeforeAfterImpact(shop);
  return impact.filter(p => p.improvement > 0).slice(0, 5);
}

export async function getLowEngagementProducts(shop: string) {
  // Products with high AI score but 0 or low views/carts in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const products = await prisma.productSnapshot.findMany({
    where: {
      shop,
      aiScore: { gte: 80 }
    }
  });

  const lowEngagement = [];

  for (const product of products) {
    const stats = await prisma.productAnalyticsDaily.aggregate({
      where: {
        shop,
        productId: product.id,
        createdAt: { gte: sevenDaysAgo }
      },
      _sum: {
        productViews: true,
        addToCarts: true
      }
    });

    const views = stats._sum.productViews || 0;
    if (views < 10) { // arbitrary threshold for "low engagement"
      lowEngagement.push({
        id: product.id,
        title: product.title,
        aiScore: product.aiScore,
        views
      });
    }
  }

  return lowEngagement.sort((a, b) => a.views - b.views).slice(0, 5);
}
