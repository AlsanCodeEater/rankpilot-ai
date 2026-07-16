import { Link } from "@remix-run/react";
import "../styles/public.css";

export const meta = () => [
  { title: "Pricing | RankPilot AI Advance" }
];

export default function Pricing() {
  return (
    <div className="public-page">
      <div className="public-container">
        <header className="public-header">
          <span className="public-brand">RankPilot AI</span>
          <h1 className="public-heading">Simple, transparent pricing</h1>
          <p className="public-subheading">Choose the plan that best fits your store's inventory size and AI optimization needs.</p>
        </header>

        <div className="pricing-grid">
          {/* Free Plan */}
          <div className="pricing-plan">
            <h3 className="plan-name">Free</h3>
            <div className="plan-price">$0<span>/mo</span></div>
            <p className="plan-desc">Perfect for testing the AI capabilities on a small selection of products.</p>
            <ul className="plan-features">
              <li>Up to 50 Products Synced</li>
              <li>10 AI Audits per month</li>
              <li>Basic Title & Description SEO</li>
              <li>Manual Suggestion Review</li>
            </ul>
            <a href="https://rankpilotai.alsanlab.cloud" className="plan-cta">Install for Free</a>
          </div>

          {/* Pro Plan */}
          <div className="pricing-plan popular">
            <span className="popular-badge">Most Popular</span>
            <h3 className="plan-name">Pro</h3>
            <div className="plan-price">$29<span>/mo</span></div>
            <p className="plan-desc">For growing stores that need comprehensive catalog optimization.</p>
            <ul className="plan-features">
              <li>Up to 1,000 Products Synced</li>
              <li>250 AI Audits per month</li>
              <li>Advanced SEO & Keyword Gap Analysis</li>
              <li>Missing Tags & Inventory Warnings</li>
              <li>Priority Support</li>
            </ul>
            <a href="https://rankpilotai.alsanlab.cloud" className="plan-cta">Start Free 7-Day Trial</a>
          </div>

          {/* Advanced Plan */}
          <div className="pricing-plan">
            <h3 className="plan-name">Advance</h3>
            <div className="plan-price">$79<span>/mo</span></div>
            <p className="plan-desc">Uncapped potential for large catalogs and high-volume merchants.</p>
            <ul className="plan-features">
              <li>Up to 10,000 Products Synced</li>
              <li>Unlimited AI Audits</li>
              <li>Bulk Apply Suggestions</li>
              <li>Early Access to Beta Features</li>
              <li>Dedicated Account Manager</li>
            </ul>
            <a href="mailto:support@alsanlab.cloud?subject=Advance%20Plan%20Inquiry" className="plan-cta">Contact Sales</a>
          </div>
        </div>

        <nav className="public-nav" style={{ marginTop: '4rem' }}>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/support">Support</Link>
        </nav>
      </div>
    </div>
  );
}
