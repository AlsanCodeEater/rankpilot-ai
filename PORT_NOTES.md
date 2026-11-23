# v2-engine branch — what changed and how to ship it

## New capabilities
1. **Batch audits** (`api/ai/batch-audit`): audits the whole flagged catalog in ONE
   Anthropic Message Batch instead of 20 products with 1.5s sleeps. ~10x cheaper than
   the OpenRouter sonnet path and no timeouts/rate limits. Results land in the existing
   AiSuggestion table — Suggestions UI, apply flow, scoring, usage metering unchanged.
   POST intent=submit to start, intent=status to poll/ingest.
2. **Brand voice**: ShopSettings gains voiceTone / voiceAudience / voiceKeywords /
   voiceBannedWords, injected into the batch system prompt. (Settings UI fields: TODO.)
3. **Rollback** (`app/api/suggestions/revert`): applied suggestions can be reverted —
   oldValue is written back to Shopify and the snapshot; status becomes "reverted".
   (Button in Suggestions UI: TODO.)
4. **Autopilot webhook** (`webhooks/products/create`): new products are snapshotted
   immediately when ShopSettings.autopilot is on. Registered in shopify.app.toml.

## Deploy steps (Coolify)
1. `npm install` (adds @anthropic-ai/sdk)
2. Env: add `ANTHROPIC_API_KEY` (console.anthropic.com). Optional:
   `ANTHROPIC_BATCH_MODEL` (default claude-haiku-4-5), `BATCH_AUDIT_MAX` (default 1000).
3. `npx prisma migrate deploy` (migration: 20261124_v2_engine_batch_voice)
4. `npm run deploy` (Shopify CLI) once, to register the products/create webhook.

## Delisting fix (do before/with deploy)
Dev dashboard → Set up IP allowlist → add the Coolify VPS egress IPs:
`200.97.161.9` and `2a02:4780:63:6fe::1`. Then follow the reinstatement steps from
Shopify's delisting email.

## Known pre-existing issues (not from this branch)
`npx tsc --noEmit` reports ~46 errors in older UI routes (app.products.tsx,
app.suggestions.tsx, app.beta.tsx, …). They predate this branch; build still passes.
