import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Badge,
  InlineStack,
  Button,
  EmptyState,
  Box,
  Divider,
  Tabs,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const productSnapshotId = url.searchParams.get("productSnapshotId");
  const productId = url.searchParams.get("productId");

  const whereClause: any = { shop: session.shop };
  if (productSnapshotId) {
    whereClause.productSnapshotId = productSnapshotId;
  } else if (productId) {
    whereClause.OR = [
      { productSnapshotId: productId },
      { shopifyProductId: productId }
    ];
  }
  
  console.log("Suggestions loader whereClause:", JSON.stringify(whereClause));

  const suggestions = await prisma.aiSuggestion.findMany({
    where: whereClause,
    orderBy: [{ status: "asc" }, { confidenceScore: "desc" }],
    include: {
      productSnapshot: {
        select: { title: true, shopifyProductId: true, imageUrl: true },
      },
    },
  });

  const counts = {
    all: suggestions.length,
    pending: suggestions.filter((s) => s.status === "pending").length,
    approved: suggestions.filter((s) => s.status === "approved").length,
    applied: suggestions.filter((s) => s.status === "applied").length,
    rejected: suggestions.filter((s) => s.status === "rejected").length,
    failed: suggestions.filter((s) => s.status === "failed").length,
  };

  return json({ suggestions, counts, productSnapshotId, productId, shop: session.shop });
};

