import { PublicPageShell } from "../components/PublicPageShell";

export const meta = () => [
  { title: "RankPilot AI Terms of Service" },
  { name: "description", content: "Terms of Service for RankPilot AI Advance." }
];

export default function Terms() {
  return (
    <PublicPageShell>
      <div className="page-header">
        <h1 className="page-title">Terms of Service</h1>
        <p className="page-subtitle">Last updated: July 2026</p>
      </div>
      
      <div className="content-card">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By installing and using the RankPilot AI Advance app ("the App"), you agree to be bound by these Terms of Service. 
          If you do not agree to these terms, please do not use the App.
        </p>
        
        <h2>2. Use of the App</h2>
        <p>
          RankPilot AI Advance provides an AI-powered merchandising auditing tool for Shopify merchants. 
          You agree to use the App solely for its intended purpose of auditing and optimizing your own Shopify store catalog. 
          You may not reverse-engineer, exploit, or maliciously interfere with the App's services or APIs.
        </p>

        <h2>3. Merchant Responsibility and AI Disclaimer</h2>
        <p>
          The App utilizes advanced Artificial Intelligence (AI) and Large Language Models (LLMs) to generate suggestions for your product metadata (e.g., titles, descriptions, SEO tags). 
          While we strive for high quality, <strong>AI-generated content may occasionally be inaccurate, inappropriate, or misaligned with your brand voice.</strong>
        </p>
        <p>
          <strong>You are solely responsible for reviewing and approving all AI suggestions before applying them to your live store.</strong> 
          RankPilot AI Advance acts as a "Copilot"—a suggestion engine—not an autonomous agent. We do not automatically modify your live store data without your explicit approval via the App interface.
        </p>

        <h2>4. Billing and Plan Changes</h2>
        <p>
          All subscription fees are processed securely through the Shopify Billing API. 
          You will be billed according to the subscription plan you select. 
          You may upgrade, downgrade, or cancel your plan at any time through your Shopify Admin settings. 
          Partial months or unused quotas are handled according to standard Shopify Billing policies.
        </p>

        <h2>5. Service Availability</h2>
        <p>
          We aim to provide a highly reliable service. However, the App relies on third-party services, including Shopify's APIs and external AI providers. 
          We do not guarantee that the App will be uninterrupted, secure, or error-free at all times.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, RankPilot AI Advance and its creators (Alsan Lab) shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the App or the application of AI-generated suggestions to your store.
        </p>

        <h2>7. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or an in-app notification. 
          Your continued use of the App following any changes indicates your acceptance of the new Terms.
        </p>

        <h2>8. Contact Information</h2>
        <p>
          For any questions regarding these Terms of Service, please contact us at: <br/>
          <a href="mailto:support@alsanlab.cloud">support@alsanlab.cloud</a>
        </p>
      </div>
    </PublicPageShell>
  );
}
