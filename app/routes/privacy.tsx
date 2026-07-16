export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", padding: "40px 20px", lineHeight: "1.6", color: "#333" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>1. Introduction</h2>
      <p>
        RankPilot AI Advance ("we", "our", or "us") is an AI merchandising copilot for Shopify stores. 
        This Privacy Policy explains how we collect, use, and protect your data when you install our app.
      </p>
      
      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>2. Data We Collect</h2>
      <p>
        Our app strictly uses product and catalog data to generate AI merchandising suggestions. The AI provider may process 
        product titles, descriptions, tags, SEO fields, inventory status, and product metadata.
      </p>

      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>3. Customer Data Protection</h2>
      <p>
        <strong>No protected customer or order data is required or collected.</strong> We do not store or process 
        personally identifiable information (PII) such as customer emails, phone numbers, addresses, customer IDs, 
        customer names, or order data. Our system is designed entirely around product optimization, not customer tracking.
      </p>

      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>4. Data Retention & Deletion</h2>
      <p>
        Merchants can uninstall the app at any time via their Shopify Admin. Upon uninstallation, all shop-related app data 
        (including products, generated AI suggestions, and settings) is permanently deleted in accordance with Shopify's 
        data redaction policies.
      </p>

      <h2 style={{ marginTop: "30px", fontSize: "1.5rem" }}>5. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at: <br/>
        <a href="mailto:support@alsanlab.cloud" style={{ color: "#005bd3", textDecoration: "none" }}>support@alsanlab.cloud</a>
      </p>
    </div>
  );
}
