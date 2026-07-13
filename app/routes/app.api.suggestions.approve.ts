import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { approveSuggestion } from "../services/suggestions.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json(
      { success: false, error: "Method not allowed" },
      { status: 405 },
    );
  }

  try {
    const { session } = await authenticate.admin(request);

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
        { status: 400 },
      );
    }

    const result = await approveSuggestion(session.shop, suggestionId);

    return json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return json({ success: false, error: message }, { status: 400 });
  }
};
