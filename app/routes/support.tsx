import { PublicPageShell } from "../components/PublicPageShell";
import { Link } from "@remix-run/react";

export const meta = () => [
  { title: "RankPilot AI Support" },
  { name: "description", content: "Get help and support for RankPilot AI Advance." }
];

export default function Support() {
  return (
    <PublicPageShell>
      <div className="page-header">
        <h1 className="page-title">Support & Help Center</h1>
        <p className="page-subtitle">We're here to help you get the most out of RankPilot AI Advance.</p>
      </div>
      
      <div className="content-card">
        <h2>Contact Support</h2>
        <p>If you need assistance, the fastest way to reach us is via email. We normally respond within <strong>1–2 business days</strong>.</p>
        <p>
          <a href="mailto:support@alsanlab.cloud" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            support@alsanlab.cloud
          </a>
        </p>
      </div>

      <div className="content-card">
        <h2>What to include when reporting an issue</h2>
        <p>To help us resolve your issue quickly, please include the following in your email:</p>
        <ul>
          <li>Your `myshopify.com` store URL.</li>
          <li>A detailed description of the issue or error you are seeing.</li>
          <li>Screenshots or screen recordings (if applicable).</li>
          <li>The steps to reproduce the issue.</li>
        </ul>
      </div>

      <div className="content-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        <div>
          <h3>Billing Help</h3>
          <p>All billing is securely managed by Shopify. If you have questions about your subscription charges, plan upgrades, or downgrades, you can view your invoice directly in your Shopify Admin under Settings &gt; Billing.</p>
        </div>
        <div>
          <h3>Product Audit Help</h3>
          <p>If the AI is generating suggestions that don't fit your brand voice, make sure to utilize the manual review step. You are never forced to apply a suggestion. If an audit fails, simply use the 'Retry' button.</p>
        </div>
        <div>
          <h3>App Installation Help</h3>
          <p>Ensure you are installing RankPilot AI directly from the official Shopify App Store. The app requires permission to read and write your product data to function correctly.</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <Link to="/" className="btn-secondary">Return to Home</Link>
      </div>
    </PublicPageShell>
  );
}
