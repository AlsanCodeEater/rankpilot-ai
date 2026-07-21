import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import "../styles/public.css";

interface PublicPageShellProps {
  children: React.ReactNode;
}

export function PublicPageShell({ children }: PublicPageShellProps) {
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="public-main-content">
        <div className="public-container">
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
