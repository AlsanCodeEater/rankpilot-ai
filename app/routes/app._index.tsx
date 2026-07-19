import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate, useRouteError } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  InlineStack,
  Box,
  Icon,
  Banner,
  Button,
  Badge,
  SkeletonDisplayText,
  Spinner,
} from "@shopify/polaris";
import {
  ProductIcon,
  AlertBubbleIcon,
  CheckCircleIcon,
  StarFilledIcon,
} from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.time("dashboard-loader");
  const { session } = await authenticate.admin(request);
  
  const { getOrCreateShopPlan, getPlanLimits } = await import("../services/plans.server");
  const { getUsage } = await import("../services/usage.server");
  const { checkAndExpireBetaIfNeeded } = await import("../services/beta.server");
  
  await checkAndExpireBetaIfNeeded(session.shop);
  
  const shopPlan = await getOrCreateShopPlan(session.shop);
  const limits = getPlanLimits(shopPlan.planName);
  
  const aiAuditUsage = await getUsage(session.shop, "ai_audit");
  const suggestionApplyUsage = await getUsage(session.shop, "suggestion_apply");

  const usageStats = {
    planName: shopPlan.planName,
    productLimit: limits.productLimit,
    aiAuditLimit: limits.aiAuditLimit,
    applyLimit: limits.applyLimit,
    aiAuditUsage,
    suggestionApplyUsage,
    productUsage: await prisma.productSnapshot.count({ where: { shop: session.shop } }),
    isBeta: shopPlan.planName === "BETA",
    betaEndsAt: shopPlan.trialEndsAt,
  };

  console.timeEnd("dashboard-loader");
  return json({ usageStats, shop: session.shop });
};
function StatCard({
  title,
  value,
  icon,
  tone,
  url,
  loading,
}: {
  title: string;
  value?: string | number;
  icon: React.ComponentType;
  tone?: "success" | "warning" | "critical" | "info";
  url?: string;
  loading?: boolean;
}) {
  const navigate = import.meta.env.SSR ? undefined : useNavigate();
  
  const content = (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h3" variant="headingSm" tone="subdued">
            {title}
          </Text>
          <Box>
            <Icon source={icon} tone={tone || "base"} />
          </Box>
        </InlineStack>
        {loading ? (
          <SkeletonDisplayText size="small" />
        ) : (
          <Text as="p" variant="headingXl">
            {value}
          </Text>
        )}
      </BlockStack>
    </Card>
  );

  if (url && navigate) {
    return (
      <div 
        style={{ cursor: "pointer", height: "100%" }} 
        onClick={() => navigate(url)}
        role="button"
        tabIndex={0}
      >
        {content}
      </div>
    );
  }

  return content;
}

import { useEffect } from "react";

