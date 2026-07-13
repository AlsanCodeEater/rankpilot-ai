import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  TextField,
  Button,
  FormLayout,
  IndexTable,
  Badge,
  InlineStack,
  Box,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { getBetaMerchants, isAppOwnerShop } from "../services/beta.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  if (!isAppOwnerShop(session.shop)) {
    return new Response("Access denied. This page is only available to the app owner.", { status: 403 });
  }

  const merchants = await getBetaMerchants();
  return json({ merchants });
};

export default function BetaManagement() {
  const { merchants } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== "idle";

  const [shop, setShop] = useState("");
  const [email, setEmail] = useState("");
  const [storeName, setStoreName] = useState("");
  const [niche, setNiche] = useState("");
  const [productCountEstimate, setProductCountEstimate] = useState("");
  const [betaDurationDays, setBetaDurationDays] = useState("14");
  const [notes, setNotes] = useState("");

  const handleCreate = () => {
    const formData = new FormData();
    formData.append("shop", shop);
    formData.append("email", email);
    formData.append("storeName", storeName);
    formData.append("niche", niche);
    formData.append("productCountEstimate", productCountEstimate);
    formData.append("betaDurationDays", betaDurationDays);
    formData.append("notes", notes);

    submit(formData, { method: "POST", action: "/api/beta/create" });
    setShop("");
    setEmail("");
    setStoreName("");
    setNiche("");
    setProductCountEstimate("");
    setNotes("");
  };

  const handleAction = (merchantShop: string, actionUrl: string) => {
    const formData = new FormData();
    formData.append("shop", merchantShop);
    submit(formData, { method: "POST", action: actionUrl });
  };

  const rowMarkup = merchants.map((m: any, index: number) => (
    <IndexTable.Row id={m.id} key={m.id} position={index}>
      <IndexTable.Cell>{m.shop}</IndexTable.Cell>
      <IndexTable.Cell>{m.email || "-"}</IndexTable.Cell>
      <IndexTable.Cell>{m.storeName || "-"}</IndexTable.Cell>
      <IndexTable.Cell>{m.niche || "-"}</IndexTable.Cell>
      <IndexTable.Cell>{m.productCountEstimate || "-"}</IndexTable.Cell>
      <IndexTable.Cell><Badge tone={m.status === "active" ? "success" : "info"}>{m.status}</Badge></IndexTable.Cell>
      <IndexTable.Cell>{m.betaEndsAt ? new Date(m.betaEndsAt).toLocaleDateString() : "-"}</IndexTable.Cell>
      <IndexTable.Cell>{m.notes || "-"}</IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200" wrap={false}>
          {m.status === "invited" && (
            <Button size="micro" onClick={() => handleAction(m.shop, "/api/beta/activate")}>Activate</Button>
          )}
          {m.status === "active" && (
            <Button size="micro" onClick={() => handleAction(m.shop, "/api/beta/expire")} tone="critical">Expire</Button>
          )}
          {m.status !== "feedback_done" && m.status !== "invited" && (
            <Button size="micro" onClick={() => handleAction(m.shop, "/api/beta/feedback-done")}>Feedback Done</Button>
          )}
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page fullWidth>
      <TitleBar title="Beta Merchants" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Add Beta Merchant</Text>
                <FormLayout>
                  <FormLayout.Group>
                    <TextField label="Shop Domain" value={shop} onChange={setShop} autoComplete="off" placeholder="example.myshopify.com" />
                    <TextField label="Email" value={email} onChange={setEmail} autoComplete="email" />
                  </FormLayout.Group>
                  <FormLayout.Group>
                    <TextField label="Store Name" value={storeName} onChange={setStoreName} autoComplete="off" />
                    <TextField label="Niche" value={niche} onChange={setNiche} autoComplete="off" />
                  </FormLayout.Group>
                  <FormLayout.Group>
                    <TextField type="number" label="Product Count Estimate" value={productCountEstimate} onChange={setProductCountEstimate} autoComplete="off" />
                    <TextField type="number" label="Beta Duration (Days)" value={betaDurationDays} onChange={setBetaDurationDays} autoComplete="off" />
                  </FormLayout.Group>
                  <TextField label="Notes" value={notes} onChange={setNotes} autoComplete="off" multiline={3} />
                  <Button onClick={handleCreate} disabled={!shop} loading={isSubmitting} variant="primary">Invite Beta Merchant</Button>
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section>
            <Card padding="0">
              <Box padding="300" borderBottomWidth="025" borderColor="border">
                <Text variant="headingMd" as="h2">Beta Merchants List</Text>
              </Box>
              <IndexTable
                resourceName={{ singular: "merchant", plural: "merchants" }}
                itemCount={merchants.length}
                selectable={false}
                headings={[
                  { title: "Shop" },
                  { title: "Email" },
                  { title: "Store Name" },
                  { title: "Niche" },
                  { title: "Products" },
                  { title: "Status" },
                  { title: "Beta Ends" },
                  { title: "Notes" },
                  { title: "Actions" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
