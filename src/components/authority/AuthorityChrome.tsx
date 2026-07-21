import Image from "next/image";
import Link from "next/link";
import { AUTHORITY_NAV } from "@/lib/authorityContent";

export function AuthorityHeader() {
  return (
    <header className="authority-header">
      <Link className="authority-brand" href="/" aria-label="Ascend Vanta homepage">
        <Image src="/assets/brand/ascend-vanta-corner-logo.png" alt="Ascend Vanta" width={414} height={74} priority />
      </Link>
      <nav aria-label="Primary navigation">
        <ul>
          {AUTHORITY_NAV.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
        </ul>
      </nav>
    </header>
  );
}

export function AuthorityFooter() {
  return (
    <footer className="authority-footer">
      <p>Ascend Vanta is Tommy Pisano’s personal portfolio and creative-technology platform.</p>
      <nav aria-label="Footer navigation">
        <Link href="/">Home</Link>
        {AUTHORITY_NAV.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
      </nav>
    </footer>
  );
}
