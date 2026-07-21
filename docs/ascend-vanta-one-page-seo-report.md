# Ascend Vanta One-Page SEO Report

Date: July 21, 2026

Production origin: `https://www.ascendvanta.com`

Status: implementation complete; local and production validation recorded below.

## Executive verdict

Ascend Vanta is intentionally a one-page authority website. The cinematic homepage remains the complete product and the sole canonical, indexable content document. Concise authority signals are integrated into the existing homepage chapters without introducing a second application shell or independent content pages.

## Final route policy

- Canonical content route: `/`
- Custom error route: `/_not-found` behavior only; returns 404 and is not indexable content
- Technical resources: `/robots.txt`, `/sitemap.xml`, and `/icon.jpg`
- Separate About, Work, Capability, Publication, Contact, author, profile, social, article, and landing pages: none

## Permanent redirect map

| Removed route | Direct destination |
| --- | --- |
| `/about` | `/#about` |
| `/work` | `/#work` |
| `/capabilities` | `/#capabilities` |
| `/capabilities/marketing-systems` | `/#marketing-systems` |
| `/capabilities/web-experience-ux-ui` | `/#web-experience-ux-ui` |
| `/capabilities/ai-automation` | `/#ai-automation` |
| `/capabilities/seo-aeo-geo` | `/#seo-aeo-geo` |
| `/capabilities/analytics-attribution` | `/#analytics-attribution` |
| `/publications` | `/#publications` |
| `/publications/seo-geo-ai-search-survival-guide` | `/#seo-geo-ai-search-survival-guide` |
| `/publications/content-is-not-the-strategy` | `/#content-is-not-the-strategy` |
| `/publications/linkedin-featured-framework` | `/#linkedin-featured-framework` |
| `/contact` | `/#contact` |

All mappings use Next.js permanent redirects and terminate at the production homepage without a second redirect.

## Homepage section inventory

| Anchor | Semantic content |
| --- | --- |
| `#about` | Tommy Pisano biography, systems perspective, experience, operating standard, capabilities, and approved public profiles |
| `#work` | Selected work expressed through the existing Vanta mechanical-transformation sequence |
| `#capabilities` | Existing horizontal systems story and connected capability panels |
| `#marketing-systems` | Marketing operations and system architecture |
| `#web-experience-ux-ui` | UX/UI, front-end engineering, motion, interaction, and performance |
| `#ai-automation` | Backend systems, APIs, workflow automation, and connected data |
| `#seo-aeo-geo` | Search visibility, technical SEO, AEO, GEO, and supporting tools |
| `#analytics-attribution` | Analytics, behavioral signals, attribution, KPI reporting, and improvement |
| `#publications` | Ascend Intelligence archive and interactive reader |
| Three publication anchors | Server-rendered title and concise summary for each source edition |
| `#contact` | Approved public profile contact paths and one-page navigation |

## Heading structure

The homepage retains one meaningful H1 for Ascend Vanta and Tommy Pisano. Existing cinematic H2/H3 headings provide the chapter hierarchy. The Work section has an accessible H2, Publications retains its visible H2, About retains its visible H2, and Contact adds a visible H2. Capability subtopics retain their existing semantic headings and panel labels.

## Structured-data graph

- `WebSite`: the Ascend Vanta site at the production root
- `Person`: the one central Tommy Pisano entity, preserving `https://www.ascendvanta.com/about/#person`
- `WebPage` + `ProfilePage`: the canonical homepage, with Tommy Pisano as `mainEntity`
- `CollectionPage`: the visible homepage publication collection
- Three `CreativeWork` entries: the visible publication titles, summaries, and anchors, each authored through the stable Person reference

No second Person object, Organization, LocalBusiness, standalone Article, or standalone publication page is emitted.

## Social-profile integration

The exact approved LinkedIn, GitHub, Instagram, Facebook, and TikTok URLs appear:

1. In the homepage About section.
2. In the homepage Contact section.
3. Once each in the central Person entity’s `sameAs` array.

External links use descriptive names, open in a new tab, and include `noopener noreferrer`. No email address, follower count, verification claim, award, engagement metric, or business-account classification is published.

## Publication treatment

The existing publication reader and source-edition assets remain unchanged. Each publication entry now exposes its title and concise deck summary in the server-rendered publication index and has a stable homepage fragment. No publication date, PDF, result metric, or standalone CreativeWork page was invented.

## Sitemap and robots

The sitemap contains only `https://www.ascendvanta.com/`. Fragment URLs and legacy routes are excluded. `robots.txt` continues to allow crawling and references `https://www.ascendvanta.com/sitemap.xml`.

## Validation results

| Local gate | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass; zero errors or warnings |
| `npm run build` | Pass; only `/`, `/_not-found`, `/icon.jpg`, `/robots.txt`, and `/sitemap.xml` emitted |
| Redirect status | 13/13 former content routes return direct 308 responses to the specified homepage fragments |
| Redirect chains | 0; every redirect terminates at the homepage |
| Sitemap | 1 URL: `https://www.ascendvanta.com/` |
| Robots | Production sitemap reference retained |
| Homepage H1 | Exactly 1 |
| Required anchors | 13/13 present in initial server-rendered HTML |
| Publication summaries | 3/3 present in initial HTML |
| Person objects | Exactly 1 |
| Approved `sameAs` values | 5/5 present exactly once in the Person object |
| Visible approved profile links | 5 in About and 5 in Contact; exact schema destinations |
| External profile navigation | All five opened at the approved destination in a real browser |
| Public/private email exposure | None |
| Environment markers | No localhost, development port, preview domain, or placeholder in production metadata/schema |
| Responsive overflow | 0 at tested mobile, tablet, and desktop widths |
| Cold mobile sequence-frame assets | 0 immediately and after a two-second settled-entry observation |
| Browser console/hydration warnings or errors | 0 observed |
| Anchor navigation | Primary, capability, publication, and redirected fragment targets resolve to visible content; late mobile layout restoration is corrected without modifying the narrative coordinator |

The production deployment result is appended after Vercel promotes the validated commit.

## Performance impact

The route restoration removes the supporting-route components and their authority stylesheet. Homepage changes are limited to semantic IDs, short publication summaries, approved profile links, the footer-like Contact/navigation section, and JSON-LD. Hero, Vanta, horizontal-story mechanics, frame loading, reader interaction, prompt gallery, narrative coordination, GSAP/Lenis lifecycle, WebGL lifecycle, and the approved performance remediation are not rewritten.

## One-page SEO limitations

- Search engines have one canonical document rather than topic-specific landing pages.
- Capability and publication fragments cannot independently carry titles, descriptions, canonicals, or page-level search reporting.
- Long-form topical depth must remain balanced against cinematic pacing and performance.
- Fragment navigation is useful for people and internal organization but fragments are not sitemap entries.
- Search Console will measure the homepage as the primary landing URL rather than 14 independent resources.
- External citations should target the canonical homepage or a stable fragment while recognizing that canonical consolidation remains at `/`.

## Remaining manual gates

Physical-device, assistive-technology, extended reduced-motion, sustained-scroll, thermal, battery, and approved-baseline pixel-diff certification remain separate manual requirements. No unavailable field metric is fabricated in this report.
