import Link from "next/link";
import { APPROVED_PROFILES } from "@/lib/approvedProfiles";

const ONE_PAGE_NAVIGATION = [
  { href: "/#about", label: "About" },
  { href: "/#work", label: "Work" },
  { href: "/#capabilities", label: "Capabilities" },
  { href: "/#publications", label: "Publications" },
  { href: "/#contact", label: "Contact" },
] as const;

const CAPABILITY_SUMMARIES = [
  { id: "marketing-systems", title: "Marketing systems", summary: "Brand, content, websites, CRM, automation, analytics, and reporting connected into one measurable operating path." },
  { id: "web-experience-ux-ui", title: "Web experience & UX/UI", summary: "Accessible interface design, creative technology, responsive systems, front-end engineering, motion, and performance working together." },
  { id: "ai-automation", title: "AI & automation", summary: "Human-controlled AI workflows, APIs, CRM handoffs, backend systems, and automation built around a defined operating problem." },
  { id: "seo-aeo-geo", title: "SEO, AEO & GEO", summary: "Technical access, clear entities, trustworthy content, answer-engine visibility, generative discovery, and useful destinations." },
  { id: "analytics-attribution", title: "Analytics & attribution", summary: "Evidence-led measurement across attention, engagement, conversion, pipeline progression, and outcomes—with attribution limits stated honestly." },
] as const;

export function HomepageAuthorityLinks() {
  return (
    <>
      <section className="home-capability-index" aria-labelledby="capability-index-title">
        <p className="home-authority-links__eyebrow">Capability index</p>
        <h2 id="capability-index-title">Five connected operating layers.</h2>
        <div>
          {CAPABILITY_SUMMARIES.map((capability) => (
            <article id={capability.id} key={capability.id}>
              <h3>{capability.title}</h3>
              <p>{capability.summary}</p>
              <Link href="/#capabilities">Experience the capability sequence</Link>
            </article>
          ))}
        </div>
      </section>
      <section id="contact" className="home-authority-links" aria-labelledby="contact-title">
      <p className="home-authority-links__eyebrow">Contact / verified profiles</p>
      <h2 id="contact-title">Connect with Tommy Pisano.</h2>
      <p>
        Explore the approved public profiles below for professional context and the
        contact path available on each platform. No private email address is published.
      </p>
      <nav className="home-authority-links__profiles" aria-label="Tommy Pisano public profiles">
        {APPROVED_PROFILES.map((profile) => (
          <a key={profile.url} href={profile.url} target="_blank" rel="noopener noreferrer">
            {profile.accessibleName}<span aria-hidden="true"> ↗</span>
          </a>
        ))}
      </nav>
      <nav className="home-authority-links__sections" aria-label="Ascend Vanta sections">
        {ONE_PAGE_NAVIGATION.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
      </nav>
      </section>
    </>
  );
}
