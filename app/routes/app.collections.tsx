import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useRouteError } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  EmptyState,
  IndexTable,
  Badge,
  Thumbnail,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { CollectionIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const collections: any[] = [];

  return json({ collections });
};

export default function Collections() {
  const { collections } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="Collections" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card padding="0">
              {collections.length === 0 ? (
                <EmptyState
                  heading="No collections synced yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Collection sync will be available after your first product
                    sync. AI-powered collection ranking improvements are coming
                    soon.
                  </p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{
                    singular: "collection",
                    plural: "collections",
                  }}
                  itemCount={collections.length}
                  selectable={false}
                  headings={[
                    { title: "Collection" },
                    { title: "Sort Order" },
                    { title: "Products" },
                  ]}
                >
                  {collections.map((collection, index) => (
                    <IndexTable.Row
                      id={collection.id}
                      key={collection.id}
                      position={index}
                    >
                      <IndexTable.Cell>
                        <InlineStack gap="300" blockAlign="center">
                          <Thumbnail
                            source={collection.imageUrl || CollectionIcon}
                            alt={collection.title}
                            size="small"
                          />
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            {collection.title}
                          </Text>
                        </InlineStack>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Badge>{collection.sortOrder || "Manual"}</Badge>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Text as="span" variant="bodyMd">
                          {collection.productsCount}
                        </Text>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Collections route error", error);

  return (
    <Page title="Something went wrong">
      <Banner tone="critical">
        <p>Something went wrong loading this page. Please refresh and try again.</p>
      </Banner>
    </Page>
  );
}
