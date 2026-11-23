/**
 * v2-engine: batch audit endpoint.
 * POST intent=submit  -> submit one Anthropic batch for the flagged catalog
 * POST intent=status  -> poll latest run, ingest results when ended
 * Same plan/usage gates as api.ai.audit-all.ts, but no 20-product cap:
 * the cap is the shop's remaining monthly quota.
 */
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { canUseFeature, getOrCreateShopPlan } from "../services/plans.server";
import { syncShopBillingPlan } from "../services/billing.server";
import { checkUsageLimit } from "../services/usage.server";
import { checkAndExpireBetaIfNeeded } from "../services/beta.server";
import { submitBatchAudit, syncBatchAudit } from "../services/anthropic-batch.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, { status: 200 });
  }

  const { session, admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") || "submit");

  try {
    if (intent === "status") {
      const latest = await prisma.batchAuditRun.findFirst({
        where: { shop: session.shop },
        orderBy: { createdAt: "desc" },
      });
      if (!latest) return json({ success: true, run: null });
      const run = await syncBatchAudit(latest.id);
      return json({ success: true, run });
    }

    // intent === "submit"
    await checkAndExpireBetaIfNeeded(session.shop);

    const hasBulkAudit = await canUseFeature(session.shop, "bulkAudit");
    if (!hasBulkAudit) {
      return json({
        success: false,
        error: "Bulk AI audit is available on Starter plan and above.",
        upgradeRequired: true,
      });
    }

    const usageCheck = await checkUsageLimit(session.shop, "ai_audit");
    if (!usageCheck.allowed) {
      return json(
        { success: false, error: usageCheck.error, upgradeRequired: usageCheck.upgradeRequired },
        { status: 200 },
      );
    }

    let shopPlan = await getOrCreateShopPlan(session.shop);
    if (shopPlan.planName === "FREE") {
      shopPlan = await syncShopBillingPlan(admin, session.shop);
    }

    const remainingQuota = usageCheck.limit - usageCheck.currentUsage;
    const running = await prisma.batchAuditRun.findFirst({
      where: { shop: session.shop, status: { in: ["submitted", "in_progress"] } },
    });
    if (running) {
      return json({
        success: false,
        error: "A batch audit is already running. Check its status before submitting another.",
      });
    }

    const run = await submitBatchAudit(session.shop, remainingQuota);
    return json({
      success: true,
      message: `Batch audit submitted for ${run.requested} products. Results usually arrive within minutes.`,
      run,
    });
  } catch (error) {
    return json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 200 },
    );
  }
};
