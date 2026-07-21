import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/authority/Breadcrumbs";
import { StructuredData } from "@/components/authority/StructuredData";
import { CAPABILITIES, PUBLICATIONS } from "@/lib/authorityContent";
import { authorityMetadata } from "@/lib/authorityMetadata";
import { absoluteUrl, PERSON_ID, WEBSITE_ID } from "@/lib/siteMetadata";

const description = "Meet Tommy Pisano, a senior UX/UI designer, creative technologist, and growth systems architect who builds the systems behind growth.";
export const metadata: Metadata = authorityMetadata({ title: "About Tommy Pisano", description, path: "/about" });

export default function AboutPage() {
  const path = "/about";
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": ["ProfilePage", "WebPage"], "@id": `${absoluteUrl(path)}#webpage`, url: absoluteUrl(path), name: "About Tommy Pisano", description, isPartOf: { "@id": WEBSITE_ID }, mainEntity: { "@id": PERSON_ID } },
    { "@type": "Person", "@id": PERSON_ID, name: "Tommy Pisano", url: absoluteUrl(path), jobTitle: "Senior UX/UI Designer, Creative Technologist, and Growth Systems Architect", description: "A modern marketing builder with more than 20 years of experience across creative, technical, analytical, and operational disciplines.", knowsAbout: ["Branding", "UX/UI design", "Front-end development", "Back-end development", "Automation", "CRM architecture", "Analytics", "Content systems", "Social media", "SEO", "AEO", "GEO", "Lead generation"] },
    { "@type": "BreadcrumbList", "@id": `${absoluteUrl(path)}#breadcrumbs`, itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "About Tommy Pisano", item: absoluteUrl(path) }] },
  ] };
  return <><StructuredData data={graph} /><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About Tommy Pisano" }]} /><header className="authority-hero" id="person"><p className="authority-eyebrow">The person behind Ascend Vanta</p><h1>Tommy Pisano builds the machine behind growth.</h1><p className="authority-lede">A senior UX/UI designer, creative technologist, and growth systems architect connecting brand, experience, content, CRM, automation, search, analytics, and reporting.</p></header><div className="authority-prose authority-prose--wide">
    <section><h2>One builder across the system</h2><p>Tommy is a modern marketing builder with more than 20 years of experience across design, branding, digital marketing, content creation, CRM, analytics, automation, AI, front-end and back-end development, software engineering, and social media management. Ascend Vanta is his personal portfolio and creative-technology platform.</p><p>That range is useful because customers do not experience an organization by department. They encounter a message, an interface, a response, and a sequence of decisions. Tommy works across those boundaries to make the sequence coherent.</p></section>
    <section><h2>A systems-based marketing perspective</h2><p>Marketing is not a stack of disconnected deliverables. Brand shapes the promise. Design and content make it legible. Technology creates the experience. CRM and automation preserve intent. Analytics reveals what happened. Operations determine whether the system keeps its promise after the click.</p><p>Tommy’s perspective is whole-system, build-and-connect, and measurable. The goal is not to add complexity. It is to identify the few connections that make the work easier to understand, operate, and improve.</p></section>
    <section><h2>Creative, technical, analytical, operational</h2><div className="authority-link-grid">{CAPABILITIES.map((item) => <Link href={`/capabilities/${item.slug}`} key={item.slug}><strong>{item.title}</strong><span>{item.description}</span></Link>)}</div></section>
    <section><h2>Verified tools and technologies</h2><ul className="authority-tags">{["Adobe Creative Suite", "HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "GSAP", "Lenis", "Three.js", "Python", "Flask", "Node.js", "APIs", "SQL", "Supabase", "Firebase", "Zapier", "Make", "n8n", "Google Analytics", "Google Search Console", "Tag Manager", "Looker Studio", "Microsoft Clarity", "Hotjar", "Schema markup"].map((tool) => <li key={tool}>{tool}</li>)}</ul></section>
    <section><h2>Operating principles</h2><ol className="authority-process"><li><h3>See the whole path</h3><p>Start with the audience, intended change, handoffs, and evidence—not an isolated channel.</p></li><li><h3>Build and connect</h3><p>Bring creative intent and technical implementation into the same working model.</p></li><li><h3>Make it understandable</h3><p>Use clear language, accessible interfaces, explicit ownership, and inspectable systems.</p></li><li><h3>Measure honestly</h3><p>Separate activity from outcomes and state the limits of the available evidence.</p></li></ol></section>
    <section><h2>Selected work</h2><p>The cinematic homepage is the primary demonstration of Tommy’s integrated design, engineering, motion, 3D, performance, and responsive-systems work. <Link href="/work">Review the Ascend Vanta build as a connected case study.</Link></p></section>
    <section><h2>Publications</h2><div className="authority-link-grid">{PUBLICATIONS.map((item) => <Link href={`/publications/${item.slug}`} key={item.slug}><strong>{item.title}</strong><span>{item.deckTitle}</span></Link>)}</div></section>
    <aside className="authority-next"><h2>Start with the problem</h2><p>Use the <Link href="/contact">contact path</Link> to prepare a focused project inquiry and see what information will make the first conversation useful.</p></aside>
  </div></>;
}
