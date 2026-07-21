import Link from "next/link";
import { AUTHORITY_NAV } from "@/lib/authorityContent";

export function HomepageAuthorityLinks() {
  return (
    <section className="home-authority-links" aria-labelledby="explore-ascend-vanta">
      <p className="home-authority-links__eyebrow">Explore the system</p>
      <h2 id="explore-ascend-vanta">The work behind the experience.</h2>
      <p>Meet Tommy Pisano, examine the connected capabilities, and read the frameworks that shape Ascend Vanta.</p>
      <nav aria-label="Explore Ascend Vanta">
        {AUTHORITY_NAV.map((item) => <Link key={item.href} href={item.href}>{item.label}<span aria-hidden="true"> ↗</span></Link>)}
      </nav>
    </section>
  );
}
