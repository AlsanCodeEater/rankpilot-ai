import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { isAppOwnerShop, markFeedbackDone } from "../services/beta.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  if (!isAppOwnerShop(session.shop)) {
    return json({ success: false, error: "Access denied" }, { status: 403 });
  }

  const formData = await request.formData();
  const shop = formData.get("shop") as string;

  if (!shop) return json({ success: false, error: "Shop is required" }, { status: 400 });

  await markFeedbackDone(shop);

  return json({ success: true, message: "Feedback marked as done" });
};
