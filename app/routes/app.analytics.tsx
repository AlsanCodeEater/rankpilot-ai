import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  IndexTable,
  Badge,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getProductBeforeAfterImpact } from "../services/analytics.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const impactData = await getProductBeforeAfterImpact(session.shop);

  return json({ impactData });
};

export default function Analytics() {
  const { impactData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const rowMarkup = impactData.map((product, index) => {
    let improvementTone: "success" | "warning" | "critical" | undefined = undefined;
    if (product.improvement > 10) improvementTone = "success";
    else if (product.improvement < 0) improvementTone = "critical";

    return (
      <IndexTable.Row id={product.id} position={index} key={product.id}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {product.title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={product.aiScore >= 80 ? "success" : product.aiScore >= 60 ? "warning" : "critical"}>
            {product.aiScore}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {String(product.appliedDate).split("T")[0]}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {product.viewsBefore} &rarr; <strong>{product.viewsAfter}</strong>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {product.cartsBefore} &rarr; <strong>{product.cartsAfter}</strong>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={improvementTone}>
            {product.improvement > 0 ? "+" : ""}{product.improvement}%
          </Badge>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page fullWidth>
      <TitleBar title="ROI Analytics" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card padding="0">
              {impactData.length === 0 ? (
                <EmptyState
                  heading="No impact data yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Apply AI suggestions to your products, and check back in a few days to see the impact on product views and conversions.</p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{ singular: "product", plural: "products" }}
                  itemCount={impactData.length}
                  selectable={false}
                  headings={[
                    { title: "Product" },
                    { title: "AI Score" },
                    { title: "Applied On" },
                    { title: "Views (Before ➔ After)" },
                    { title: "Carts (Before ➔ After)" },
                    { title: "Improvement" },
                  ]}
                >
                  {rowMarkup}
                </IndexTable>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
