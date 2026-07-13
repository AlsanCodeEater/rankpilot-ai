# Production Deployment Guide for RankPilot AI

This guide outlines the essential steps required to take RankPilot AI out of the local development environment and deploy it for live beta testing or full production.

## 1. Hosting & Infrastructure Setup
- Choose a hosting provider for your Node.js/Remix app (e.g., Fly.io, Heroku, AWS, or Vercel if adapted).
- Provision a production-grade database. Move from the local SQLite `dev.sqlite` to a hosted PostgreSQL or MySQL instance.
- Update your production environment with the new database URL: `DATABASE_URL="postgresql://user:pass@host:5432/db"`.
- Run `npx prisma migrate deploy` during your CI/CD build step to ensure the production database schema is initialized.

## 2. Environment Variables
Ensure the following variables are strictly set in your production environment:
- `SHOPIFY_APP_URL`: Your actual production domain (e.g., `https://app.rankpilot.ai`).
- `SHOPIFY_API_KEY`: From your Shopify Partner Dashboard.
- `SHOPIFY_API_SECRET`: From your Shopify Partner Dashboard.
- `SCOPES`: `read_products,write_products,read_inventory,read_locations,write_pixels,read_customer_events`
- `AI_PROVIDER`: Choose your production default (e.g., `zai` or `openai`).
- `ZAI_API_KEY` (or chosen provider key): Store this securely!

## 3. Shopify Partner Dashboard Configuration
Before launching, you must update your app settings in the Shopify Partner Dashboard:
- **App URL**: Change from your Cloudflare tunnel to your production domain (e.g., `https://app.rankpilot.ai`).
- **Allowed Redirection URLs**: Update to `https://app.rankpilot.ai/api/auth`.
- **GDPR Mandatory Webhooks**: Ensure the following paths are configured in the Partner Dashboard under App Setup:
  - Customer Data Request: `https://app.rankpilot.ai/webhooks/customers/data_request`
  - Customer Data Erasure: `https://app.rankpilot.ai/webhooks/customers/redact`
  - Shop Data Erasure: `https://app.rankpilot.ai/webhooks/shop/redact`

## 4. Web Pixel Endpoint Update
When deploying, make sure that `process.env.PIXEL_COLLECT_ENDPOINT` is either set, or relies on `SHOPIFY_APP_URL` correctly so that the Web Pixel `fetch()` calls post back to `https://app.rankpilot.ai/api/pixel/collect`.

## 5. Billing Configuration
- Review `app/services/plans.server.ts` or related billing logic.
- Ensure that Shopify Billing API calls set `test: false` when you are ready to charge real merchants. Leave it as `test: true` only while conducting the closed Beta test.

## 6. Logging & Monitoring
- Standard `console.log` output should be piped into a centralized logging platform (e.g., Datadog, PaperTrail, AWS CloudWatch).
- The custom `logger.server.ts` helper masks sensitive keys automatically, but ensure no personal customer data (PII) is being logged.

## 7. Database Backups
- Configure automated daily backups for your PostgreSQL/MySQL production database.
- Establish a retention policy (e.g., 30 days) to recover from catastrophic failure.
