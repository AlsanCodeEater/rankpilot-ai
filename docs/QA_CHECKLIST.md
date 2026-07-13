# QA Checklist for RankPilot AI

This document serves as a comprehensive checklist for validating the application prior to any production deployment or major release. 

## 1. App Installation & Lifecycle
- [ ] **App Install**: Complete the OAuth flow on a fresh store. Verify permissions are granted and initial DB records (`ShopSettings`, `ShopPlan`) are created.
- [ ] **App Uninstall**: Uninstall the app from the store admin. Verify `webhooks/app/uninstalled` fires, marks shop inactive, marks pixel inactive, and clears active sessions.
- [ ] **Reinstall**: Reinstall after an uninstall. Verify app recovers cleanly without duplicate entries or constraint violations.
- [ ] **Privacy Webhooks**: Test `/webhooks/shop/redact` simulated payload. Verify shop settings and pixels are wiped.

## 2. Core Workflows
- [ ] **Product Sync**: Trigger a manual sync from the Dashboard. Validate the correct number of products is pulled from Shopify and saved to `ProductSnapshot`.
- [ ] **Empty Store**: Connect a store with 0 products. Verify the UI handles the empty state gracefully without errors.
- [ ] **Large Store (500+ Products)**: Connect a store with > 500 products. Verify pagination or batching handles the load without timing out or breaking API limits.
- [ ] **Single Product Audit**: Click "Audit" on a single product. Verify AI API is called, `aiScore` and `issueCount` update, and suggestions appear.
- [ ] **Bulk Audit**: Click "Audit All". Verify the backend job processes in chunks without crashing.

## 3. Suggestion Management
- [ ] **Approve Suggestion**: Click "Approve" on a pending suggestion. Verify status changes to `approved`.
- [ ] **Reject Suggestion**: Click "Reject". Verify status changes to `rejected` and it disappears from the active list.
- [ ] **Apply SEO Title / Description**: Click "Apply" on an SEO rewrite. Verify the product updates immediately in Shopify Admin, and local `ProductSnapshot` reflects the new score.
- [ ] **Apply Tags**: Verify adding missing tags properly appends tags to the Shopify product.

## 4. Web Pixel & Analytics
- [ ] **Web Pixel Activation**: Navigate to Settings and click "Activate Pixel". Verify `webPixelCreate` succeeds and status shows Active.
- [ ] **Storefront View Tracking**: Visit a product page on the storefront. Verify the database `StoreEvent` registers a `product_viewed` event.
- [ ] **Add to Cart Tracking**: Add an item to the cart. Verify `product_added_to_cart` is registered.
- [ ] **Search Tracking**: Use storefront search. Verify `search_submitted` is logged.
- [ ] **Analytics Dashboard**: Visit `/app/analytics`. Verify the Before & After metrics calculate correctly based on the application date of suggestions.

## 5. Billing & Limits
- [ ] **Free Plan Limits**: Exhaust the free plan AI audit quota. Verify the app correctly blocks further audits and prompts an upgrade.
- [ ] **Billing Upgrade**: Upgrade to the PRO plan via Shopify Billing API. Verify the `ShopPlan` record updates and higher quotas unlock.
- [ ] **Billing Downgrade/Cancel**: Cancel the subscription. Verify fallback to Free plan limits.

## 6. Error Handling & Security
- [ ] **Invalid API Key**: Set an invalid AI Provider API key. Verify the app handles the 401 gracefully and shows a user-friendly error on the dashboard/settings.
- [ ] **AI Provider Outage**: Simulate a 500 from the AI provider. Verify the app doesn't crash and logs the failure securely.
- [ ] **Mobile Admin View**: Open the Shopify Admin app on mobile. Verify responsive layout for Dashboard, Products, and Analytics pages.
