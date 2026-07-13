import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { isAppOwnerShop, createBetaMerchant } from "../services/beta.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  if (!isAppOwnerShop(session.shop)) {
    return json({ success: false, error: "Access denied" }, { status: 403 });
  }

  const formData = await request.formData();
  let shop = formData.get("shop") as string;
  const email = formData.get("email") as string;
  const storeName = formData.get("storeName") as string;
  const niche = formData.get("niche") as string;
  const productCountEstimate = formData.get("productCountEstimate") ? parseInt(formData.get("productCountEstimate") as string) : undefined;
  const betaDurationDays = formData.get("betaDurationDays") ? parseInt(formData.get("betaDurationDays") as string) : 14;
  const notes = formData.get("notes") as string;

  if (!shop) {
    return json({ success: false, error: "Shop is required" }, { status: 400 });
  }

  shop = shop.toLowerCase().trim();
  if (shop.startsWith("https://")) shop = shop.replace("https://", "");
  if (shop.endsWith("/")) shop = shop.slice(0, -1);
  if (!shop.endsWith(".myshopify.com")) {
    return json({ success: false, error: "Must be a valid .myshopify.com domain" }, { status: 400 });
  }

  await createBetaMerchant({
    shop,
    email,
    storeName,
    niche,
    productCountEstimate,
    betaDurationDays,
    notes,
  });

  return json({
    success: true,
    message: "Beta merchant created",
    shop,
  });
};
