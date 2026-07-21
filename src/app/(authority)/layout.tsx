import { AuthorityFooter, AuthorityHeader } from "@/components/authority/AuthorityChrome";
import "./authority.css";

export default function AuthorityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="authority-site">
      <a className="authority-skip-link" href="#main-content">Skip to main content</a>
      <AuthorityHeader />
      <main id="main-content" className="authority-main">{children}</main>
      <AuthorityFooter />
    </div>
  );
}
