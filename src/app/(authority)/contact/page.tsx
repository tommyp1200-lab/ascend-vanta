import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/authority/Breadcrumbs";
import { StructuredData } from "@/components/authority/StructuredData";
import { authorityMetadata } from "@/lib/authorityMetadata";
import { absoluteUrl, PERSON_ID, WEBSITE_ID } from "@/lib/siteMetadata";

const description = "Prepare a focused project inquiry for Tommy Pisano covering the problem, system, constraints, evidence, and desired next step.";
export const metadata: Metadata = authorityMetadata({ title: "Contact Tommy Pisano", description, path: "/contact" });
export default function ContactPage() { const path = "/contact"; return <><StructuredData data={{ "@context": "https://schema.org", "@graph": [{ "@type": "ContactPage", "@id": `${absoluteUrl(path)}#webpage`, url: absoluteUrl(path), name: "Contact Tommy Pisano", description, isPartOf: { "@id": WEBSITE_ID }, about: { "@id": PERSON_ID } }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Contact Tommy Pisano", item: absoluteUrl(path) }] }] }} /><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact Tommy Pisano" }]} /><header className="authority-hero"><p className="authority-eyebrow">Contact path</p><h1>Start with the problem worth connecting.</h1><p className="authority-lede">The best first conversation has enough context to distinguish a missing deliverable from a broken connection across message, experience, technology, workflow, or measurement.</p></header><div className="authority-prose">
  <section><h2>Prepare a useful inquiry</h2><p>Include the current situation, who the system serves, the behavior or outcome that needs to change, what has already been tried, important technical or operational constraints, and the evidence available today.</p></section>
  <section><h2>Useful starting questions</h2><ul><li>Where does the customer journey begin, and where does it break?</li><li>Which teams, tools, and handoffs are part of the current path?</li><li>What would a credible improvement look like?</li><li>Which deadlines, platforms, access requirements, or compliance constraints matter?</li><li>What evidence can be used to evaluate the change?</li></ul></section>
  <section><h2>Direct contact channel</h2><p>A public email address or approved external profile is not present in the verified source material. This page deliberately does not invent one. The direct contact channel remains pending Tommy’s approval; until then, review <Link href="/about">Tommy’s background</Link>, <Link href="/work">selected work</Link>, and <Link href="/capabilities">capabilities</Link> to prepare the inquiry.</p></section>
  </div></>; }
