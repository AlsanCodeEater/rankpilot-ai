import { Link } from "@remix-run/react";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="footer-inner">
        <div className="footer-links">
          <Link to="/faq">FAQ</Link>
          <Link to="/support">Support</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <a href="mailto:support@alsanlab.cloud">Contact: support@alsanlab.cloud</a>
        </div>
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} RankPilot AI Advance. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
