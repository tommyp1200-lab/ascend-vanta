import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteMetadata";
import { INDEXABLE_PATHS } from "@/lib/authorityContent";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return INDEXABLE_PATHS.map((path) => ({
    url: new URL(path || "/", siteUrl).toString(),
    changeFrequency: path === "" ? "monthly" : "yearly",
    priority: path === "" ? 1 : path.split("/").filter(Boolean).length === 1 ? 0.8 : 0.7,
  }));
}
