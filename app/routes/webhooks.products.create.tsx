/**
 * v2-engine autopilot: when a product is created, snapshot it locally so it
 * shows up in audits immediately. (Per-product auto-audit on creation can be
 * added here later; keeping webhook handlers fast and idempotent.)
 */
import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const settings = await prisma.shopSettings.findUnique({ where: { shopDomain: shop } });
  if (!settings?.autopilot) return new Response();

  const p = payload as {
    id?: number | string;
    title?: string;
    handle?: string;
    body_html?: string;
    vendor?: string;
    product_type?: string;
    tags?: string;
    status?: string;
  };
  if (!p.id) return new Response();
  const shopifyProductId = String(p.id);

  await prisma.productSnapshot.upsert({
    where: { shop_shopifyProductId: { shop, shopifyProductId } },
    create: {
      shop,
      shopifyProductId,
      title: p.title ?? "",
      handle: p.handle ?? null,
      bodyHtml: p.body_html ?? null,
      vendor: p.vendor ?? null,
      productType: p.product_type ?? null,
      tags: p.tags ?? null,
      status: p.status ?? null,
      lastSyncAt: new Date(),
    },
    update: {
      title: p.title ?? "",
      handle: p.handle ?? null,
      bodyHtml: p.body_html ?? null,
      vendor: p.vendor ?? null,
      productType: p.product_type ?? null,
      tags: p.tags ?? null,
      status: p.status ?? null,
      lastSyncAt: new Date(),
    },
  });

  return new Response();
};