function getTypeBadge(type: string) {
  const typeMap: Record<
    string,
    { label: string; tone: "info" | "warning" | "success" | "critical" | "attention" }
  > = {
    rewrite_title: { label: "Title Rewrite", tone: "info" },
    add_tags: { label: "Add Tags", tone: "attention" },
    search_keyword_gap: { label: "Search Keywords", tone: "warning" },
    inventory_warning: { label: "Inventory", tone: "critical" },
    improve_description: { label: "Description", tone: "info" },
    improve_seo_title: { label: "SEO Title", tone: "warning" },
    improve_seo_description: { label: "SEO Desc", tone: "warning" },
  };
  const config = typeMap[type] || { label: type, tone: "info" as const };
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

function getConfidenceBadge(score: number) {
  if (score >= 0.8) return <Badge tone="success">{Math.round(score * 100)}%</Badge>;
  if (score >= 0.5) return <Badge tone="warning">{Math.round(score * 100)}%</Badge>;
  return <Badge tone="critical">{Math.round(score * 100)}%</Badge>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge tone="attention">Pending</Badge>;
    case "approved":
      return <Badge tone="info">Approved</Badge>;
    case "rejected":
      return <Badge tone="critical">Rejected</Badge>;
    case "applied":
      return <Badge tone="success">Applied</Badge>;
    case "failed":
      return <Badge tone="critical">Failed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function Suggestions() {
  const { suggestions, counts, productSnapshotId, productId, shop } = useLoaderData<typeof loader>();
  
  const statusTabs = [
    { id: "all", content: `All (${counts.all})`, status: "all" },
    { id: "pending", content: `Pending (${counts.pending})`, status: "pending" },
    { id: "approved", content: `Approved (${counts.approved})`, status: "approved" },
    { id: "rejected", content: `Rejected (${counts.rejected})`, status: "rejected" },
    { id: "applied", content: `Applied (${counts.applied})`, status: "applied" },
    { id: "failed", content: `Failed (${counts.failed})`, status: "failed" },
  ];

  const [searchParams, setSearchParams] = useSearchParams();
  const defaultStatusParam = searchParams.get("status");
  const initialStatusTab = statusTabs.findIndex(t => t.status === defaultStatusParam);

  const [selectedStatusTab, setSelectedStatusTab] = useState(initialStatusTab !== -1 ? initialStatusTab : 0);
  const [selectedTypeTab, setSelectedTypeTab] = useState(0);

  const typeTabs = [
    { id: "all", content: "All", type: "all" },
    { id: "title", content: "Title", type: "rewrite_title" },
    { id: "description", content: "Description", type: "improve_description" },
    { id: "seo", content: "SEO", type: ["improve_seo_title", "improve_seo_description"] },
    { id: "tags", content: "Tags", type: "add_tags" },
    { id: "inventory", content: "Stock", type: "inventory_warning" },
    { id: "keywords", content: "Keywords", type: "search_keyword_gap" },
  ];

  const handleStatusTabChange = useCallback(
    (selectedTabIndex: number) => setSelectedStatusTab(selectedTabIndex),
    []
  );

  const handleTypeTabChange = useCallback(
    (selectedTabIndex: number) => setSelectedTypeTab(selectedTabIndex),
    []
  );

  const currentStatus = statusTabs[selectedStatusTab].status;
  const currentTypeConfig = typeTabs[selectedTypeTab].type;

  const filteredSuggestions = suggestions.filter((s: any) => {
    const statusMatch = currentStatus === "all" || s.status === currentStatus;
    const typeMatch =
      currentTypeConfig === "all" ||
      (Array.isArray(currentTypeConfig)
        ? currentTypeConfig.includes(s.suggestionType)
        : s.suggestionType === currentTypeConfig);
    return statusMatch && typeMatch;
  });

  return (
    <Page>
      <TitleBar title="AI Suggestions" />
      
      {suggestions.length === 0 && (
        <Box paddingBlockEnd="200">
          <Text as="p" tone="subdued" variant="bodySm">
            Debug: loaded 0 suggestions for shop {shop}
          </Text>
        </Box>
      )}

      <BlockStack gap="500">
        <Card padding="0">
          <Tabs tabs={statusTabs} selected={selectedStatusTab} onSelect={handleStatusTabChange} />
          <Box padding="200" paddingBlockStart="0">
            <Tabs tabs={typeTabs} selected={selectedTypeTab} onSelect={handleTypeTabChange} />
          </Box>
        </Card>

        <Layout>
          <Layout.Section>
            {filteredSuggestions.length === 0 ? (
              <Card>
                <EmptyState
                  heading="No suggestions found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>There are no suggestions matching the selected filters.</p>
                </EmptyState>
              </Card>
            ) : (
              <BlockStack gap="400">
                {filteredSuggestions.map((suggestion) => (
                  <SuggestionItem key={suggestion.id} suggestion={suggestion} />
                ))}
              </BlockStack>
            )}
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

function SuggestionItem({ suggestion }: { suggestion: any }) {
  const fetcher = useFetcher();
  
  const handleAction = (suggestionId: string, actionEndpoint: string) => {
    fetcher.submit(
      { suggestionId },
      { method: "POST", action: `/app/api/suggestions/${actionEndpoint}` },
    );
  };

  const isSubmitting = fetcher.state !== "idle";

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            {suggestion.productSnapshot?.imageUrl && (
              <img
                src={suggestion.productSnapshot.imageUrl}
                alt=""
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "cover",
                  borderRadius: "4px",
                }}
              />
            )}
            {getTypeBadge(suggestion.suggestionType)}
            {getConfidenceBadge(suggestion.confidenceScore)}
            {getStatusBadge(suggestion.status)}
          </InlineStack>
          {suggestion.productSnapshot && (
            <Text as="span" variant="bodySm" tone="subdued">
              {suggestion.productSnapshot.title}
            </Text>
          )}
        </InlineStack>

        <Divider />

        <BlockStack gap="200">
          <BlockStack gap="100">
            <Text as="span" variant="headingSm">
              Issue
            </Text>
            <Text as="p" variant="bodyMd">
              {suggestion.issue}
            </Text>
          </BlockStack>
          <BlockStack gap="100">
            <Text as="span" variant="headingSm">
              Reason
            </Text>
            <Text as="p" variant="bodyMd">
              {suggestion.reason}
            </Text>
          </BlockStack>
          {suggestion.oldValue && (
            <BlockStack gap="100">
              <Text as="span" variant="headingSm">
                Old Value
              </Text>
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <Text as="p" variant="bodyMd">
                  {suggestion.oldValue}
                </Text>
              </Box>
            </BlockStack>
          )}
          <BlockStack gap="100">
            <Text as="span" variant="headingSm">
              Suggested Change
            </Text>
            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <Text as="p" variant="bodyMd">
                {suggestion.newValue}
              </Text>
            </Box>
          </BlockStack>
        </BlockStack>

        {suggestion.status === "failed" && suggestion.errorMessage && (
          <Box padding="300" background="bg-surface-critical" borderRadius="200">
            <Text as="p" tone="critical" variant="bodyMd">
              Error: {suggestion.errorMessage}
            </Text>
          </Box>
        )}

        {suggestion.status === "pending" && (
          <>
            <Divider />
            <InlineStack gap="200" align="end">
              <Button
                onClick={() => handleAction(suggestion.id, "reject")}
                tone="critical"
                disabled={isSubmitting}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleAction(suggestion.id, "approve")}
                variant="primary"
                loading={isSubmitting}
              >
                Approve
              </Button>
            </InlineStack>
          </>
        )}

        {suggestion.status === "approved" && (
          <>
            <Divider />
            <InlineStack gap="200" align="end">
              <Button
                onClick={() => handleAction(suggestion.id, "reject")}
                tone="critical"
                disabled={isSubmitting}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleAction(suggestion.id, "apply")}
                variant="primary"
                tone="success"
                loading={isSubmitting}
              >
                Apply Change
              </Button>
            </InlineStack>
          </>
        )}
      </BlockStack>
    </Card>
  );
}
