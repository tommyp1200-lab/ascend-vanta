import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  PERSON_ID,
  WEBSITE_ID,
} from "@/lib/siteMetadata";
import { APPROVED_PROFILES } from "@/lib/approvedProfiles";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { StructuredData } from "@/components/authority/StructuredData";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const siteUrl = getSiteUrl();
const initialFrameStyles =
  "html,body,.site-shell{max-width:100%;overflow-x:clip;background:#05070a;color:#f4f7f2}" +
  "img,svg,video,canvas,figure{max-width:100%}" +
  "html[data-ascend-boot=loading] body,html[data-ascend-boot=ready] body{overflow:hidden}" +
  "html[data-ascend-boot=loading] [data-hero-animated]:not([data-hero-first-scene]),html[data-ascend-boot=loading] .hero-canvas{visibility:hidden!important;opacity:0!important}" +
  "html[data-ascend-boot=loading] [data-hero-first-scene]{visibility:visible!important;opacity:1!important}" +
  ".ascend-preloader{position:fixed;z-index:2147483000;top:50%;left:50%;width:1px;height:1px;overflow:visible;background:transparent;color:#f4f7f2;isolation:isolate;pointer-events:none}" +
  "html[data-ascend-boot=emergency] .ascend-preloader{display:none!important}" +
  "@keyframes ascendEmergencyUnlock{to{overflow-y:auto}}" +
  "@keyframes ascendEmergencyReveal{to{visibility:visible;opacity:1}}" +
  "@keyframes ascendEmergencyHide{to{visibility:hidden;opacity:0;pointer-events:none}}" +
  "html[data-ascend-boot=loading] body{animation:ascendEmergencyUnlock 0s 1.8s forwards}" +
  "html[data-ascend-boot=loading] [data-hero-animated]:not([data-hero-first-scene]){animation:ascendEmergencyReveal 0s 1.8s forwards}" +
  "html[data-ascend-boot=loading] .ascend-preloader{animation:ascendEmergencyHide 0s 1.8s forwards}";
const bootRecoveryScript =
  "(()=>{const r=document.documentElement;let t=0;const u=e=>{if(r.dataset.ascendBoot==='complete')return;r.dataset.ascendBoot='emergency';r.dataset.ascendBootReason=e;document.querySelector('[data-ascend-app]')?.setAttribute('aria-busy','false');document.querySelector('[data-ascend-preloader]')?.setAttribute('aria-hidden','true');dispatchEvent(new CustomEvent('ascend:boot-emergency',{detail:{reason:e}}))};const s=()=>{clearTimeout(t);t=setTimeout(()=>u('bootstrap-timeout'),1800)};addEventListener('ascend:boot-complete',()=>clearTimeout(t));addEventListener('pageshow',e=>{if(e.persisted){clearTimeout(t);r.dataset.ascendBoot='complete';r.dataset.ascendBootReason='bfcache';document.querySelector('[data-ascend-app]')?.setAttribute('aria-busy','false');document.querySelector('[data-ascend-preloader]')?.setAttribute('aria-hidden','true')}else s()});s()})();";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: SITE_TITLE, template: "%s | Ascend Vanta" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Tommy Pisano" }],
  creator: "Tommy Pisano",
  publisher: SITE_NAME,
  keywords: [
    "Tommy Pisano",
    "Ascend Vanta",
    "Senior UX/UI Designer",
    "creative technologist",
    "growth systems architect",
    "front-end development",
    "automation",
    "digital marketing",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/assets/images/av-logo-fallbacks/hero-desktop.webp",
        width: 2400,
        height: 1600,
        alt: "Ascend Vanta interactive portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/assets/images/av-logo-fallbacks/hero-desktop.webp"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.jpg", type: "image/jpeg", sizes: "512x512" }],
    shortcut: "/icon.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070A",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: siteUrl.toString(),
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en-US",
      },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: "Tommy Pisano",
        url: new URL("/#about", siteUrl).toString(),
        jobTitle: "Senior UX/UI Designer, Creative Technologist, and Growth Systems Architect",
        sameAs: APPROVED_PROFILES.map(({ url }) => url),
        knowsAbout: [
          "UX/UI design",
          "creative technology",
          "front-end development",
          "back-end development",
          "automation",
          "CRM architecture",
          "analytics",
          "content systems",
          "SEO",
          "social media management",
        ],
      },
    ],
  };

  return (
    <html
      lang="en"
      data-ascend-boot="loading"
      style={{ overflowX: "clip", background: "#05070a", colorScheme: "dark" }}
    >
      <head>
        <style>{initialFrameStyles}</style>
        <script dangerouslySetInnerHTML={{ __html: bootRecoveryScript }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${spaceGrotesk.className}`}
        style={{
          margin: 0,
          overflowX: "clip",
          background: "#05070a",
          color: "#f4f7f2",
        }}
      >
        <noscript>
          <style>{`
            html[data-ascend-boot="loading"] body { overflow: auto !important; }
            html[data-ascend-boot="loading"] .ascend-preloader { display: none !important; }
            html[data-ascend-boot="loading"] [data-hero-animated] {
              visibility: visible !important;
              opacity: 1 !important;
              transform: none !important;
              animation: none !important;
            }
          `}</style>
        </noscript>
        {children}
        <GoogleAnalytics />
        <StructuredData data={structuredData} />
      </body>
    </html>
  );
}
