import { Link } from "@remix-run/react";
import { useState } from "react";

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="public-header-glass">
      <div className="public-header-inner">
        <Link to="/" className="header-brand">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="url(#gradient-brand)">
            <defs>
              <linearGradient id="gradient-brand" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>RankPilot AI</span>
        </Link>
        
        <nav className={`header-nav ${mobileOpen ? "mobile-open" : ""}`}>
          <Link to="/#features" onClick={() => setMobileOpen(false)}>Features</Link>
          <Link to="/#how-it-works" onClick={() => setMobileOpen(false)}>How it works</Link>
          <Link to="/#pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <Link to="/faq" onClick={() => setMobileOpen(false)}>FAQ</Link>
          <Link to="/support" onClick={() => setMobileOpen(false)}>Support</Link>
          <a 
            href="https://apps.shopify.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="header-cta"
          >
            Install App
          </a>
        </nav>

        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