export default function Dashboard() {
  const { usageStats, shop } = useLoaderData<typeof loader>();
  const syncFetcher = useFetcher<any>();
  const auditFetcher = useFetcher<any>();
  const statsFetcher = useFetcher<any>();
  const pixelFetcher = useFetcher<any>();
  
  useEffect(() => {
    if (statsFetcher.state === "idle" && !statsFetcher.data) {
      statsFetcher.load("/api/dashboard/stats");
    }
    if (pixelFetcher.state === "idle" && !pixelFetcher.data) {
      pixelFetcher.load("/api/analytics/summary");
    }
  }, []);

  const stats = statsFetcher.data?.stats || {};
  const pixelStats = pixelFetcher.data?.pixelStats || {};
  const isStatsLoading = !statsFetcher.data;
  const isPixelLoading = !pixelFetcher.data;
  
  const handleSync = () => {
    syncFetcher.submit(null, { method: "POST", action: "/api/sync-products" });
  };

  const handleAudit = () => {
    auditFetcher.submit(null, { method: "POST", action: "/api/ai/audit-all" });
  };
  
  const isSyncing = syncFetcher.state !== "idle";
  const isAuditing = auditFetcher.state !== "idle";

  return (
    <Page>
      <TitleBar title="RankPilot AI Dashboard" />
      <BlockStack gap="500">
        
        {/* Beta Banner */}
        {usageStats.isBeta && usageStats.betaEndsAt && (
          (() => {
            const endsAt = new Date(usageStats.betaEndsAt);
            const daysRemaining = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 3) {
              return (
                <Banner tone="critical" title="Beta Access Expiring Soon">
                  <p>
                    Your beta access expires soon. Please submit feedback before {endsAt.toLocaleDateString()}.
                  </p>
                </Banner>
              );
            }
            return (
              <Banner tone="info" title="Beta Access Active">
                <p>
                  Beta access active until {endsAt.toLocaleDateString()}. Please test product sync, AI audit, suggestions, and analytics. Share feedback after testing.
                </p>
              </Banner>
            );
          })()
        )}

        {/* Alerts / Banners */}
        {syncFetcher.data && (
          <Banner 
            tone={syncFetcher.data.success ? "success" : "critical"}
            title={syncFetcher.data.success ? "Sync Complete" : "Sync Failed"}
          >
            <p>{syncFetcher.data.message || syncFetcher.data.error}</p>
          </Banner>
        )}

        {auditFetcher.data && (
          <Banner 
            tone={auditFetcher.data.success ? "success" : "critical"}
            title={auditFetcher.data.success ? "Audit Job Finished" : "Audit Failed"}
          >
            <BlockStack gap="200">
              <p>{auditFetcher.data.message || auditFetcher.data.error}</p>
              {auditFetcher.data.errors && auditFetcher.data.errors.length > 0 && (
                <Text as="p" tone="subdued">
                  {auditFetcher.data.errors.length} products failed to audit (Rate limit or AI busy).
                </Text>
              )}
            </BlockStack>
          </Banner>
        )}

        {/* Action Bar */}
        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">Store Overview</Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Manage your product catalog and run AI optimizations.
              </Text>
            </BlockStack>
            <InlineStack gap="300">
              <Button onClick={handleSync} loading={isSyncing}>
                Sync Products
              </Button>
              <Button onClick={handleAudit} loading={isAuditing} variant="primary">
                Run AI Audit
              </Button>
              <Button url="/app/products">View Products</Button>
              <Button url="/app/suggestions">View Suggestions</Button>
            </InlineStack>
          </InlineStack>
        </Card>

        {/* Usage Overview */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h3" variant="headingMd">Plan Usage Overview</Text>
              <Badge tone={usageStats.planName === "FREE" ? "new" : "success"}>
                {`${usageStats.planName} PLAN`}
              </Badge>
            </InlineStack>
            
            <Layout>
              <Layout.Section variant="oneThird">
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" tone="subdued">Products Limit</Text>
                  <Text as="p" variant="headingLg">
                    {usageStats.productUsage} / {usageStats.productLimit}
                  </Text>
                </BlockStack>
              </Layout.Section>
              <Layout.Section variant="oneThird">
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" tone="subdued">AI Audits (This Month)</Text>
                  <Text as="p" variant="headingLg">
                    {usageStats.aiAuditUsage} / {usageStats.aiAuditLimit}
                  </Text>
                </BlockStack>
              </Layout.Section>
              <Layout.Section variant="oneThird">
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" tone="subdued">Applied Suggestions (This Month)</Text>
                  <Text as="p" variant="headingLg">
                    {usageStats.suggestionApplyUsage} / {usageStats.applyLimit}
                  </Text>
                </BlockStack>
              </Layout.Section>
            </Layout>

            <Box paddingBlockStart="200">
              <Button url="/app/billing" variant="primary">
                Manage Plan
              </Button>
            </Box>
          </BlockStack>
        </Card>

        {/* Stats Grid */}
        <Layout>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Products Scanned"
              value={stats.totalProducts}
              loading={isStatsLoading}
              icon={ProductIcon}
              tone="info"
              url="/app/products"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Issues Found"
              value={stats.issuesFound}
              loading={isStatsLoading}
              icon={AlertBubbleIcon}
              tone={stats.issuesFound > 0 ? "warning" : "success"}
              url="/app/products?filter=has_issues"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Average Quality Score"
              value={
                stats.averageScore
                  ? `${Math.round(stats.averageScore)}/100`
                  : "N/A"
              }
              loading={isStatsLoading}
              icon={StarFilledIcon}
              tone={stats.averageScore && stats.averageScore < 60 ? "critical" : "success"}
              url="/app/products"
            />
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <StatCard
              title="Pending Suggestions"
              value={stats.pendingSuggestions}
              loading={isStatsLoading}
              icon={AlertBubbleIcon} // Re-using standard icon
              tone="warning"
              url="/app/suggestions"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Suggestions Applied"
              value={stats.suggestionsApplied}
              loading={isStatsLoading}
              icon={CheckCircleIcon}
              tone="success"
              url="/app/suggestions?status=applied"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Low Score Products"
              value={stats.lowScoreProducts}
              loading={isStatsLoading}
              icon={AlertBubbleIcon}
              tone={stats.lowScoreProducts > 0 ? "critical" : "success"}
              url="/app/products?filter=poor_score"
            />
          </Layout.Section>
        </Layout>

        {/* Discovery Analytics Grid */}
        <Box paddingBlockStart="400">
          <Text as="h2" variant="headingLg">Discovery Analytics</Text>
        </Box>
        <Layout>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Product Views"
              value={pixelStats.productViews}
              loading={isPixelLoading}
              icon={ProductIcon}
              tone="info"
              url="/app/analytics"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Add to Carts"
              value={pixelStats.addToCarts}
              loading={isPixelLoading}
              icon={CheckCircleIcon}
              tone="success"
              url="/app/analytics"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Search Events"
              value={pixelStats.searchHits}
              loading={isPixelLoading}
              icon={ProductIcon}
              tone="info"
              url="/app/analytics"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Collection Events"
              value={pixelStats.collectionHits}
              loading={isPixelLoading}
              icon={ProductIcon}
              tone="info"
              url="/app/analytics"
            />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <StatCard
              title="Checkout Starts"
              value={pixelStats.checkoutStarts}
              loading={isPixelLoading}
              icon={CheckCircleIcon}
              tone="success"
              url="/app/analytics"
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Dashboard route error", error);

  return (
    <Page title="Something went wrong">
      <Banner tone="critical">
        <p>Something went wrong loading this page. Please refresh and try again.</p>
      </Banner>
    </Page>
  );
}
