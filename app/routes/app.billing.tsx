import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getOrCreateShopPlan, PLAN_LIMITS, type PlanName } from "../services/plans.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopPlan = await getOrCreateShopPlan(session.shop);
  
  return json({
    currentPlan: shopPlan.planName as PlanName,
    plans: PLAN_LIMITS,
  });
};

export default function BillingPage() {
  const { currentPlan, plans } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const isUpgrading = navigation.state === "submitting";

  const handleUpgrade = (planName: string) => {
    const formData = new FormData();
    formData.append("planName", planName);
    submit(formData, { method: "POST", action: "/api/billing/create" });
  };

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

            <Button
              size="large"
              variant={isCurrent ? "secondary" : "primary"}
              disabled={isCurrent || isUpgrading || name === "FREE"}
              onClick={() => handleUpgrade(name)}
              loading={isUpgrading && navigation.formData?.get("planName") === name}
              fullWidth
            >
              {isCurrent ? "Active" : name === "FREE" ? "Included" : `Upgrade to ${title}`}
            </Button>
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
