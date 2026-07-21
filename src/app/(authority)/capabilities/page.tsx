import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/authority/Breadcrumbs";
import { StructuredData } from "@/components/authority/StructuredData";
import { CAPABILITIES } from "@/lib/authorityContent";
import { authorityMetadata } from "@/lib/authorityMetadata";
import { absoluteUrl, PERSON_ID, WEBSITE_ID } from "@/lib/siteMetadata";

const description = "Explore how Tommy Pisano connects marketing systems, web experience, AI automation, search visibility, analytics, and attribution.";
export const metadata: Metadata = authorityMetadata({ title: "Capabilities", description, path: "/capabilities" });

export default function CapabilitiesPage() {
  const path = "/capabilities";
  return <><StructuredData data={{ "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage", "@id": `${absoluteUrl(path)}#webpage`, url: absoluteUrl(path), name: "Capabilities", description, isPartOf: { "@id": WEBSITE_ID }, about: { "@id": PERSON_ID }, hasPart: CAPABILITIES.map((item) => ({ "@type": "WebPage", name: item.title, url: absoluteUrl(`${path}/${item.slug}`) })) }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Capabilities", item: absoluteUrl(path) }] }] }} /><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Capabilities" }]} /><header className="authority-hero"><p className="authority-eyebrow">Connected expertise</p><h1>Capabilities</h1><p className="authority-lede">Tommy builds across creative, technical, analytical, and operational layers so the customer journey works as one system.</p></header><div className="authority-card-grid">{CAPABILITIES.map((item) => <Link className="authority-card" href={`/capabilities/${item.slug}`} key={item.slug}><small>Capability</small><h2>{item.title}</h2><p>{item.description}</p></Link>)}</div></>;
}
