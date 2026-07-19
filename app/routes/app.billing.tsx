import { useLoaderData, useNavigation, useRouteError, Form } from "@remix-run/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  Badge,
  List,
  Box,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getOrCreateShopPlan, PLAN_LIMITS, type PlanName } from "../services/plans.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const billingSuccess = url.searchParams.get("billing") === "success";
  const planChanged = url.searchParams.get("changed") === "1";
  const newPlanName = url.searchParams.get("planName") || url.searchParams.get("plan");

  if (billingSuccess && newPlanName && newPlanName !== "FREE") {
    // Optimistically update the plan if coming back from Shopify billing success
    await prisma.shopPlan.upsert({
      where: { shop: session.shop },
      create: { shop: session.shop, planName: newPlanName, billingStatus: "active" },
      update: { planName: newPlanName, billingStatus: "active" }
    });
  }

  const shopPlan = await getOrCreateShopPlan(session.shop);
  
  return json({
    currentPlan: shopPlan.planName as PlanName,
    plans: PLAN_LIMITS,
    showSuccessBanner: billingSuccess || planChanged,
    updatedPlanName: newPlanName,
  });
};

export default function BillingPage() {
  const { currentPlan, plans, showSuccessBanner } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  
  const isUpgrading = navigation.state === "submitting";

  const renderPlanCard = (name: PlanName, title: string) => {
    const plan = plans[name];
    const isCurrent = currentPlan === name;

    return (
      <Layout.Section variant="oneThird" key={name}>
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h3" variant="headingLg" fontWeight="bold">
                {title}
              </Text>
              {isCurrent && <Badge tone="success">Current Plan</Badge>}
            </InlineStack>
            
            <BlockStack gap="200">
              <Text as="p" variant="heading3xl">
                ${plan.monthlyPrice}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                USD / month
              </Text>
            </BlockStack>

            <Box paddingBlockStart="200" paddingBlockEnd="400">
              <List type="bullet">
                <List.Item>
                  <Text as="span" fontWeight="semibold">{plan.productLimit}</Text> Products max
                </List.Item>
                <List.Item>
                  <Text as="span" fontWeight="semibold">{plan.aiAuditLimit}</Text> AI Audits / mo
                </List.Item>
                <List.Item>
                  <Text as="span" fontWeight="semibold">{plan.applyLimit}</Text> Applied Suggestions / mo
                </List.Item>
                <List.Item>
                  {plan.bulkAudit ? (
                    <Text as="span" tone="success">Bulk Audit Enabled</Text>
                  ) : (
                    <Text as="span" tone="subdued">No Bulk Audit</Text>
                  )}
                </List.Item>
                <List.Item>
                  {plan.advancedAnalytics ? (
                    <Text as="span" tone="success">Advanced Analytics</Text>
                  ) : plan.analytics ? (
                    <Text as="span" tone="success">Basic Analytics</Text>
                  ) : (
                    <Text as="span" tone="subdued">No Analytics</Text>
                  )}
                </List.Item>
              </List>
            </Box>

            <Box>
              <Form method="post" action="/api/billing/create">
                <input type="hidden" name="planName" value={name} />
                <Button
                  submit
                  size="large"
                  variant={isCurrent ? "secondary" : "primary"}
                  disabled={isCurrent || isUpgrading}
                  loading={isUpgrading && navigation.formData?.get("planName") === name}
                  fullWidth
                >
                  {isCurrent ? "Active" : name === "FREE" ? "Downgrade to Free" : `Choose ${title}`}
                </Button>
              </Form>
            </Box>
          </BlockStack>
        </Card>
      </Layout.Section>
    );
  };

  return (
    <Page>
      <TitleBar title="Upgrade Plan" />
      <BlockStack gap="500">
        <Box paddingBlockEnd="400">
          <Text as="h1" variant="heading2xl">
            Choose the right plan for your store
          </Text>
          <Box paddingBlockStart="200">
            <Text as="p" variant="bodyLg" tone="subdued">
              Unlock higher limits and bulk AI actions to scale your SEO optimization.
            </Text>
          </Box>
        </Box>

        {showSuccessBanner && (
          <Banner tone="success" title="Plan updated successfully">
            <p>Your billing plan has been changed to {currentPlan}.</p>
          </Banner>
        )}

        <Layout>
          {currentPlan === "BETA" && (
            <Layout.Section>
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd" fontWeight="bold">Current plan: BETA</Text>
                  <Text as="p" variant="bodyMd">Beta access is free and temporary.</Text>
                </BlockStack>
              </Card>
            </Layout.Section>
          )}
          {renderPlanCard("FREE", "Free")}
          {renderPlanCard("STARTER", "Starter")}
          {renderPlanCard("GROWTH", "Growth")}
          {renderPlanCard("PRO", "Pro")}
        </Layout>
      </BlockStack>
    </Page>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Billing route error", error);

  return (
    <Page title="Something went wrong">
      <Banner tone="critical">
        <p>Something went wrong loading this page. Please refresh and try again.</p>
      </Banner>
    </Page>
  );
}
