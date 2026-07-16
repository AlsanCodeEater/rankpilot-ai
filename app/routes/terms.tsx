export default function TermsOfService() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", padding: "40px 20px", lineHeight: "1.6", color: "#333" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>1. Acceptance of Terms</h2>
      <p>
        By installing and using RankPilot AI Advance ("the App"), you agree to these Terms of Service. If you do not agree, 
        please uninstall the App immediately.
      </p>
      
      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>2. AI Merchandising Suggestions</h2>
      <p>
        The App provides AI-generated merchandising suggestions for your Shopify catalog. These are recommendations only. 
        <strong>You are solely responsible for reviewing and approving all suggestions before applying them to your live store.</strong>
      </p>

      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>3. No Guarantees</h2>
      <p>
        We do not guarantee any specific results, including improvements in search engine rankings (SEO), increased traffic, 
        or higher revenue. The AI suggestions are provided "as-is" without warranty of any kind.
      </p>

      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>4. Merchant Control</h2>
      <p>
        You maintain full control over your product data. The App will never automatically alter your product titles, 
        descriptions, tags, or SEO settings without your explicit initiation or approval via the App interface.
      </p>

      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>5. Limitation of Liability</h2>
      <p>
        In no event shall RankPilot AI Advance or its developers be liable for any direct, indirect, incidental, or 
        consequential damages arising out of your use of the App or reliance on its suggestions.
      </p>
      
      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>6. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at: <br/>
        <a href="mailto:support@alsanlab.cloud" style={{ color: "#005bd3", textDecoration: "none" }}>support@alsanlab.cloud</a>
      </p>
    </div>
  );
}
