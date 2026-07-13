import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { applyBetaPlanIfEligible } from "../services/beta.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  if (session?.shop) {
    await applyBetaPlanIfEligible(session.shop);
  }

  return null;
};
