# Ascend Vanta SEO Baseline

Baseline captured before the authority-layer implementation from production commit `6bbfdbb98e2b10ca7b6f7f9da7ed8e71f9edbd03` and the optimized local production output. Production origin: `https://www.ascendvanta.com`.

No connected Google Search Console or analytics property was available for this sprint. This report makes no claims about index coverage, queries, rankings, traffic, or field performance.

## Indexable URL inventory before the sprint

| URL | Status | Indexable | Canonical | Title | Description | H1 | Schema | Internal links |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | Yes | `https://www.ascendvanta.com/` | Ascend Vanta — Tommy Pisano \| Creative Technology & Growth Systems | Tommy Pisano builds premium digital experiences and connected growth systems across UX/UI, creative technology, automation, engineering, content, search, analytics, and social media. | Ascend Vanta wordmark (image alternative: “ASCEND VANTA”) | WebSite, Person, CollectionPage | Skip link only; no links to independent routes |

System resources were `/robots.txt` (200), `/sitemap.xml` (200), `/icon.jpg` (200), and `/_not-found` (404/noindex behavior). They were not independent indexable content pages and are therefore excluded from the URL table.

## Heading and content outline

The homepage supplied one H1 through its visual wordmark. Its server-rendered headings progressed through the identity, mission, principles, creative and engineering capability panels, measurement and platform sections, Vanta frame sequence, publication library, prompt gallery, and about/system statement. Most meaningful editorial text existed in the server response even though animation and interaction behavior depended on client JavaScript.

## Metadata and technical signals

- The homepage canonical, Open Graph URL, Twitter image, and JSON-LD used the `https://www.ascendvanta.com` origin.
- The sitemap contained only the homepage.
- `robots.txt` allowed crawling and referenced `https://www.ascendvanta.com/sitemap.xml`.
- The stable content host was `www`; the apex redirected to it in the existing production certification.
- No localhost, development-port, placeholder, or preview-domain value was found in production metadata or JSON-LD.
- The global layout preloaded homepage hero artwork and emitted homepage-oriented CollectionPage data on every route. This became a concern once supporting routes were introduced.

## Images and alternative text

Meaningful homepage images had descriptive alternative text, including the Ascend Vanta logo and capability artwork. Decorative hero fallback and animation layers used empty alternatives or `aria-hidden`. The frame sequence exposed a textual accessible description. The publication reader images had page-aware alternatives but no independent crawlable publication URLs.

## Server-rendered and JavaScript-dependent behavior

Server-rendered:

- Core homepage copy and headings
- Title, description, canonical, Open Graph, Twitter, icons, and JSON-LD
- Static fallback and publication image markup
- Reduced-motion-compatible document structure

JavaScript-dependent:

- GSAP/Lenis narrative coordination and horizontal handoffs
- WebGL canvas and model lifecycle
- Frame-sequence loading, playback, freeze, and restoration
- Publication reader state and prompt-gallery interaction
- Active-chapter runtime state and progressive media loading

The authority information itself was present in the homepage HTML, but it was not separated into focused, canonical resources.

## Orphaned content and publication assets

Three authored visual editions existed only inside the homepage reader:

- Search Survival, six WebP pages
- Content System, six WebP pages
- Growth System, five WebP pages

The repository contained no PDF edition. No verified publication dates were present. Capability artwork and explanatory panels also had no independent URLs. Before this sprint, those resources were discoverable only by traversing the homepage experience and were not addressable as first-class search documents.

## Baseline conclusion

The production homepage had a sound canonical and metadata foundation, valid crawl directives, strong server-rendered narrative content, and an established Tommy Pisano Person entity. Its principal SEO limitation was architectural: one sitemap URL, no semantic navigation graph, and no crawlable About, Work, Capability, Publication, or Contact resources.
