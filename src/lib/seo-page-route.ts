import type { Metadata } from "next";
import { buildOgImageUrl, createSeoMetadata } from "@/lib/seo";
import { getSeoPageBySlug, type SeoPageDefinition } from "@/lib/seo-pages";

export function getSeoPageOrThrow(slug: string): SeoPageDefinition {
  const page = getSeoPageBySlug(slug);
  if (!page) {
    throw new Error(`Unknown SEO page slug: ${slug}`);
  }
  return page;
}

export function getSeoPageMetadata(slug: string): Metadata {
  const page = getSeoPageOrThrow(slug);

  return createSeoMetadata({
    title: page.title,
    description: page.metaDescription,
    canonical: `/${page.slug}`,
    ogImage: buildOgImageUrl("marketing", {
      variant: "explore",
      title: page.title,
      description: page.metaDescription,
    }),
    ogTitle: `${page.title} | Codyn`,
    ogDescription: page.metaDescription,
    keywords: [
      ...page.keywords,
      "github repository analysis",
      "ai code review tool",
      "repository security scanner",
      "codyn",
    ],
  });
}
