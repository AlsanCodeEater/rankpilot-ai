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
            <p className="plan-desc">Perfect for testing the AI capabilities.</p>
            <ul className="plan-features">
              <li>25 AI Audits per month</li>
              <li>10 Suggestion Applies per month</li>
              <li>Manual Suggestion Review</li>
            </ul>
            <a href="https://rankpilotai.alsanlab.cloud" className="plan-cta">Install for Free</a>
          </div>

          {/* Starter Plan */}
          <div className="pricing-plan">
            <h3 className="plan-name">Starter</h3>
            <div className="plan-price">$9<span>/mo</span></div>
            <p className="plan-desc">For growing stores ready to optimize.</p>
            <ul className="plan-features">
              <li>500 AI Audits per month</li>
              <li>100 Suggestion Applies per month</li>
              <li>Bulk Audit Enabled</li>
            </ul>
            <a href="https://rankpilotai.alsanlab.cloud" className="plan-cta">Start Free 7-Day Trial</a>
          </div>

          {/* Growth Plan */}
          <div className="pricing-plan popular">
            <span className="popular-badge">Most Popular</span>
            <h3 className="plan-name">Growth</h3>
            <div className="plan-price">$29<span>/mo</span></div>
            <p className="plan-desc">For established stores scaling their SEO.</p>
            <ul className="plan-features">
              <li>2,500 AI Audits per month</li>
              <li>500 Suggestion Applies per month</li>
              <li>Bulk Audit Enabled</li>
              <li>Basic Analytics</li>
            </ul>
            <a href="https://rankpilotai.alsanlab.cloud" className="plan-cta">Start Free 7-Day Trial</a>
          </div>

          {/* Pro Plan */}
          <div className="pricing-plan">
            <h3 className="plan-name">Pro</h3>
            <div className="plan-price">$79<span>/mo</span></div>
            <p className="plan-desc">Uncapped potential for large catalogs.</p>
            <ul className="plan-features">
              <li>10,000 AI Audits per month</li>
              <li>2,000 Suggestion Applies per month</li>
              <li>Bulk Audit Enabled</li>
              <li>Advanced Analytics</li>
              <li>Priority Support</li>
            </ul>
            <a href="https://rankpilotai.alsanlab.cloud" className="plan-cta">Contact Sales</a>
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
