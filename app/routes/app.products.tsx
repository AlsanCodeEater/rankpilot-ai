import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  IndexTable,
  Badge,
  Thumbnail,
  InlineStack,
  EmptyState,
  Box,
  Button,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getProductSnapshots } from "../services/product-sync.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const products = await getProductSnapshots(session.shop);
  return json({ products, shop: session.shop });
};

function getQualityBadge(score: number | null) {
  if (score === null) return <Badge tone="new">Not audited</Badge>;
  if (score >= 80) return <Badge tone="success">Good ({score})</Badge>;
  if (score >= 60) return <Badge tone="warning">Needs improvement ({score})</Badge>;
  return <Badge tone="critical">Poor ({score})</Badge>;
}

function ProductRow({ product, index }: { product: any; index: number }) {
  const auditFetcher = useFetcher();
  const navigate = useNavigate();

  const handleAudit = () => {
    auditFetcher.submit(
      { productSnapshotId: product.id },
      { method: "POST", action: "/api/ai/audit-product" }
    );
  };

  const isAuditing = auditFetcher.state !== "idle";

  return (
    <IndexTable.Row id={product.id} position={index} key={product.id}>
      <IndexTable.Cell>
        <Thumbnail
          source={product.imageUrl || ImageIcon}
          alt={product.title}
          size="small"
        />
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {product.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{product.status || "N/A"}</IndexTable.Cell>
      <IndexTable.Cell>{product.totalInventory ?? 0}</IndexTable.Cell>
      <IndexTable.Cell>{getQualityBadge(product.aiScore)}</IndexTable.Cell>
      <IndexTable.Cell>
        {product.issueCount > 0 ? (
          <Badge tone="warning">{product.issueCount} issues</Badge>
        ) : (
          <Text as="span" tone="subdued">0</Text>
        )}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {product.lastScannedAt
          ? String(product.lastScannedAt).split("T")[0]
          : "Never"}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200" wrap={false}>
          <Button onClick={handleAudit} loading={isAuditing} size="micro">
            Audit
          </Button>
          <Button onClick={() => navigate(`/app/suggestions?productSnapshotId=${product.id}`)} size="micro">
            Suggestions
          </Button>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}

export default function Products() {
  const { products } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  
  const [sortColumnIndex, setSortColumnIndex] = useState<number | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('ascending');
  
  const setFilter = (newFilter: string) => {
    setSearchParams(prev => {
      prev.set("filter", newFilter);
      return prev;
    });
  };

  const handleSort = (headingIndex: number, direction: 'ascending' | 'descending') => {
    setSortColumnIndex(headingIndex);
    setSortDirection(direction);
  };

  const filteredProducts = products.filter((p: any) => {
    if (filter === "not_audited") return p.aiScore === null;
    if (filter === "poor_score") return p.aiScore !== null && p.aiScore < 60;
    if (filter === "has_issues") return p.issueCount > 0;
    return true; // "all"
  });

  const sortedProducts = [...filteredProducts].sort((a: any, b: any) => {
    if (sortColumnIndex === undefined) return 0;
    
    let aValue: any = null;
    let bValue: any = null;

    switch (sortColumnIndex) {
      case 2: // Status
        aValue = a.status || "";
        bValue = b.status || "";
        break;
      case 3: // Inventory
        aValue = a.totalInventory ?? 0;
        bValue = b.totalInventory ?? 0;
        break;
      case 4: // AI Score
        aValue = a.aiScore ?? -1;
        bValue = b.aiScore ?? -1;
        break;
      case 5: // Issues
        aValue = a.issueCount ?? 0;
        bValue = b.issueCount ?? 0;
        break;
      case 6: // Last Scanned
        aValue = a.lastScannedAt ? new Date(a.lastScannedAt).getTime() : 0;
        bValue = b.lastScannedAt ? new Date(b.lastScannedAt).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortDirection === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const rowMarkup = sortedProducts.map((product: any, index: number) => (
    <ProductRow key={product.id} product={product} index={index} />
  ));

  return (
    <Page fullWidth>
      <TitleBar title="Products" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card padding="0">
              <Box padding="300" borderBottomWidth="025" borderColor="border">
                <InlineStack gap="200">
                  <Button pressed={filter === "all"} onClick={() => setFilter("all")}>All</Button>
                  <Button pressed={filter === "not_audited"} onClick={() => setFilter("not_audited")}>Not Audited</Button>
                  <Button pressed={filter === "poor_score"} onClick={() => setFilter("poor_score")}>Poor Score</Button>
                  <Button pressed={filter === "has_issues"} onClick={() => setFilter("has_issues")}>Has Issues</Button>
                </InlineStack>
              </Box>

              {products.length === 0 ? (
                <EmptyState
                  heading="No products synced yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Go to the Dashboard to sync your products.</p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{ singular: "product", plural: "products" }}
                  itemCount={sortedProducts.length}
                  selectable={false}
                  sortable={[false, false, true, true, true, true, true, false]}
                  sortColumnIndex={sortColumnIndex}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  headings={[
                    { title: "Image" },
                    { title: "Product" },
                    { title: "Status" },
                    { title: "Inventory" },
                    { title: "AI Score" },
                    { title: "Issues" },
                    { title: "Last Scanned" },
                    { title: "Actions" },
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
