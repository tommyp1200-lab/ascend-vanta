import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self' data:",
  "connect-src 'self' blob: https://www.gstatic.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `${contentSecurityPolicy}; upgrade-insecure-requests`,
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(self), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), publickey-credentials-get=(), usb=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-XSS-Protection", value: "0" },
] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [],
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "ascend-vanta.vercel.app" }],
        destination: "https://www.ascendvanta.com/:path*",
        permanent: true,
      },
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
