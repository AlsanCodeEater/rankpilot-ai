import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { revertSuggestion } from "../services/revert-suggestion.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 200 });
  }
  const { session, admin } = await authenticate.admin(request);
  const form = await request.formData();
  const suggestionId = String(form.get("suggestionId") || "");
  if (!suggestionId) return json({ success: false, error: "suggestionId is required" }, { status: 200 });

  try {
    const result = await revertSuggestion(admin, session.shop, suggestionId);
    return json(result);
  } catch (error) {
    return json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 200 },
    );
  }
};
