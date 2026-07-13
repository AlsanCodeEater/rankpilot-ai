import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  Banner,
  InlineStack,
  Box,
  List,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { getOrCreateShopPlan } = await import("../services/plans.server");
  const shopPlan = await getOrCreateShopPlan(session.shop);

  const { getPixelInstall } = await import("../services/pixel.server");
  const pixelInstall = await getPixelInstall(session.shop);

  return json({
    aiProvider: process.env.AI_PROVIDER || "zai",
    aiModel: process.env.AI_MODEL || "glm-4.7-flash",
    planName: shopPlan.planName,
    billingStatus: shopPlan.billingStatus,
    pixelStatus: pixelInstall?.status || "inactive",
    pixelEndpoint: pixelInstall?.endpoint || "",
  });
};

export default function Settings() {
  const { aiProvider, aiModel, planName, billingStatus, pixelStatus, pixelEndpoint } = useLoaderData<typeof loader>();
  const testFetcher = useFetcher<any>();
  const pixelFetcher = useFetcher<any>();

  const isTesting = testFetcher.state !== "idle";

  const handleTestApi = () => {
    testFetcher.submit(null, { method: "POST", action: "/api/ai/test" });
  };

  return (
    <Page>
      <TitleBar title="Settings" />
      <BlockStack gap="500">
        
        {testFetcher.data && (
          <Banner 
            tone={testFetcher.data.success ? "success" : "critical"}
            title={testFetcher.data.success ? "AI Connection Successful" : "AI Connection Failed"}
          >
            <p>{testFetcher.data.message || testFetcher.data.error}</p>
            {testFetcher.data.details && (
              <Box paddingBlockStart="200">
                <Text as="p" tone="subdued" variant="bodySm">
                  {JSON.stringify(testFetcher.data.details)}
                </Text>
              </Box>
            )}
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  AI Configuration
                </Text>
                
                <Banner tone="info" title="Configuration is managed by the server">
                  <p>
                    For security reasons, API keys are stored securely on the server and cannot be viewed or modified from the frontend dashboard.
                  </p>
                </Banner>

                <Box paddingBlockStart="200">
                  <BlockStack gap="300">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd" tone="subdued">Current Plan</Text>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">{planName} ({billingStatus})</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd" tone="subdued">AI Provider</Text>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">{aiProvider}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd" tone="subdued">AI Model</Text>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">{aiModel}</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd" tone="subdued">Audit Limit</Text>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">20 products per run</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd" tone="subdued">API Key</Text>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">Stored securely on server</Text>
                    </InlineStack>
                  </BlockStack>
                </Box>

                <Box paddingBlockStart="400">
                  <Button onClick={handleTestApi} loading={isTesting} variant="primary">
                    Test AI API
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Shopify Permissions
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  RankPilot AI currently uses the following access scopes on your store:
                </Text>
                <List type="bullet">
                  <List.Item>read_products</List.Item>
                  <List.Item>write_products</List.Item>
                </List>
              </BlockStack>
            </Card>

            <Box paddingBlockStart="400">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Web Pixel Tracking
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Track product views, searches, and add-to-carts to measure the ROI of AI suggestions. 
                    <strong> No personal customer data is collected.</strong>
                  </Text>

                  <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd" tone="subdued">Status</Text>
                        <Badge tone={pixelStatus === "active" ? "success" : "warning"}>
                          {pixelStatus === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </InlineStack>
                      {pixelEndpoint && (
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd" tone="subdued">Endpoint</Text>
                          <Text as="span" variant="bodyMd">{pixelEndpoint}</Text>
                        </InlineStack>
                      )}
                    </BlockStack>
                  </Box>

                  {pixelStatus !== "active" && (
                    <Box paddingBlockStart="200">
                      <Button 
                        onClick={() => pixelFetcher.submit(null, { method: "POST", action: "/api/pixel/activate" })} 
                        loading={pixelFetcher.state !== "idle"} 
                        variant="primary"
                      >
                        Activate Pixel
                      </Button>
                    </Box>
                  )}
                  {pixelFetcher.data?.error && (
                    <Text as="p" tone="critical">{pixelFetcher.data.error}</Text>
                  )}
                </BlockStack>
              </Card>
            </Box>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
