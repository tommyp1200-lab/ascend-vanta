import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/siteMetadata";

type AuthorityMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
};

export function authorityMetadata({
  title,
  description,
  path,
  image = "/assets/images/av-logo-fallbacks/portfolio-frame.webp",
  imageAlt = "Ascend Vanta by Tommy Pisano",
  imageWidth = 2400,
  imageHeight = 1600,
}: AuthorityMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [{ url: image, width: imageWidth, height: imageHeight, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  };
}
