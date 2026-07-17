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
import { useState, useCallback, useEffect } from "react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.time("suggestions-loader");
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const productSnapshotId = url.searchParams.get("productSnapshotId");
  const productId = url.searchParams.get("productId");
  const statusParam = url.searchParams.get("status") || "all";
  const typeParam = url.searchParams.get("type") || "all";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 25;

  const baseWhere: any = { shop: session.shop };
  if (productSnapshotId) {
    baseWhere.productSnapshotId = productSnapshotId;
  } else if (productId) {
    baseWhere.OR = [
      { productSnapshotId: productId },
      { shopifyProductId: productId }
    ];
  }

  const whereClause = { ...baseWhere };
  if (statusParam !== "all") {
    whereClause.status = statusParam;
  }
  
  if (typeParam !== "all") {
    if (typeParam === "seo") {
      whereClause.suggestionType = { in: ["improve_seo_title", "improve_seo_description"] };
    } else {
      whereClause.suggestionType = typeParam;
    }
  }

  console.log("Suggestions loader whereClause:", JSON.stringify(whereClause));

  const [
    suggestions,
    totalAll,
    totalPending,
    totalApproved,
    totalApplied,
    totalRejected,
    totalFailed
  ] = await Promise.all([
    prisma.aiSuggestion.findMany({
      where: whereClause,
      orderBy: [{ status: "asc" }, { confidenceScore: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        productSnapshot: {
          select: { title: true, shopifyProductId: true, imageUrl: true },
        },
      },
    }),
    prisma.aiSuggestion.count({ where: baseWhere }),
    prisma.aiSuggestion.count({ where: { ...baseWhere, status: "pending" } }),
    prisma.aiSuggestion.count({ where: { ...baseWhere, status: "approved" } }),
    prisma.aiSuggestion.count({ where: { ...baseWhere, status: "applied" } }),
    prisma.aiSuggestion.count({ where: { ...baseWhere, status: "rejected" } }),
    prisma.aiSuggestion.count({ where: { ...baseWhere, status: "failed" } }),
  ]);

  const counts = {
    all: totalAll,
    pending: totalPending,
    approved: totalApproved,
    applied: totalApplied,
    rejected: totalRejected,
    failed: totalFailed,
  };

  const totalPages = Math.ceil(
    (statusParam !== "all" ? counts[statusParam as keyof typeof counts] : counts.all) / limit
  );

  console.timeEnd("suggestions-loader");
  return json({ suggestions, counts, productSnapshotId, productId, shop: session.shop, page, totalPages, statusParam, typeParam });
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
  if (score >= 0.8) return <Badge tone="success">{`${Math.round(score * 100)}%`}</Badge>;
  if (score >= 0.5) return <Badge tone="warning">{`${Math.round(score * 100)}%`}</Badge>;
  return <Badge tone="critical">{`${Math.round(score * 100)}%`}</Badge>;
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

import { useNavigation, useNavigate, useRevalidator } from "@remix-run/react";

export default function Suggestions() {
  const { suggestions, counts, shop, page, totalPages, statusParam, typeParam } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  
  const statusTabs = [
    { id: "all", content: `All (${counts.all})`, status: "all" },
    { id: "pending", content: `Pending (${counts.pending})`, status: "pending" },
    { id: "approved", content: `Approved (${counts.approved})`, status: "approved" },
    { id: "rejected", content: `Rejected (${counts.rejected})`, status: "rejected" },
    { id: "applied", content: `Applied (${counts.applied})`, status: "applied" },
    { id: "failed", content: `Failed (${counts.failed})`, status: "failed" },
  ];

  const typeTabs = [
    { id: "all", content: "All", type: "all" },
    { id: "rewrite_title", content: "Title", type: "rewrite_title" },
    { id: "improve_description", content: "Description", type: "improve_description" },
    { id: "seo", content: "SEO", type: "seo" },
    { id: "add_tags", content: "Tags", type: "add_tags" },
    { id: "inventory_warning", content: "Stock", type: "inventory_warning" },
    { id: "search_keyword_gap", content: "Keywords", type: "search_keyword_gap" },
  ];

  const selectedStatusTab = Math.max(0, statusTabs.findIndex(t => t.status === statusParam));
  const selectedTypeTab = Math.max(0, typeTabs.findIndex(t => t.type === typeParam));

  const handleStatusTabChange = (selectedTabIndex: number) => {
    navigate(`?status=${statusTabs[selectedTabIndex].status}&type=${typeParam}`);
  };

  const handleTypeTabChange = (selectedTabIndex: number) => {
    navigate(`?status=${statusParam}&type=${typeTabs[selectedTabIndex].type}`);
  };

  const handleNextPage = () => navigate(`?status=${statusParam}&type=${typeParam}&page=${page + 1}`);
  const handlePrevPage = () => navigate(`?status=${statusParam}&type=${typeParam}&page=${page - 1}`);

  const filteredSuggestions = suggestions;

  return (
    <Page>
      <TitleBar title="AI Suggestions" />

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
                
                <Box paddingBlockStart="400">
                  <InlineStack align="center" gap="400">
                    <Button disabled={page <= 1} onClick={handlePrevPage}>Previous</Button>
                    <Text as="p" tone="subdued">Page {page} of {Math.max(1, totalPages)}</Text>
                    <Button disabled={page >= totalPages} onClick={handleNextPage}>Next</Button>
                  </InlineStack>
                </Box>
              </BlockStack>
            )}
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

function SuggestionItem({ suggestion }: { suggestion: any }) {
  const fetcher = useFetcher<any>();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcher.data, revalidator]);
  
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
