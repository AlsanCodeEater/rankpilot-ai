import { Link } from "@remix-run/react";
import "../styles/public.css";

export const meta = () => [
  { title: "Privacy Policy | RankPilot AI Advance" }
];

export default function PrivacyPolicy() {
  return (
    <div className="public-page">
      <div className="public-container">
        <header className="public-header">
          <span className="public-brand">RankPilot AI</span>
          <h1 className="public-heading">Privacy Policy</h1>
          <p className="public-subheading">Last updated: {new Date().toLocaleDateString()}</p>
        </header>

        <div className="public-card">
          <h2>1. Introduction</h2>
          <p>
            RankPilot AI Advance ("we", "our", or "us") is an AI merchandising copilot for Shopify stores. 
            This Privacy Policy explains how we collect, use, and protect your data when you install our app.
          </p>
          
          <h2>2. Data We Collect</h2>
          <p>
            Our app strictly uses product and catalog data to generate AI merchandising suggestions. The AI provider may process 
            product titles, descriptions, tags, SEO fields, inventory status, and product metadata.
          </p>

          <h2>3. Customer Data Protection</h2>
          <p>
            <strong>No protected customer or order data is required or collected.</strong> We do not store or process 
            personally identifiable information (PII) such as customer emails, phone numbers, addresses, customer IDs, 
            customer names, or order data. Our system is designed entirely around product optimization, not customer tracking.
          </p>

          <h2>4. Data Retention & Deletion</h2>
          <p>
            Merchants can uninstall the app at any time via their Shopify Admin. Upon uninstallation, all shop-related app data 
            (including products, generated AI suggestions, and settings) is permanently deleted in accordance with Shopify's 
            data redaction policies.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: <br/>
            <a href="mailto:support@alsanlab.cloud">support@alsanlab.cloud</a>
          </p>
        </div>

        <nav className="public-nav">
          <Link to="/pricing">Pricing</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support</Link>
        </nav>
      </div>
    </div>
  );
}
