import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Link } from "@remix-run/react";

import { login } from "../../shopify.server";
import { PublicPageShell } from "../../components/PublicPageShell";
import { ThreeDFeatureBox } from "../../components/ThreeDFeatureBox";
import "../../styles/public.css";

export const meta = () => [
  { title: "RankPilot AI Advance - AI Merchandising Copilot for Shopify" },
  { name: "description", content: "Find weak product titles, SEO gaps, missing tags, inventory issues, and product optimization opportunities before they hurt sales." }
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // If ?shop is present, redirect to the embedded app OAuth flow
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  return (
    <PublicPageShell>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">RankPilot AI Advance v1.0</div>
        <h1 className="hero-heading">AI Merchandising Copilot<br/>for Shopify</h1>
        <p className="hero-subheading">
          Find weak product titles, SEO gaps, missing tags, inventory issues, and product optimization opportunities before they hurt sales.
        </p>
        <div className="hero-buttons">
          <a href="https://apps.shopify.com" target="_blank" rel="noopener noreferrer" className="btn-primary">
            Install from Shopify App Store
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
          <Link to="/faq" className="btn-secondary">View FAQ</Link>
        </div>
        
        <div className="trust-section">
          <div className="trust-card">
            <svg className="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Merchant approval required
          </div>
          <div className="trust-card">
            <svg className="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            No protected customer data required
          </div>
          <div className="trust-card">
            <svg className="trust-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Built for Shopify admin workflows
          </div>
        </div>
      </section>

      {/* 3D Feature Box */}
      <ThreeDFeatureBox />

      {/* Features Grid (below hero) */}
      <section id="features">
        <h2 className="section-heading">Everything you need to optimize your catalog</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-card-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>AI Product Audits</h3>
            <p>Scan product titles, descriptions, tags, SEO fields, and merchandising quality automatically.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3>Smart SEO Suggestions</h3>
            <p>Generate merchant-ready product title and meta description improvements in seconds.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3>Tag & Catalog Cleanup</h3>
            <p>Find missing tags, weak product types, and inconsistent catalog data effortlessly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3>Inventory Risk Signals</h3>
            <p>Highlight low-stock and merchandising issues before they affect your sales.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3>Approval Workflow</h3>
            <p>Review, approve, reject, and apply AI suggestions safely without accidental changes.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3>Analytics Insights</h3>
            <p>Track product quality scores, issue counts, and your overall optimization progress.</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works">
        <h2 className="section-heading">How it Works</h2>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-badge">1</div>
            <div className="timeline-content">
              <h3>Sync Products</h3>
              <p>Connect your store and RankPilot securely syncs your product catalog.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-badge">2</div>
            <div className="timeline-content">
              <h3>Run AI Audit</h3>
              <p>Our advanced models scan your data to find gaps and optimization opportunities.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-badge">3</div>
            <div className="timeline-content">
              <h3>Review Suggestions</h3>
              <p>Easily review SEO, title, and tag improvements generated specifically for your products.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-badge">4</div>
            <div className="timeline-content">
              <h3>Apply Safely</h3>
              <p>Approve the suggestions you like, and they are instantly applied to your live store.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <h2 className="section-heading">Pricing tailored for your growth</h2>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-name">Free</div>
            <div className="pricing-price">$0<span>/mo</span></div>
            <div className="pricing-limits">
              Basic AI audits for small catalogs. Manual reviews only.
            </div>
            <a href="https://apps.shopify.com" className="pricing-cta">Get Started</a>
          </div>
          <div className="pricing-card">
            <div className="pricing-name">Starter</div>
            <div className="pricing-price">$19<span>/mo</span></div>
            <div className="pricing-limits">
              Up to 500 AI audits per month. Basic suggestions.
            </div>
            <a href="https://apps.shopify.com" className="pricing-cta">Get Started</a>
          </div>
          <div className="pricing-card popular">
            <div className="pricing-name">Growth</div>
            <div className="pricing-price">$49<span>/mo</span></div>
            <div className="pricing-limits">
              Up to 2,500 AI audits per month. Advanced SEO suggestions.
            </div>
            <a href="https://apps.shopify.com" className="pricing-cta">Get Started</a>
          </div>
          <div className="pricing-card">
            <div className="pricing-name">Pro</div>
            <div className="pricing-price">$99<span>/mo</span></div>
            <div className="pricing-limits">
              Up to 10,000 AI audits per month. Priority support.
            </div>
            <a href="https://apps.shopify.com" className="pricing-cta">Get Started</a>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          * Secure payments handled via Shopify Billing.
        </p>
      </section>
    </PublicPageShell>
  );
}
