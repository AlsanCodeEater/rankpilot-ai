import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

async function cleanupShopData(shop: string) {
  try {
    await prisma.$transaction([
      prisma.aiSuggestion.deleteMany({ where: { shop } }),
      prisma.productAnalyticsDaily.deleteMany({ where: { shop } }),
      prisma.storeEvent.deleteMany({ where: { shop } }),
      prisma.usageRecord.deleteMany({ where: { shop } }),
      prisma.productSnapshot.deleteMany({ where: { shop } }),
      prisma.collectionSnapshot.deleteMany({ where: { shop } }),
      prisma.pixelInstall.deleteMany({ where: { shop } }),
      prisma.shopSettings.deleteMany({ where: { shopDomain: shop } }),
      prisma.shopPlan.deleteMany({ where: { shop } }),
      prisma.session.deleteMany({ where: { shop } }),
      prisma.betaMerchant.updateMany({
        where: { shop },
        data: { status: "uninstalled" }
      }),
      prisma.shop.deleteMany({ where: { shopDomain: shop } })
    ]);
  } catch (error) {
    console.error("shop/redact background cleanup failed", { shop, error });
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  let shop: string;

  try {
    const result = await authenticate.webhook(request);
    shop = result.shop;
  } catch (error) {
    console.error("Invalid shop/redact webhook HMAC", error);
    return new Response("Unauthorized", { status: 401 });
  }

  setTimeout(() => {
    cleanupShopData(shop).catch((error) => {
      console.error("shop/redact async cleanup crashed", { shop, error });
    });
  }, 0);

  return new Response("OK", { status: 200 });
};
