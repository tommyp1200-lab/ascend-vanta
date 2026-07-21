import { AscendHero } from "@/components/hero/AscendHero";
import { NarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";
import { StructuredData } from "@/components/authority/StructuredData";
import { absoluteUrl, PERSON_ID, SITE_DESCRIPTION, SITE_TITLE, WEBSITE_ID } from "@/lib/siteMetadata";

export default function HomePage() {
  return (
    <>
      <link rel="preload" as="image" href="/assets/images/av-logo-fallbacks/hero-mobile-entry-480.webp" imageSrcSet="/assets/images/av-logo-fallbacks/hero-mobile-entry-480.webp 480w, /assets/images/av-logo-fallbacks/hero-mobile-entry.webp 720w" imageSizes="99vw" media="(max-width: 767px)" fetchPriority="high" />
      <link rel="preload" as="image" href="/assets/images/av-logo-fallbacks/hero-desktop.webp" media="(min-width: 768px)" fetchPriority="high" />
      <StructuredData data={{ "@context": "https://schema.org", "@type": "WebPage", "@id": `${absoluteUrl("/")}#webpage`, url: absoluteUrl("/"), name: SITE_TITLE, description: SITE_DESCRIPTION, isPartOf: { "@id": WEBSITE_ID }, about: { "@id": PERSON_ID } }} />
      <NarrativeCoordinator><AscendHero /></NarrativeCoordinator>
    </>
  );
}
