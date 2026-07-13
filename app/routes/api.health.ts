import { json, type LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({
    success: true,
    app: "RankPilot AI",
    status: "ok"
  });
};
