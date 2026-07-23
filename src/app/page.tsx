import { AscendHero } from "@/components/hero/AscendHero";
import { NarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";
import { StructuredData } from "@/components/authority/StructuredData";
import { OnePageAnchorSync } from "@/components/authority/OnePageAnchorSync";
import { absoluteUrl, PERSON_ID, SITE_DESCRIPTION, SITE_TITLE, WEBSITE_ID } from "@/lib/siteMetadata";

export default function HomePage() {
  const publications = [
    {
      id: "seo-geo-ai-search-survival-guide",
      name: "Search Didn’t Die. It Learned to Answer.",
      description: "A field guide to becoming the source AI systems trust, cite, and surface.",
    },
    {
      id: "content-is-not-the-strategy",
      name: "Stop Feeding the Feed. Build the System.",
      description: "Why more content cannot repair a broken path—and what turns attention into measurable action.",
    },
    {
      id: "linkedin-featured-framework",
      name: "From Marketing Motion to Measurable Momentum.",
      description: "A connected operating framework for campaigns, content, CRM, analytics, and follow-up.",
    },
  ] as const;
  const homepageUrl = absoluteUrl("/");
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": ["WebPage", "ProfilePage"],
            "@id": `${homepageUrl}#webpage`,
            url: homepageUrl,
            name: SITE_TITLE,
            description: SITE_DESCRIPTION,
            isPartOf: { "@id": WEBSITE_ID },
            mainEntity: { "@id": PERSON_ID },
            hasPart: ["about", "work", "capabilities", "publications", "contact"].map((id) => ({
              "@type": "WebPageElement",
              "@id": `${homepageUrl}#${id}`,
              url: `${homepageUrl}#${id}`,
            })),
          },
          {
            "@type": "CollectionPage",
            "@id": `${homepageUrl}#publications-collection`,
            url: `${homepageUrl}#publications`,
            name: "Ascend Intelligence Publications",
            isPartOf: { "@id": `${homepageUrl}#webpage` },
            hasPart: publications.map((publication) => ({
              "@type": "CreativeWork",
              "@id": `${homepageUrl}#${publication.id}`,
              url: `${homepageUrl}#${publication.id}`,
              name: publication.name,
              description: publication.description,
              author: { "@id": PERSON_ID },
            })),
          },
        ],
      }} />
      <OnePageAnchorSync />
      <NarrativeCoordinator><AscendHero /></NarrativeCoordinator>
    </>
  );
}
