import Image from "next/image";
import Link from "next/link";
import type { Capability } from "@/lib/authorityContent";
import { CAPABILITIES, PUBLICATIONS } from "@/lib/authorityContent";
import { absoluteUrl, PERSON_ID, WEBSITE_ID } from "@/lib/siteMetadata";
import { Breadcrumbs } from "./Breadcrumbs";
import { StructuredData } from "./StructuredData";

export function CapabilityPage({ capability }: { capability: Capability }) {
  const path = `/capabilities/${capability.slug}`;
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Capabilities", href: "/capabilities" },
    { label: capability.title },
  ];
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${absoluteUrl(path)}#webpage`, url: absoluteUrl(path), name: capability.title, description: capability.description, isPartOf: { "@id": WEBSITE_ID }, about: { "@id": PERSON_ID }, author: { "@id": PERSON_ID } },
      { "@type": "BreadcrumbList", "@id": `${absoluteUrl(path)}#breadcrumbs`, itemListElement: breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.label, item: absoluteUrl(item.href ?? path) })) },
    ],
  };

  return (
    <>
      <StructuredData data={graph} />
      <Breadcrumbs items={breadcrumbs} />
      <header className="authority-hero">
        <p className="authority-eyebrow">Connected capability</p>
        <h1>{capability.title}</h1>
        <p className="authority-lede">{capability.description}</p>
      </header>
      <figure className="authority-feature-image">
        <Image src={capability.image} alt={capability.imageAlt} width={1672} height={941} sizes="(max-width: 900px) 100vw, 1100px" priority />
      </figure>
      <div className="authority-prose authority-prose--wide">
        <section><h2>What this capability means</h2><p>{capability.definition}</p></section>
        <section><h2>The problem it solves</h2><p>{capability.problem}</p></section>
        <section><h2>Tommy’s perspective</h2><p>{capability.perspective}</p></section>
        <section><h2>How it connects</h2><p>{capability.connections}</p></section>
        <section>
          <h2>Operating model</h2>
          <ol className="authority-process">{capability.process.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol>
        </section>
        <section><h2>Relevant tools</h2><ul className="authority-tags">{capability.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul></section>
        <section><h2>Measurement approach</h2><p>{capability.measurement}</p></section>
        <section>
          <h2>Supporting publications</h2>
          <div className="authority-link-grid">{capability.relatedPublications.map((slug) => { const publication = PUBLICATIONS.find((item) => item.slug === slug)!; return <Link key={slug} href={`/publications/${slug}`}><strong>{publication.title}</strong><span>{publication.description}</span></Link>; })}</div>
        </section>
        <section>
          <h2>Related capabilities</h2>
          <div className="authority-link-grid">{capability.relatedCapabilities.map((slug) => { const related = CAPABILITIES.find((item) => item.slug === slug)!; return <Link key={slug} href={`/capabilities/${slug}`}><strong>{related.title}</strong><span>{related.description}</span></Link>; })}</div>
        </section>
        <aside className="authority-next"><h2>See the system in context</h2><p><Link href="/work">Review selected work</Link>, learn more <Link href="/about">about Tommy Pisano</Link>, or use the <Link href="/contact">contact path</Link>.</p></aside>
      </div>
    </>
  );
}
