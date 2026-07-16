import { Link } from "@remix-run/react";
import "../styles/public.css";

export const meta = () => [
  { title: "Support | RankPilot AI Advance" }
];

export default function Support() {
  return (
    <div className="public-page">
      <div className="public-container">
        <header className="public-header">
          <span className="public-brand">RankPilot AI</span>
          <h1 className="public-heading">Support & Contact</h1>
          <p className="public-subheading">Need help with RankPilot AI Advance? We're here for you.</p>
        </header>

        <div className="public-card">
          <h2>Email Support</h2>
          <p>
            For general inquiries, bug reports, and assistance with using the app, please email us at:
          </p>
          <p>
            <a href="mailto:support@alsanlab.cloud" style={{ fontSize: "1.25rem", fontWeight: "600" }}>
              support@alsanlab.cloud
            </a>
          </p>
          <p>
            <strong>Response Time:</strong> We aim to respond to all inquiries within 1-2 business days.
          </p>

          <h2>Emergency Technical Contact</h2>
          <p>
            If your store is experiencing critical issues directly caused by the app (e.g., store downtime or corrupted product data), 
            please include <strong>[URGENT]</strong> in your email subject line. Our on-call technical team will prioritize your request.
          </p>

          <h2>FAQ & Documentation</h2>
          <p>
            You can find guidance on how to audit products, review AI suggestions, and manage your plan directly inside the app's Dashboard 
            and Settings pages. Alternatively, check out our <Link to="/faq">FAQ page</Link>.
          </p>
        </div>

        <nav className="public-nav">
          <Link to="/pricing">Pricing</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </nav>
      </div>
    </div>
  );
}
