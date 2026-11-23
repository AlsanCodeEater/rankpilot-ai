/**
 * v2-engine: Batch AI page — brand voice, autopilot toggle, and whole-catalog
 * batch audits (submit + status). Self-contained so existing pages stay untouched.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Badge, Banner, BlockStack, Button, Card, Checkbox, InlineStack, Layout, Page, Text, TextField,
} from "@shopify/polaris";
import { useState } from "react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [settings, latestRun, productCount] = await Promise.all([
    prisma.shopSettings.findUnique({ where: { shopDomain: session.shop } }),
    prisma.batchAuditRun.findFirst({ where: { shop: session.shop }, orderBy: { createdAt: "desc" } }),
    prisma.productSnapshot.count({ where: { shop: session.shop } }),
  ]);
  return json({ settings, latestRun, productCount });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "save-voice") {
    const s = (k: string) => String(form.get(k) ?? "");
    await prisma.shopSettings.upsert({
      where: { shopDomain: session.shop },
      create: {
        shopDomain: session.shop,
        voiceTone: s("voiceTone"),
        voiceAudience: s("voiceAudience"),
        voiceKeywords: s("voiceKeywords"),
        voiceBannedWords: s("voiceBannedWords"),
        autopilot: form.get("autopilot") === "on",
      },
      update: {
        voiceTone: s("voiceTone"),
        voiceAudience: s("voiceAudience"),
        voiceKeywords: s("voiceKeywords"),
        voiceBannedWords: s("voiceBannedWords"),
        autopilot: form.get("autopilot") === "on",
      },
    });
    return json({ success: true, message: "Brand voice saved." });
  }

  return json({ success: false, error: "Unknown action" }, { status: 200 });
};

export default function BatchAudit() {
  const { settings, latestRun, productCount } = useLoaderData<typeof loader>();
  const voiceFetcher = useFetcher<typeof action>();
  const batchFetcher = useFetcher<any>();

  const [voiceTone, setVoiceTone] = useState(settings?.voiceTone ?? "");
  const [voiceAudience, setVoiceAudience] = useState(settings?.voiceAudience ?? "");
  const [voiceKeywords, setVoiceKeywords] = useState(settings?.voiceKeywords ?? "");
  const [voiceBannedWords, setVoiceBannedWords] = useState(settings?.voiceBannedWords ?? "");
  const [autopilot, setAutopilot] = useState(settings?.autopilot ?? false);

  const busy = batchFetcher.state !== "idle";
  const run = batchFetcher.data?.run ?? latestRun;

  const submitBatch = (intent: "submit" | "status") => {
    batchFetcher.submit({ intent }, { method: "POST", action: "/api/ai/batch-audit" });
  };

  const runBadge = (status?: string) => {
    if (!status) return <Badge>none yet</Badge>;
    if (status === "completed") return <Badge tone="success">completed</Badge>;
    if (status === "failed") return <Badge tone="critical">failed</Badge>;
    return <Badge tone="attention">{status}</Badge>;
  };

  return (
    <Page>
      <TitleBar title="Batch AI Audit" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {batchFetcher.data?.error && (
              <Banner tone="critical">{batchFetcher.data.error}</Banner>
            )}
            {batchFetcher.data?.message && (
              <Banner tone="success">{batchFetcher.data.message}</Banner>
            )}

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Whole-catalog audit</Text>
                <Text as="p" tone="subdued">
                  Audits all {productCount} synced products in one AI batch — no per-product waiting.
                  Results appear on the Suggestions page.
                </Text>
                <InlineStack gap="400" blockAlign="center">
                  <Text as="p">Latest run: {runBadge(run?.status)}</Text>
                  {run && (
                    <Text as="p" tone="subdued">
                      requested {run.requested} · completed {run.completed} · failed {run.failed}
                    </Text>
                  )}
                </InlineStack>
                <InlineStack gap="300">
                  <Button variant="primary" loading={busy} onClick={() => submitBatch("submit")}>
                    Run batch audit
                  </Button>
                  <Button loading={busy} onClick={() => submitBatch("status")}>
                    Check status / fetch results
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <voiceFetcher.Form method="post">
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">Brand voice</Text>
                  {voiceFetcher.data && "message" in voiceFetcher.data && (
                    <Banner tone="success">{voiceFetcher.data.message}</Banner>
                  )}
                  <input type="hidden" name="intent" value="save-voice" />
                  <TextField label="Tone" name="voiceTone" value={voiceTone} onChange={setVoiceTone}
                    autoComplete="off" helpText='e.g. "warm, playful, expert"' />
                  <TextField label="Audience" name="voiceAudience" value={voiceAudience} onChange={setVoiceAudience}
                    autoComplete="off" helpText="Who the store sells to" />
                  <TextField label="Keywords to weave in" name="voiceKeywords" value={voiceKeywords}
                    onChange={setVoiceKeywords} autoComplete="off" helpText="Comma-separated" />
                  <TextField label="Words to avoid" name="voiceBannedWords" value={voiceBannedWords}
                    onChange={setVoiceBannedWords} autoComplete="off" helpText="Comma-separated" />
                  <Checkbox
                    label="Autopilot: snapshot new products automatically when created"
                    checked={autopilot}
                    onChange={setAutopilot}
                  />
                  <input type="hidden" name="autopilot" value={autopilot ? "on" : "off"} />
                  <InlineStack align="end">
                    <Button submit variant="primary" loading={voiceFetcher.state !== "idle"}>
                      Save
                    </Button>
                  </InlineStack>
                </BlockStack>
              </voiceFetcher.Form>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
