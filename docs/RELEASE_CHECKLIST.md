# Production Release Safety Checklist

Before merging to `main` or deploying to the production server, ensure every step on this checklist passes successfully.

## 1. Build & Compilation
- [ ] `npm run lint` passes without errors.
- [ ] `npm run build` succeeds, generating both the Remix server bundle and Vite client assets.
- [ ] `npx prisma generate` runs cleanly, ensuring the Prisma Client is up to date with `schema.prisma`.

## 2. Database Synchronization
- [ ] `npx prisma migrate deploy` completes successfully against the production database, applying any pending migrations.

## 3. Environment & Secrets Security
- [ ] **No API Keys in Frontend**: Verify `app.tsx`, `app._index.tsx`, and all other client-side components do not export or log `SHOPIFY_API_SECRET`, `ZAI_API_KEY`, or `PIXEL_COLLECT_SECRET`.
- [ ] Production `.env` variables are properly seeded in the hosting environment (refer to `ENV_PRODUCTION_EXAMPLE.md`).

## 4. Billing Verification
- [ ] **Billing Test Mode Check**: Validate that `test: true` is properly set in `app/services/plans.server.ts` (or equivalent billing logic) for the beta launch.
  - *WARNING*: Do not change this to `false` until you are ready to collect real revenue and risk real Shopify chargebacks.

## 5. Webhook & Endpoint Health
- [ ] **Health Route Check**: `GET /api/health` returns `200 OK` and `{"success":true,"status":"ok"}`.
- [ ] **Privacy Webhook Check**: The GDPR endpoints (`/webhooks/customers/data_request`, `/webhooks/customers/redact`, `/webhooks/shop/redact`) are returning `200 OK` without crashing.
- [ ] **Uninstall Webhook Check**: `/webhooks/app/uninstalled` logic safely handles missing sessions or missing shops.
- [ ] **Pixel Collect Check**: `POST /api/pixel/collect` correctly handles preflight `OPTIONS` (CORS) and returns `200 OK` for valid hashed payloads.

## 6. Shopify App Configuration
- [ ] **Shopify App Deploy Check**: Run `npm run deploy` (or `shopify app deploy`) to sync your latest Extension code (Web Pixel) and `shopify.app.toml` configuration directly to the Shopify Partner Dashboard.
- [ ] Validate that the App URL and Redirect URLs in the Partner Dashboard match the production domain.
