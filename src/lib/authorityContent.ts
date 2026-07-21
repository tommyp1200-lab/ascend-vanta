export const AUTHORITY_NAV = [
  { href: "/about", label: "About" },
  { href: "/work", label: "Work" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/publications", label: "Publications" },
  { href: "/contact", label: "Contact" },
] as const;

export type Capability = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  image: string;
  imageAlt: string;
  definition: string;
  problem: string;
  perspective: string;
  connections: string;
  process: readonly { title: string; body: string }[];
  tools: readonly string[];
  measurement: string;
  relatedCapabilities: readonly string[];
  relatedPublications: readonly string[];
};

export const CAPABILITIES: readonly Capability[] = [
  {
    slug: "marketing-systems",
    title: "Marketing Systems",
    shortTitle: "Marketing systems",
    description:
      "How Tommy Pisano connects brand, content, websites, CRM, automation, analytics, and reporting into one measurable growth system.",
    image: "/assets/images/network-hub/ascend-network-hub-transparent.webp",
    imageAlt: "Ascend Vanta network hub representing connected marketing systems",
    definition:
      "A marketing system is the connected operating model behind growth: a clear message, a useful digital experience, a path from attention to action, reliable follow-up, and measurement that changes what happens next. It treats marketing as an interdependent system instead of a queue of isolated campaigns.",
    problem:
      "Teams can look busy while the customer journey remains fragmented. Content may have no destination, a website may not reflect the campaign promise, form submissions may stall outside the CRM, and reporting may count activity without showing movement toward a conversation or opportunity. The problem is not always a missing channel; it is often a missing connection.",
    perspective:
      "Tommy starts with the whole path. He maps how a person discovers an idea, decides it is credible, takes the next step, enters a follow-up process, and becomes visible in reporting. Creative direction and technical implementation are planned together so that the message, interface, data, and operating cadence reinforce one another.",
    connections:
      "Marketing systems sit above the other capabilities on this site. Web experience creates the conversion surface. Content and publications build trust. SEO, AEO, and GEO create discovery. Automation connects intent to follow-up. Analytics and attribution reveal where the path works or breaks.",
    process: [
      { title: "Map the path", body: "Define the audience question, trust signals, next action, handoff, and measurable outcome before choosing tactics." },
      { title: "Design the system", body: "Connect message, content, experience, CRM stages, automation, and reporting around that path." },
      { title: "Build and connect", body: "Implement the experience and integrations with clear ownership, durable data, and accessible interfaces." },
      { title: "Measure and improve", body: "Review the complete journey, locate friction, and prioritize changes by evidence rather than channel noise." },
    ],
    tools: ["CRM architecture", "Content systems", "Web experiences", "APIs", "Zapier", "Make", "n8n", "Google Tag Manager", "Looker Studio"],
    measurement:
      "Measurement follows the journey: qualified attention, meaningful engagement, clicks into a relevant experience, form completion, CRM progression, follow-up, conversations, and attributable opportunities. The aim is a decision system, not a decorative dashboard.",
    relatedCapabilities: ["web-experience-ux-ui", "ai-automation", "analytics-attribution"],
    relatedPublications: ["content-is-not-the-strategy", "linkedin-featured-framework"],
  },
  {
    slug: "web-experience-ux-ui",
    title: "Web Experience & UX/UI",
    shortTitle: "Web experience & UX/UI",
    description:
      "Tommy Pisano’s approach to accessible UX/UI, front-end systems, creative technology, and high-performance web experiences.",
    image: "/assets/images/frontend-stack/ascend-vanta-frontend-stack.webp",
    imageAlt: "Ascend Vanta front-end technology stack artwork",
    definition:
      "Web experience work turns strategy into an interface people can understand and use. It combines information architecture, UX/UI, visual systems, content hierarchy, interaction design, front-end engineering, accessibility, and performance into one coherent product surface.",
    problem:
      "A polished page can still fail when its purpose is unclear, its hierarchy fights the message, motion obscures the task, or slow loading erodes trust. At the other extreme, a technically efficient interface can feel generic and forgettable. The work is to hold clarity, character, usability, and engineering quality at the same time.",
    perspective:
      "Tommy treats design and implementation as one continuous decision process. The intended behavior is tested in the browser, responsive rules are designed as part of the system, and motion earns its place by guiding attention or explaining structure. Progressive enhancement, semantic HTML, and reduced-motion alternatives keep the core experience available beyond the ideal device.",
    connections:
      "The website is where positioning, content, search visibility, conversion paths, and measurement meet. UX decisions affect whether authority is legible. Engineering decisions affect discovery and performance. Instrumentation must describe meaningful actions without weakening privacy, accessibility, or runtime quality.",
    process: [
      { title: "Frame the job", body: "Identify the audience, business intent, essential content, constraints, and most important user decisions." },
      { title: "Structure the experience", body: "Create semantic hierarchy, responsive layouts, navigation, states, and accessible interaction patterns." },
      { title: "Prototype in context", body: "Evaluate typography, motion, media, and technical feasibility in the browser rather than as isolated screens." },
      { title: "Harden the build", body: "Validate performance, keyboard use, reduced motion, overflow, metadata, error states, and production behavior." },
    ],
    tools: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "GSAP", "Lenis", "Three.js"],
    measurement:
      "Quality is evaluated through task clarity, conversion behavior, accessibility checks, Core Web Vitals, runtime errors, responsive integrity, and qualitative review of the intended visual experience. No single score substitutes for the full evidence set.",
    relatedCapabilities: ["marketing-systems", "seo-aeo-geo", "analytics-attribution"],
    relatedPublications: ["content-is-not-the-strategy", "seo-geo-ai-search-survival-guide"],
  },
  {
    slug: "ai-automation",
    title: "AI & Automation",
    shortTitle: "AI & automation",
    description:
      "A systems approach to AI workflows, automation, APIs, CRM handoffs, and human-controlled operational improvement.",
    image: "/assets/images/backend-automation/ascend-vanta-backend-automation.webp",
    imageAlt: "Ascend Vanta backend and automation system artwork",
    definition:
      "AI and automation reduce avoidable manual work and improve how information moves through a system. The capability includes workflow design, API connections, structured data, CRM actions, content operations, and carefully scoped AI assistance with clear human review.",
    problem:
      "Automation often fails when a team automates an unstable process, moves poor-quality data faster, or cannot explain what happens after an exception. AI adds another risk: fluent output can appear authoritative without being dependable. Useful systems need explicit inputs, guardrails, ownership, and recovery paths.",
    perspective:
      "Tommy begins with the operating problem, not the tool. He separates deterministic steps from judgment, defines where a person remains accountable, and designs observability into the workflow. AI is most useful when it augments a known process and produces an inspectable result rather than an opaque shortcut.",
    connections:
      "Automation links conversion experiences to CRM follow-up, supports content and search workflows, and makes reporting more consistent. Analytics provides the feedback loop; UX makes human review practical; marketing-system design ensures the workflow serves a real journey instead of an isolated efficiency target.",
    process: [
      { title: "Model the workflow", body: "Document triggers, inputs, decisions, owners, exceptions, and the desired state change." },
      { title: "Choose the boundary", body: "Automate repeatable transformations while preserving human control for consequential or ambiguous decisions." },
      { title: "Connect and validate", body: "Build integrations, validate data contracts, log outcomes, and test failure and retry behavior." },
      { title: "Operate deliberately", body: "Monitor quality, cost, latency, exceptions, and downstream impact as the workflow evolves." },
    ],
    tools: ["Python", "Flask", "Node.js", "APIs", "SQL", "Supabase", "Firebase", "Zapier", "Make", "n8n"],
    measurement:
      "Useful measures include completion and exception rates, time saved on validated work, handoff latency, data completeness, review effort, and the downstream business action. Output volume alone is not evidence of a better system.",
    relatedCapabilities: ["marketing-systems", "analytics-attribution", "web-experience-ux-ui"],
    relatedPublications: ["seo-geo-ai-search-survival-guide", "content-is-not-the-strategy"],
  },
  {
    slug: "seo-aeo-geo",
    title: "SEO, AEO & GEO",
    shortTitle: "SEO, AEO & GEO",
    description:
      "How Tommy Pisano approaches technical SEO, answer-engine visibility, generative-engine optimization, entities, and trustworthy content.",
    image: "/assets/images/search-visibility/ascend-vanta-search-visibility.webp",
    imageAlt: "Ascend Vanta search visibility and answer engine artwork",
    definition:
      "Search visibility now spans conventional search results, direct answers, and AI-mediated discovery. SEO improves crawlability, relevance, and usefulness. AEO structures clear answers for answer surfaces. GEO strengthens the entity, evidence, and content signals that generative systems can understand and cite.",
    problem:
      "A site may be technically crawlable yet remain difficult to interpret. Thin pages, vague authorship, disconnected topics, inconsistent entities, and content written only around keywords weaken both human trust and machine understanding. Visibility without a useful destination also fails to create business value.",
    perspective:
      "Tommy treats search as an authority system. Clean architecture and structured data establish the foundation, but original expertise, explicit authorship, coherent internal links, and answerable content make that foundation meaningful. Optimization should clarify what is true and useful, never manufacture authority signals.",
    connections:
      "Search depends on web performance, semantic UX, content systems, and analytics. Publications demonstrate expertise. Capability pages define topical relationships. Structured data describes visible facts. Measurement connects discovery to engagement and outcomes without pretending every answer-engine exposure can be perfectly attributed.",
    process: [
      { title: "Establish the entity", body: "Define the person, site, topics, stable identifiers, authorship, and canonical source of each claim." },
      { title: "Build the crawl path", body: "Create useful HTML resources, descriptive metadata, semantic headings, internal links, sitemap coverage, and valid schema." },
      { title: "Answer real questions", body: "Publish direct, evidence-based explanations shaped by audience needs and original operating experience." },
      { title: "Evaluate visibility", body: "Review crawlability, search performance when available, referrals, qualified engagement, citations, and conversion paths." },
    ],
    tools: ["Rank Math SEO", "Google Search Console", "Google Analytics", "Google Tag Manager", "Schema markup", "Local SEO", "AEO", "GEO"],
    measurement:
      "Where verified data is available, evaluation can include index coverage, queries, landing-page engagement, conversions, branded discovery, referral sources, and observed answer-engine citations. This site does not claim Search Console results without connected evidence.",
    relatedCapabilities: ["web-experience-ux-ui", "analytics-attribution", "marketing-systems"],
    relatedPublications: ["seo-geo-ai-search-survival-guide", "content-is-not-the-strategy"],
  },
  {
    slug: "analytics-attribution",
    title: "Analytics & Attribution",
    shortTitle: "Analytics & attribution",
    description:
      "A practical approach to analytics architecture, attribution limits, KPI reporting, and evidence-led improvement across the customer journey.",
    image: "/assets/images/search-visibility/ascend-vanta-search-visibility-signal-map.webp",
    imageAlt: "Ascend Vanta signal map representing analytics and attribution",
    definition:
      "Analytics turns product and marketing behavior into evidence for decisions. Attribution is the narrower practice of connecting touchpoints to outcomes while acknowledging incomplete identity, changing privacy constraints, and the difference between correlation and causation.",
    problem:
      "Dashboards can become a collection of available numbers rather than a model of the business. Inconsistent events, missing campaign context, duplicate conversions, and ambiguous CRM stages make confident charts out of unreliable data. Last-click credit can also erase the work that created attention and trust earlier in the journey.",
    perspective:
      "Tommy works backward from decisions. A useful measurement plan names the questions, the actions that represent progress, the systems that hold evidence, and the limits of the interpretation. Reporting should surface friction and opportunity, not simply reward activity with upward-looking graphs.",
    connections:
      "Analytics closes the loop across web experience, campaigns, content, CRM, automation, and search. It requires stable implementation in the interface, consistent handoffs through integrations, and shared definitions between marketing and operations. Attribution is treated as a reasoned model, not perfect omniscience.",
    process: [
      { title: "Define decisions", body: "Identify what the team must decide and which observable behaviors would change that decision." },
      { title: "Design the measurement", body: "Specify events, properties, campaign context, consent boundaries, CRM stages, and ownership." },
      { title: "Validate the evidence", body: "Test data in production, reconcile systems, document gaps, and remove vanity metrics from critical views." },
      { title: "Create a review rhythm", body: "Turn reporting into recurring diagnosis, prioritization, experimentation, and accountable follow-through." },
    ],
    tools: ["Google Analytics", "Google Tag Manager", "Looker Studio", "Microsoft Clarity", "Hotjar", "CRM reporting", "SQL", "APIs"],
    measurement:
      "The measurement approach includes data quality first, then a layered view of attention, engagement, conversion, pipeline progression, and outcomes. Attribution conclusions are labeled with their assumptions and never presented as more certain than the evidence supports.",
    relatedCapabilities: ["marketing-systems", "web-experience-ux-ui", "ai-automation"],
    relatedPublications: ["linkedin-featured-framework", "content-is-not-the-strategy"],
  },
];

