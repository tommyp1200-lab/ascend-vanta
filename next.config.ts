import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/about", destination: "/#about", permanent: true },
      { source: "/work", destination: "/#work", permanent: true },
      { source: "/capabilities", destination: "/#capabilities", permanent: true },
      { source: "/capabilities/marketing-systems", destination: "/#marketing-systems", permanent: true },
      { source: "/capabilities/web-experience-ux-ui", destination: "/#web-experience-ux-ui", permanent: true },
      { source: "/capabilities/ai-automation", destination: "/#ai-automation", permanent: true },
      { source: "/capabilities/seo-aeo-geo", destination: "/#seo-aeo-geo", permanent: true },
      { source: "/capabilities/analytics-attribution", destination: "/#analytics-attribution", permanent: true },
      { source: "/publications", destination: "/#publications", permanent: true },
      { source: "/publications/seo-geo-ai-search-survival-guide", destination: "/#seo-geo-ai-search-survival-guide", permanent: true },
      { source: "/publications/content-is-not-the-strategy", destination: "/#content-is-not-the-strategy", permanent: true },
      { source: "/publications/linkedin-featured-framework", destination: "/#linkedin-featured-framework", permanent: true },
      { source: "/contact", destination: "/#contact", permanent: true },
    ];
  },
};

export default nextConfig;
