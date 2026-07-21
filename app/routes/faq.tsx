import { PublicPageShell } from "../components/PublicPageShell";
import { FAQAccordion } from "../components/FAQAccordion";
import { Link } from "@remix-run/react";

export const meta = () => [
  { title: "RankPilot AI FAQ" },
  { name: "description", content: "Frequently asked questions about RankPilot AI Advance for Shopify." }
];

const faqItems = [
  {
    question: "What does RankPilot AI do?",
    answer: "RankPilot AI securely analyzes your Shopify product catalog—including titles, descriptions, SEO tags, and inventory data. It uses advanced AI to identify gaps, missing tags, and optimization opportunities, providing actionable suggestions to improve your product merchandising and SEO."
  },
  {
    question: "Does RankPilot AI change my products automatically?",
    answer: "No. You maintain 100% control over your store. RankPilot generates suggestions that you review. A suggestion is only applied to your live Shopify product if you explicitly click the \"Apply\" button."
  },
  {
    question: "Can I review AI suggestions before applying them?",
    answer: "Yes, absolutely. The core of RankPilot AI Advance is its Approval Workflow. Every suggestion is presented to you with the current value and the proposed AI value. You can approve, edit, or reject any suggestion before it affects your store."
  },
  {
    question: "Does the app use customer data?",
    answer: "No. For version 1.0, RankPilot AI Advance strictly collects and uses product-related data (metadata, stock, titles, tags, etc.) necessary for the AI to audit your catalog. We do not require, collect, or process any protected customer data, emails, or order details."
  },
  {
    question: "Which product fields can be audited?",
    answer: "RankPilot AI audits Product Titles, HTML Descriptions, Product Types, Vendor, Tags, SEO Title (Meta Title), and SEO Description (Meta Description). It also checks inventory levels to flag out-of-stock items that might be hurting your merchandising."
  },
  {
    question: "Can I use it for large catalogs?",
    answer: "Yes, RankPilot AI is built to handle Shopify catalogs of varying sizes. However, the number of AI audits you can perform per month depends on your pricing plan. Higher tier plans are designed for larger catalogs."
  },
  {
    question: "What happens if an AI audit fails?",
    answer: "Occasionally, an AI audit might fail due to rate limits or temporary network issues. When this happens, our system automatically logs the error and allows you to easily retry the audit for that specific product from your dashboard without counting against your quota."
  },
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time directly from the Settings page inside your Shopify Admin. All billing is securely handled through Shopify Billing."
  },
  {
    question: "Is it built for Shopify workflows?",
    answer: "Yes. RankPilot AI Advance is an embedded Shopify app. This means it lives directly inside your Shopify Admin, uses Shopify's official design system (Polaris) for its internal dashboard, and utilizes Shopify's secure OAuth and Billing APIs."
  }
];

export default function FAQ() {
  return (
    <PublicPageShell>
      <div className="page-header">
        <h1 className="page-title">Frequently Asked Questions</h1>
        <p className="page-subtitle">Everything you need to know about how RankPilot AI Advance works.</p>
      </div>
      
      <FAQAccordion items={faqItems} />

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Still have questions?</p>
        <Link to="/support" className="btn-secondary">Contact Support</Link>
      </div>
    </PublicPageShell>
  );
}