export type Publication = {
  slug: string;
  title: string;
  deckTitle: string;
  description: string;
  folder: string;
  pageCount: number;
  summary: string;
  takeaways: readonly string[];
  sections: readonly { id: string; title: string; paragraphs: readonly string[] }[];
  relatedCapabilities: readonly string[];
  relatedPublications: readonly string[];
};

export const PUBLICATIONS: readonly Publication[] = [
  {
    slug: "seo-geo-ai-search-survival-guide",
    title: "SEO, GEO & AI Search Survival Guide",
    deckTitle: "Search Didn’t Die. It Learned to Answer.",
    description: "A practical field guide to discovery, trust, entities, citations, and visibility as search evolves into answer and generative engines.",
    folder: "search-survival",
    pageCount: 6,
    summary: "Search has not disappeared; the interface between a question and a source has changed. AI systems can summarize, recommend, and cite before a person visits a website. This guide reframes the work from chasing rankings alone to building a source that search and answer systems can discover, understand, trust, and connect to a real person and body of expertise.",
    takeaways: [
      "Technical SEO remains foundational, but visibility now includes answers, citations, and recommendations.",
      "Consistent entities, explicit authorship, structured knowledge, and original insight increase interpretability and trust.",
      "Useful content begins with real audience questions and provides clear, supportable answers.",
      "A visibility program needs a conversion and measurement path; exposure alone is not the strategy.",
    ],
    sections: [
      { id: "new-interface", title: "The interface changed", paragraphs: ["Traditional search results are no longer the only place a question is resolved. Answer engines and generative systems can synthesize a response, expose a small set of sources, or recommend an approach without producing a conventional click. That makes source quality and entity clarity more important, not less.", "The useful response is not to abandon SEO. It is to expand the model: discovery, technical access, trust, topical authority, citations, and a destination that rewards the person who chooses to continue."] },
      { id: "confidence-stack", title: "Build an AI confidence stack", paragraphs: ["A dependable source answers real buying and operating questions, uses clean information architecture, applies schema only to visible facts, identifies its author, and stays consistent about names and topics. Third-party mentions and original insights can reinforce that foundation when they are genuine.", "No markup can rescue thin or unsupported content. The strongest optimization is an accessible page whose claims, structure, authorship, and related resources make sense to a reader first."] },
      { id: "operating-model", title: "From rankings to an authority system", paragraphs: ["A modern program reviews crawlability and conventional search performance while also observing referrals, brand discovery, cited sources, qualified engagement, and the customer path after discovery. Some answer-engine exposure will remain difficult to measure precisely, so conclusions should state their limits.", "The shift can be summarized as SEO plus GEO: search engines and answer engines, rankings and citations, traffic and trust. The work still depends on a coherent site, useful expertise, and repeated evidence over time."] },
    ],
    relatedCapabilities: ["seo-aeo-geo", "analytics-attribution", "web-experience-ux-ui"],
    relatedPublications: ["content-is-not-the-strategy", "linkedin-featured-framework"],
  },
  {
    slug: "content-is-not-the-strategy",
    title: "Content Is Not the Strategy",
    deckTitle: "Stop Feeding the Feed. Build the System.",
    description: "A field guide to connecting content, message, trust, conversion, follow-up, and measurement instead of optimizing output alone.",
    folder: "content-system",
    pageCount: 6,
    summary: "More content does not repair an unclear message, weak trust, a missing next step, slow follow-up, or absent measurement. This guide places content inside the full operating system that turns attention into useful action. The goal is not a louder feed; it is a connected path a person can understand and a team can improve.",
    takeaways: [
      "Content is one layer in a path from attention to trust, click, lead, follow-up, and outcome.",
      "Message, proof, conversion design, tracking, and operating ownership need to agree before volume helps.",
      "Landing pages and CRM follow-up are part of content performance, not separate afterthoughts.",
      "Measure meaningful action and progression rather than treating publishing cadence as success.",
    ],
    sections: [
      { id: "output-trap", title: "The output trap", paragraphs: ["Publishing more can create motion without fixing the system beneath it. If the message is vague, the destination feels disconnected, or there is no credible next step, additional impressions send more people into the same broken path.", "A content plan therefore needs a diagnosis before a calendar. What should the audience understand? Why should they trust it? Where can they go deeper? What action is appropriate, and what happens after it?"] },
      { id: "connected-path", title: "Design the connected path", paragraphs: ["The field guide frames the journey as attention, trust, click, lead, and follow-up. Each transition needs a deliberate bridge: a clear idea earns attention, evidence earns trust, a relevant destination earns the click, a useful offer earns permission, and timely follow-up respects that intent.", "This makes the website, landing page, CRM, automation, and reporting part of content strategy. The feed may begin the interaction, but it should not be asked to carry the entire customer journey."] },
      { id: "measurement", title: "Measure action, then improve", paragraphs: ["A practical review combines creative signals with behavior farther down the path. Attention and engagement can show resonance; clicks, form completion, conversations, and pipeline movement show whether the system translates that resonance into progress.", "The point is not to reduce every creative decision to a short-term conversion. It is to connect creative intent to observable behavior and create a learning loop that improves message, experience, follow-up, and measurement together."] },
    ],
    relatedCapabilities: ["marketing-systems", "web-experience-ux-ui", "analytics-attribution"],
    relatedPublications: ["seo-geo-ai-search-survival-guide", "linkedin-featured-framework"],
  },
  {
    slug: "linkedin-featured-framework",
    title: "LinkedIn Featured Framework",
    deckTitle: "From Marketing Motion to Measurable Momentum.",
    description: "A five-part framework for connecting social attention, trusted destinations, CRM follow-up, analytics, and KPI reporting.",
    folder: "growth-system",
    pageCount: 5,
    summary: "Scattered marketing becomes useful when its parts form a measurable journey. This framework follows the path from a social post through trust, click, landing experience, form, CRM, follow-up, and opportunity. It gives a featured body of work a clear role inside a larger growth system rather than treating it as a static portfolio shelf.",
    takeaways: [
      "A post is an entry point, not the complete journey.",
      "Message, destination, form, CRM, and follow-up should feel like one continuous experience.",
      "Impressions and engagement are useful signals, but they do not replace lead, conversation, and opportunity evidence.",
      "Creative direction, digital strategy, operational follow-up, and KPI reporting need shared definitions.",
    ],
    sections: [
      { id: "fragmentation", title: "Replace scattered activity with a path", paragraphs: ["Marketing often fragments by tool and owner: the website tells one story, content follows another, campaigns end at a form, and the CRM receives records without enough context for useful follow-up. Reporting then describes each channel separately while the customer experienced one journey.", "The framework brings those pieces into a single model so that every touchpoint has a job and every handoff preserves intent."] },
      { id: "pipeline", title: "The featured-content pipeline", paragraphs: ["The path begins with a post that earns attention and trust, continues to a relevant landing experience, captures permission through a form, records context in the CRM, and triggers appropriate follow-up. Opportunity is an outcome of the connected sequence, not of the social post in isolation.", "A featured collection can support this journey by giving visitors durable proof and a clear route into deeper expertise. That is why publications and capability pages on this site link to one another."] },
      { id: "scorecard", title: "Use a layered scorecard", paragraphs: ["Attention, engagement, clicks, leads, conversations, and revenue answer different questions. A layered scorecard preserves those distinctions and avoids presenting early-channel activity as business impact.", "The operating advantage is not a single dashboard. It is a shared review rhythm in which creative direction, digital strategy, CRM follow-up, and KPI reporting expose what to keep, repair, or stop."] },
    ],
    relatedCapabilities: ["marketing-systems", "analytics-attribution", "ai-automation"],
    relatedPublications: ["content-is-not-the-strategy", "seo-geo-ai-search-survival-guide"],
  },
];

export const INDEXABLE_PATHS = [
  "",
  "/about",
  "/work",
  "/capabilities",
  ...CAPABILITIES.map(({ slug }) => `/capabilities/${slug}`),
  "/publications",
  ...PUBLICATIONS.map(({ slug }) => `/publications/${slug}`),
  "/contact",
] as const;

export function getCapability(slug: string) {
  return CAPABILITIES.find((capability) => capability.slug === slug);
}

export function getPublication(slug: string) {
  return PUBLICATIONS.find((publication) => publication.slug === slug);
}
