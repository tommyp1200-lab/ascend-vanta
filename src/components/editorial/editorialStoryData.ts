export const HORIZONTAL_TIMELINE_DURATION = 4.1;
export const HORIZONTAL_SCROLL_MULTIPLIER = 4.8;
export const HORIZONTAL_SCROLL_MIN = 5200;
export const HORIZONTAL_SCROLL_MAX = 7600;

export const HORIZONTAL_CHAPTERS = [
  {
    id: "creative-systems",
    label: "CREATIVE SYSTEMS",
    proof: "STRATEGY → DESIGN → MOTION → PRODUCTION",
    start: 0.788,
    imageEnd: 0.98,
  },
  {
    id: "frontend-engineering",
    label: "FRONTEND ENGINEERING",
    proof: "INTERFACE → INTERACTION → PERFORMANCE → DEPLOYMENT",
    start: 1.34,
    imageEnd: 1.69,
  },
  {
    id: "automation-systems",
    label: "AUTOMATION SYSTEMS",
    proof: "DATA → AUTOMATION → VISIBILITY → SCALE",
    start: 2.08,
    imageEnd: 2.43,
  },
  {
    id: "search-intelligence",
    label: "SEARCH INTELLIGENCE",
    proof: "DISCOVERY → ATTRIBUTION → OPTIMIZATION → GROWTH",
    start: 2.82,
    imageEnd: 3.17,
  },
  {
    id: "platform-presence",
    label: "PLATFORM PRESENCE",
    proof: "PLATFORM → AUDIENCE → CONSISTENCY → MOMENTUM",
    start: 3.52,
    imageEnd: 3.82,
  },
] as const;

export const PRINCIPLES = [
  {
    headline: "Designed, Not Built",
    subheadline:
      "Every experience is shaped with intention, purpose, and a clear reason for every decision.",
  },
  {
    headline: "Turn Vision Into Value",
    subheadline:
      "I transform ambitious ideas into meaningful digital experiences that create real business impact.",
  },
  {
    headline: "Clarity Before Creation",
    subheadline:
      "I define the purpose, audience, and desired outcome before designing the solution.",
  },
  {
    headline: "Design to Deployment",
    subheadline:
      "I carry ideas from strategic concept through execution, launch, and real-world performance.",
  },
  {
    headline: "Presence Before Promotion",
    subheadline:
      "I establish credibility, consistency, and authority before investing in attention.",
  },
  {
    headline: "Strategy Creates Scale",
    subheadline:
      "I build connected systems that turn focused decisions into repeatable, sustainable growth.",
  },
  {
    headline: "Measure What Moves",
    subheadline:
      "I focus on the signals, outcomes, and insights that lead to stronger decisions and measurable progress.",
  },
] as const;

export const SYSTEM_LAYERS = [
  {
    icon: "strategy",
    title: "STRATEGY",
    description:
      "Direction, positioning, priorities, and decisions before execution begins.",
  },
  {
    icon: "crm",
    title: "CRM",
    description:
      "Customer records, relationship context, and pipeline history stay connected.",
  },
  {
    icon: "website",
    title: "WEBSITE SYSTEM",
    description:
      "The public system layer where content, UX, tracking, and conversion meet.",
  },
  {
    icon: "automation",
    title: "AUTOMATION",
    description:
      "Repeatable workflows move work forward without losing control or context.",
  },
  {
    icon: "content",
    title: "CONTENT ENGINE",
    description:
      "Ideas, creative, publishing, and repurposing become one managed engine.",
  },
  {
    icon: "leads",
    title: "LEAD TRACKING",
    description:
      "Every inquiry keeps its source, status, owner, and next action visible.",
  },
  {
    icon: "analytics",
    title: "ANALYTICS",
    description:
      "Behavior, traffic, channel, and conversion signals become measurable.",
  },
  {
    icon: "reporting",
    title: "REPORTING",
    description:
      "The system packages performance into clear operating decisions.",
  },
] as const;

export type SystemLayerIconName = (typeof SYSTEM_LAYERS)[number]["icon"];
