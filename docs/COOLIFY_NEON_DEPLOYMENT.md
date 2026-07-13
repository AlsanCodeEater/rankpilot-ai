# Coolify & Neon PostgreSQL Deployment Guide

This guide walks you through deploying RankPilot AI to production using [Coolify](https://coolify.io/) as the host and [Neon](https://neon.tech/) for the serverless PostgreSQL database.

## 1. Database Setup (Neon)
Because RankPilot AI runs in a serverless environment and scales connections, we must use both a **pooled** connection and a **direct** connection.
1. Create a new project in Neon.
2. In your Neon dashboard, copy your connection string.
3. You will need two strings for Prisma:
   - `DATABASE_URL`: The **pooled** connection string (ensure `?pgbouncer=true` and `-pooler` are in the URL, e.g., `postgres://user:pass@ep-restless-pooler.neon.tech/neondb?pgbouncer=true&connect_timeout=15`).
   - `DIRECT_URL`: The **direct** connection string (standard URL, no `-pooler`, e.g., `postgres://user:pass@ep-restless.neon.tech/neondb`).

## 2. Coolify Application Creation
1. In your Coolify dashboard, go to your Project -> Environment -> **New Resource**.
2. Select **Application** -> **Public Repository** (or Private GitHub if connected).
3. Connect your repository.
4. Set the Build Pack to **Dockerfile**.
5. Set the Port to **3000**.
6. Do **NOT** deploy yet.

## 3. Environment Variables
Navigate to the **Environment Variables** tab in your Coolify App settings and add the following:

- `DATABASE_URL`: (Your pooled Neon URL)
- `DIRECT_URL`: (Your direct Neon URL)
- `SHOPIFY_API_KEY`: (From your Shopify Partners dashboard)
- `SHOPIFY_API_SECRET`: (From your Shopify Partners dashboard)
- `SCOPES`: `write_products,read_products`
- `APP_OWNER_SHOP`: `your-dev-store.myshopify.com`
- `SHOPIFY_APP_URL`: `https://app.yourdomain.com`
- `OPENAI_API_KEY`: (Your OpenAI key)
- `NODE_ENV`: `production`

## 4. Domain Mapping
1. Go to the **Settings** or **Domains** tab in your Coolify app.
2. Set the FQDN (Fully Qualified Domain Name) to your production domain: `https://app.yourdomain.com`
3. Point your DNS A record or CNAME to your Coolify server IP.

## 5. Deployment
1. Click **Deploy**.
2. Coolify will run the `Dockerfile`, which executes:
   - `npm ci`
   - `npx prisma generate`
   - `npm run build`
3. On startup, the container will run `npm run docker-start` which executes:
   - `prisma migrate deploy` (Creates the tables in Neon PostgreSQL)
   - `npm run start` (Boots the Remix server)

## 6. Health Route Test
Once deployed and marked as "Healthy" in Coolify, verify the deployment is working by visiting:
```
https://app.yourdomain.com/api/health
```
It should return a `200 OK` JSON response indicating the app is live.

## 7. Shopify App URL Update
1. Go to your **Shopify Partners Dashboard** -> Apps -> RankPilot AI -> **Configuration**.
2. Update the **App URL** to `https://app.yourdomain.com`
3. Update the **Allowed redirection URI(s)** to `https://app.yourdomain.com/auth/callback`
4. Update the **GDPR Webhooks** (Customer Data Request, Customer Redact, Shop Redact) to point to your new domain.
5. Save the configuration.
6. (Optional) Run `shopify app deploy` locally to push these CLI config changes to Shopify.

Your app is now running in production!
