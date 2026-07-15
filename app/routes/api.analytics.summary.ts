import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getProductAnalyticsSummary } from "../services/analytics.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  console.time("api.analytics.summary");
  const pixelStats = await getProductAnalyticsSummary(session.shop);
  console.timeEnd("api.analytics.summary");
  
  return json({ pixelStats });
};
