import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/authority/Breadcrumbs";
import { StructuredData } from "@/components/authority/StructuredData";
import { PUBLICATIONS } from "@/lib/authorityContent";
import { authorityMetadata } from "@/lib/authorityMetadata";
import { absoluteUrl, PERSON_ID, WEBSITE_ID } from "@/lib/siteMetadata";

const description = "Read Tommy Pisano’s field guides on SEO and AI search, connected content systems, and measurable marketing growth.";
export const metadata: Metadata = authorityMetadata({ title: "Publications", description, path: "/publications", image: "/assets/publications/search-survival/page-01.webp", imageAlt: "Ascend Intelligence publication covers", imageWidth: 1122, imageHeight: 1402 });
export default function PublicationsPage() { const path = "/publications"; return <><StructuredData data={{ "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage", "@id": `${absoluteUrl(path)}#webpage`, url: absoluteUrl(path), name: "Publications", description, isPartOf: { "@id": WEBSITE_ID }, author: { "@id": PERSON_ID }, hasPart: PUBLICATIONS.map((item) => ({ "@type": "CreativeWork", name: item.title, url: absoluteUrl(`${path}/${item.slug}`), author: { "@id": PERSON_ID } })) }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Publications", item: absoluteUrl(path) }] }] }} /><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Publications" }]} /><header className="authority-hero"><p className="authority-eyebrow">Ascend Intelligence</p><h1>Publications</h1><p className="authority-lede">Crawlable field guides that explain how discovery, content, experience, follow-up, and measurement become a connected operating system.</p></header><div className="authority-card-grid">{PUBLICATIONS.map((item) => <Link className="authority-card" href={`/publications/${item.slug}`} key={item.slug}><small>Field guide · {item.pageCount} pages</small><h2>{item.title}</h2><p>{item.deckTitle}</p></Link>)}</div></>; }
