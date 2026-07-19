import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { applySuggestionToShopify } from "../services/suggestions.server";
import { checkUsageLimit, incrementUsage } from "../services/usage.server";
import { checkAndExpireBetaIfNeeded } from "../services/beta.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json(
      { success: false, error: "Method not allowed" },
      { status: 200 },
    );
  }

  try {
    const { admin, session } = await authenticate.admin(request);

    await checkAndExpireBetaIfNeeded(session.shop);

    // Accept both JSON body and form data
    let suggestionId: string | null = null;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      suggestionId = body.suggestionId;
    } else {
      const formData = await request.formData();
      suggestionId = formData.get("suggestionId") as string;
    }

    if (!suggestionId) {
      return json(
        { success: false, error: "Missing suggestionId" },
        { status: 200 },
      );
    }

    const usageCheck = await checkUsageLimit(session.shop, "suggestion_apply");
    if (!usageCheck.allowed) {
      return json({
        success: false,
        error: usageCheck.error,
        upgradeRequired: usageCheck.upgradeRequired
      }, { status: 403 });
    }

    const result = await applySuggestionToShopify(
      admin,
      session.shop,
      suggestionId,
    );

    if (!result.success) {
      return json(result, { status: 400 });
    }

    await incrementUsage(session.shop, "suggestion_apply", 1);

    return json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return json({ success: false, error: message }, { status: 200 });
  }
};
