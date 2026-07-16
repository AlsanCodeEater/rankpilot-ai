import { Link } from "@remix-run/react";
import "../styles/public.css";

export const meta = () => [
  { title: "FAQ | RankPilot AI Advance" }
];

export default function FAQ() {
  return (
    <div className="public-page">
      <div className="public-container">
        <header className="public-header">
          <span className="public-brand">RankPilot AI</span>
          <h1 className="public-heading">Frequently Asked Questions</h1>
          <p className="public-subheading">Everything you need to know about how RankPilot AI Advance works.</p>
        </header>

        <div className="public-card">
          <h2>How does the AI Merchandising Copilot work?</h2>
          <p>
            RankPilot AI Advance securely analyzes your product catalog—including titles, descriptions, SEO tags, and inventory data. 
            It then uses advanced AI models to identify gaps and opportunities, providing actionable suggestions to improve your product pages for higher conversion and better SEO ranking.
          </p>

          <h2>Does the app automatically change my products?</h2>
          <p>
            No. You maintain 100% control over your store. RankPilot generates suggestions that you can review in the app's dashboard. 
            A suggestion is only applied to your live Shopify product if you explicitly click the "Apply" button.
          </p>

          <h2>What data do you collect?</h2>
          <p>
            We strictly collect product-related data (metadata, stock, titles, tags, etc.) necessary for the AI to audit your catalog. 
            <strong>We do not collect, process, or store any customer personal data, emails, or order details.</strong>
          </p>

          <h2>How many products can I audit?</h2>
          <p>
            The number of products you can audit depends on your subscription plan. You can view your current limits and upgrade your plan directly from the Dashboard inside your Shopify Admin.
          </p>
          
          <h2>Can I undo an applied suggestion?</h2>
          <p>
            Yes! For every applied suggestion, we store the previous value (e.g., the old product title). You can easily view the history and manually revert any changes if you decide you prefer the original version.
          </p>

          <h2>What happens if I uninstall the app?</h2>
          <p>
            If you uninstall RankPilot AI Advance, all your generated suggestions and shop configurations are permanently deleted from our servers within 48 hours to comply with Shopify's data privacy policies. Any suggestions you already applied to your products will remain on your store, as they are saved directly to Shopify.
          </p>
        </div>

        <nav className="public-nav">
          <Link to="/pricing">Pricing</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support</Link>
        </nav>
      </div>
    </div>
  );
}
