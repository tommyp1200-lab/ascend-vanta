# Ascend Vanta Internal Link Map

This map describes the authority-layer graph introduced in the SEO foundation sprint. All links are server rendered, use real `<a href>` destinations through Next.js Link, and remain usable without the cinematic homepage runtime.

## Primary navigation

The homepage ends with a restrained “Explore the system” navigation after the approved about section. It is outside the horizontal capability sequence and links directly to:

- `/about`
- `/work`
- `/capabilities`
- `/publications`
- `/contact`

Supporting pages share a lightweight header and footer that expose the same primary routes plus the homepage. Every route is therefore reachable from the homepage in one click and from any supporting route in no more than two clicks.

## Route graph

| Source | Direct destinations | Purpose |
| --- | --- | --- |
| `/` | About, Work, Capabilities, Publications, Contact | Moves from the cinematic flagship into durable authority resources |
| `/about` | All five capabilities, Work, all three publications, Contact | Connects the Tommy Pisano entity to evidence, thinking, and inquiry context |
| `/work` | Homepage, About, Publications, four relevant capabilities | Connects the flagship implementation to its design, systems, search, and measurement disciplines |
| `/capabilities` | All five capability detail routes | Topic hub for the capability cluster |
| Each capability detail | Three related capabilities, two supporting publications, Work, About, Contact | Shows how each discipline participates in the broader system |
| `/publications` | All three publication detail routes | Editorial hub for the publication cluster |
| Each publication detail | Three supporting capabilities, two related publications, About/author | Connects a field guide to expertise, adjacent reading, and the primary entity |
| `/contact` | About, Work, Capabilities | Gives a useful preparation path while an approved public contact channel remains unavailable |
| 404 | Homepage, Capabilities | Returns a visitor to useful crawlable destinations |

## Capability relationships

- Marketing Systems → Web Experience & UX/UI, AI & Automation, Analytics & Attribution
- Web Experience & UX/UI → Marketing Systems, SEO/AEO/GEO, Analytics & Attribution
- AI & Automation → Marketing Systems, Analytics & Attribution, Web Experience & UX/UI
- SEO, AEO & GEO → Web Experience & UX/UI, Analytics & Attribution, Marketing Systems
- Analytics & Attribution → Marketing Systems, Web Experience & UX/UI, AI & Automation

Each capability also links to the two publications that most directly support its operating model.

## Publication relationships

- SEO, GEO & AI Search Survival Guide → SEO/AEO/GEO, Analytics, Web Experience; both other publications
- Content Is Not the Strategy → Marketing Systems, Web Experience, Analytics; both other publications
- LinkedIn Featured Framework → Marketing Systems, Analytics, AI & Automation; both other publications

Every publication identifies and links to Tommy Pisano’s About page. No publication is an image-only or orphaned resource.

## Crawl-depth and orphan check

- Canonical indexable URLs: 14
- Maximum intended click depth from the homepage: 2
- Orphan canonical pages: 0
- Sitemap-only pages: 0
- Links inserted inside the horizontal cinematic sequence: 0
