export const SITE_NAME = "Ascend Vanta";
export const SITE_TITLE = "Ascend Vanta — Tommy Pisano | Creative Technology & Growth Systems";
export const SITE_DESCRIPTION =
  "Tommy Pisano builds premium digital experiences and connected growth systems across UX/UI, creative technology, automation, engineering, content, search, analytics, and social media.";
const PRODUCTION_SITE_URL = "https://www.ascendvanta.com";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    return new URL(configured || PRODUCTION_SITE_URL);
  } catch {
    return new URL(PRODUCTION_SITE_URL);
  }
}
