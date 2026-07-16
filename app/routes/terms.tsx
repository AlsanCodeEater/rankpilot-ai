import { Link } from "@remix-run/react";
import "../styles/public.css";

export const meta = () => [
  { title: "Terms of Service | RankPilot AI Advance" }
];

export default function TermsOfService() {
  return (
    <div className="public-page">
      <div className="public-container">
        <header className="public-header">
          <span className="public-brand">RankPilot AI</span>
          <h1 className="public-heading">Terms of Service</h1>
          <p className="public-subheading">Last updated: {new Date().toLocaleDateString()}</p>
        </header>

        <div className="public-card">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By installing and using RankPilot AI Advance ("the App"), you agree to these Terms of Service. If you do not agree, 
            please uninstall the App immediately.
          </p>
          
          <h2>2. AI Merchandising Suggestions</h2>
          <p>
            The App provides AI-generated merchandising suggestions for your Shopify catalog. These are recommendations only. 
            <strong>You are solely responsible for reviewing and approving all suggestions before applying them to your live store.</strong>
          </p>

          <h2>3. No Guarantees</h2>
          <p>
            We do not guarantee any specific results, including improvements in search engine rankings (SEO), increased traffic, 
            or higher revenue. The AI suggestions are provided "as-is" without warranty of any kind.
          </p>

          <h2>4. Merchant Control</h2>
          <p>
            You maintain full control over your product data. The App will never automatically alter your product titles, 
            descriptions, tags, or SEO settings without your explicit initiation or approval via the App interface.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            In no event shall RankPilot AI Advance or its developers be liable for any direct, indirect, incidental, or 
            consequential damages arising out of your use of the App or reliance on its suggestions.
          </p>
          
          <h2>6. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at: <br/>
            <a href="mailto:support@alsanlab.cloud">support@alsanlab.cloud</a>
          </p>
        </div>

        <nav className="public-nav">
          <Link to="/pricing">Pricing</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/support">Support</Link>
        </nav>
      </div>
    </div>
  );
}
