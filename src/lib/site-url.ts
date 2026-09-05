const LOCAL_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getCanonicalSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || LOCAL_SITE_URL);
}

export function getPublicSiteUrl(): string {
  return getCanonicalSiteUrl();
}
