import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteMetadata";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: getSiteUrl().toString(), changeFrequency: "monthly", priority: 1 }];
}
