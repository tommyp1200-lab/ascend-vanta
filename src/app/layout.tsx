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
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const siteUrl = getSiteUrl();

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
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${spaceGrotesk.className}`}>
        {children}
        <GoogleAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
