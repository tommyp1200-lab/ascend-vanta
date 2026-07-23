export const SITE_NAME = "Ascend Vanta";
export const SITE_TITLE = "Ascend Vanta — Tommy Pisano | Creative Technology & Growth Systems";
export const SITE_DESCRIPTION =
  "Tommy Pisano builds premium digital experiences and connected growth systems across UX/UI, creative technology, automation, engineering, content, search, analytics, and social media.";
const PRODUCTION_SITE_URL = "https://www.ascendvanta.com";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    const candidate = new URL(configured || PRODUCTION_SITE_URL);
    if (
      candidate.protocol === "https:" &&
      candidate.hostname === "www.ascendvanta.com" &&
      candidate.port === "" &&
      candidate.username === "" &&
      candidate.password === ""
    ) {
      return new URL(PRODUCTION_SITE_URL);
    }
  } catch {
    // Invalid build-time metadata origins fail closed to the canonical production URL.
  }
  return new URL(PRODUCTION_SITE_URL);
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export const WEBSITE_ID = `${PRODUCTION_SITE_URL}/#website`;
export const PERSON_ID = `${PRODUCTION_SITE_URL}/about/#person`;
