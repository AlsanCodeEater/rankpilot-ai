# RankPilot AI - Beta Test Script

This script outlines the exact flow beta testers should follow to validate the end-to-end functionality of the application.

## Prerequisites
- A Shopify development or testing store.
- Several products with titles and descriptions (to allow the AI to audit).

## Test Flow

1. **Install App**
   - Use the provided installation link to install the app on your store.
   - Accept the requested permissions (including `write_pixels` and `read_customer_events`).

2. **Sync Products**
   - Navigate to the **Products** tab.
   - Click the **Sync Products** button to pull store data into RankPilot AI.

3. **Run AI Audit**
   - Wait for the sync to complete.
   - Click the **Audit** button on a specific product to run a single audit.
   - Wait for the audit to finish and check if the AI Score and Issue Count update.

4. **Review Suggestions**
   - Click the **View Suggestions** link on the audited product.
   - Review the generated suggestions (e.g., SEO Title, Description, Tags).

5. **Approve Suggestion**
   - Click the **Approve** button on a suggestion.
   - Verify the status changes to "Approved".

6. **Apply Suggestion**
   - Click the **Apply** button on the approved suggestion.
   - Verify the suggestion status changes to "Applied".
   - Open your Shopify Admin Products page and verify the changes were actually pushed to the live product.

7. **Activate Pixel**
   - Navigate to the **Settings** tab.
   - Under the Web Pixel Tracking section, click **Activate Pixel**.
   - Verify the status changes to "Active".

8. **View Product on Storefront**
   - Open your live storefront (as a buyer would).
   - Navigate to the product you just audited.
   - View the product, search for it, and add it to your cart.

9. **Check Analytics**
   - Return to the RankPilot AI app.
   - Check the **Dashboard** to see the Discovery Analytics counters increment.
   - Navigate to the **ROI Analytics** page to view the Before & After impact metrics.

10. **Test Plan Limit**
    - Continue running AI Audits until you exhaust your free quota.
    - Verify that the app blocks further audits and prompts you to upgrade.
    - (Optional) Complete the mock billing upgrade to unlock the PRO tier.

11. **Uninstall App**
    - Go to Shopify Admin Settings -> Apps and Sales Channels.
    - Uninstall RankPilot AI.
    - (Admin check) Verify that backend cleanup logic executes cleanly.
