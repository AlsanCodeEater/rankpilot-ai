import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.mainLayout}>
          
          <header className={styles.header}>
            <span className={styles.brand}>RankPilot AI</span>
            <h1 className={styles.heading}>AI Merchandising Copilot for Shopify</h1>
            <p className={styles.subheading}>
              Find weak product titles, SEO gaps, missing tags, stock issues, and product optimization opportunities before they hurt sales.
            </p>
          </header>

          {showForm && (
            <div className={styles.loginCard}>
              <div className={styles.loginHeader}>
                <h2>Ready to scale?</h2>
                <p>Install RankPilot AI from the Shopify App Store.</p>
              </div>
              <div className={styles.form}>
                <a 
                  className={styles.button} 
                  href="https://apps.shopify.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  Install from Shopify App Store
                </a>
              </div>
              
              <div className={styles.trustBadges}>
                <div className={styles.badge}>
                  <svg className={styles.badgeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Merchant approval required
                </div>
                <div className={styles.badge}>
                  <svg className={styles.badgeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  No customer data used
                </div>
                <div className={styles.badge}>
                  <svg className={styles.badgeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Built for Shopify workflows
                </div>
              </div>
            </div>
          )}

          <div className={styles.features}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>AI Product Audits</h3>
              <p>Automatically scan your entire catalog for missing descriptions, tags, product types, and poor quality text.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3>Smart SEO Suggestions</h3>
              <p>Generate high-converting SEO titles and descriptions using advanced LLM analysis of your products.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3>Merchandising Insights</h3>
              <p>Find missing search keywords and critical inventory gaps that are causing you to lose potential sales.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
