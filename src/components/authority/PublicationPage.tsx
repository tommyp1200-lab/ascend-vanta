import Image from "next/image";
import Link from "next/link";
import type { Publication } from "@/lib/authorityContent";
import { CAPABILITIES, PUBLICATIONS } from "@/lib/authorityContent";
import { absoluteUrl, PERSON_ID, WEBSITE_ID } from "@/lib/siteMetadata";
import { Breadcrumbs } from "./Breadcrumbs";
import { StructuredData } from "./StructuredData";

export function PublicationPage({ publication }: { publication: Publication }) {
  const path = `/publications/${publication.slug}`;
  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Publications", href: "/publications" }, { label: publication.title }];
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${absoluteUrl(path)}#webpage`, url: absoluteUrl(path), name: publication.title, description: publication.description, isPartOf: { "@id": WEBSITE_ID }, about: { "@id": PERSON_ID } },
      { "@type": "CreativeWork", "@id": `${absoluteUrl(path)}#publication`, url: absoluteUrl(path), name: publication.title, alternateName: publication.deckTitle, abstract: publication.summary, author: { "@id": PERSON_ID }, creator: { "@id": PERSON_ID }, image: absoluteUrl(`/assets/publications/${publication.folder}/page-01.webp`), inLanguage: "en-US", isPartOf: { "@id": WEBSITE_ID } },
      { "@type": "BreadcrumbList", "@id": `${absoluteUrl(path)}#breadcrumbs`, itemListElement: breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.label, item: absoluteUrl(item.href ?? path) })) },
    ],
  };

  return (
    <>
      <StructuredData data={graph} />
      <Breadcrumbs items={breadcrumbs} />
      <article>
        <header className="authority-hero authority-hero--publication">
          <p className="authority-eyebrow">Ascend Intelligence · Field guide</p>
          <h1>{publication.title}</h1>
          <p className="authority-deck">{publication.deckTitle}</p>
          <p className="authority-lede">{publication.description}</p>
          <p className="authority-byline">By <Link href="/about">Tommy Pisano</Link> · Publication date not supplied in the source edition</p>
        </header>
        <figure className="publication-cover"><Image src={`/assets/publications/${publication.folder}/page-01.webp`} alt={`${publication.title} cover: ${publication.deckTitle}`} width={1122} height={1402} sizes="(max-width: 800px) 92vw, 620px" priority /></figure>
        <div className="authority-prose">
          <section><h2>Summary</h2><p>{publication.summary}</p></section>
          <nav className="publication-toc" aria-label="On this page"><h2>On this page</h2><ol>{publication.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}<li><a href="#visual-edition">Visual edition</a></li></ol></nav>
          <section><h2>Key takeaways</h2><ul>{publication.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}</ul></section>
          {publication.sections.map((section) => <section id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
          <section id="visual-edition">
            <h2>Original visual edition</h2>
            <p>The complete source edition is presented below as authored page images. No PDF exists in the repository, so this page does not offer a fabricated download. The summary above provides an accessible, crawlable HTML interpretation of the verified source material.</p>
            <div className="publication-pages">{Array.from({ length: publication.pageCount }, (_, index) => { const page = index + 1; return <figure key={page}><Image src={`/assets/publications/${publication.folder}/page-${String(page).padStart(2, "0")}.webp`} alt={`${publication.title}, page ${page} of ${publication.pageCount}`} width={1122} height={1402} loading="lazy" sizes="(max-width: 800px) 92vw, 700px" /><figcaption>Page {page} of {publication.pageCount}</figcaption></figure>; })}</div>
          </section>
          <section><h2>Related capabilities</h2><div className="authority-link-grid">{publication.relatedCapabilities.map((slug) => { const capability = CAPABILITIES.find((item) => item.slug === slug)!; return <Link href={`/capabilities/${slug}`} key={slug}><strong>{capability.title}</strong><span>{capability.description}</span></Link>; })}</div></section>
          <section><h2>Continue reading</h2><div className="authority-link-grid">{publication.relatedPublications.map((slug) => { const related = PUBLICATIONS.find((item) => item.slug === slug)!; return <Link href={`/publications/${slug}`} key={slug}><strong>{related.title}</strong><span>{related.deckTitle}</span></Link>; })}</div></section>
          <aside className="authority-next"><h2>About the author</h2><p><Link href="/about">Tommy Pisano</Link> builds and connects the systems behind growth across brand, websites, UX/UI, content, CRM, AI workflows, automation, search, analytics, attribution, and performance reporting.</p></aside>
        </div>
      </article>
    </>
  );
}
