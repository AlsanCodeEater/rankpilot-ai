import { PublicPageShell } from "../components/PublicPageShell";

export const meta = () => [
  { title: "RankPilot AI Privacy Policy" },
  { name: "description", content: "Privacy Policy for RankPilot AI Advance." }
];

export default function Privacy() {
  return (
    <PublicPageShell>
      <div className="page-header">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-subtitle">Last updated: July 2026</p>
      </div>
      
      <div className="content-card">
        <h2>1. Overview</h2>
        <p>
          This Privacy Policy describes how RankPilot AI Advance ("the App", "we", "us", or "our") collects, uses, and shares your personal and store data when you install or use the App in connection with your Shopify-supported store.
        </p>
        
        <h2>2. Data We Collect</h2>
        <p>When you install the App, we automatically access certain types of information from your Shopify account:</p>
        <ul>
          <li><strong>Store Information:</strong> Your store domain, email address, and basic shop settings to authenticate you and configure the app.</li>
          <li><strong>Product Data:</strong> We access your product titles, descriptions, tags, product types, SEO meta tags, and inventory levels. This is the core data required for the App to perform AI audits and generate merchandising suggestions.</li>
        </ul>
        <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', marginTop: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <strong style={{ color: 'var(--color-primary)' }}>Important Note on Customer Data:</strong>
          <p style={{ margin: '0.5rem 0 0 0' }}>For version 1.0, RankPilot AI Advance <strong>does not require, collect, or process any protected customer data</strong> (such as customer names, emails, addresses, or order details).</p>
        </div>

        <h2>3. How We Use Your Data</h2>
        <p>We use the collected information primarily to provide and improve the App's services:</p>
        <ul>
          <li>To perform AI-driven product audits and generate SEO/merchandising suggestions.</li>
          <li>To provide analytics insights regarding your catalog's health on the app dashboard.</li>
          <li>To process app billing securely via the Shopify Billing API.</li>
          <li>To communicate with you regarding app updates, support requests, or critical issues.</li>
        </ul>

        <h2>4. Data Sharing and Third Parties</h2>
        <p>
          We do not sell your store data. We share your data only in the following circumstances:
        </p>
        <ul>
          <li><strong>AI Processing:</strong> Product metadata is sent to secure, enterprise-grade LLM providers (e.g., OpenAI) solely for the purpose of generating suggestions. This data is not used to train public models.</li>
          <li><strong>Shopify:</strong> As an embedded app, we interact closely with Shopify's APIs to sync data and process billing.</li>
          <li><strong>Legal Compliance:</strong> If required by law or subpoena.</li>
        </ul>

        <h2>5. Data Retention and Deletion</h2>
        <p>
          We retain your product and store data only as long as you have the App installed. 
          If you uninstall the App, we comply with Shopify's mandatory data privacy webhooks. 
          All associated store data, AI suggestions, and analytics are permanently deleted from our active servers within 48 hours of uninstallation.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          As a merchant, you have the right to request access to or deletion of your data at any time. 
          If you wish to make a data request, please contact us using the information below.
        </p>

        <h2>7. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data handling practices, please contact us at: <br/>
          <a href="mailto:support@alsanlab.cloud">support@alsanlab.cloud</a>
        </p>
      </div>
    </PublicPageShell>
  );
}
