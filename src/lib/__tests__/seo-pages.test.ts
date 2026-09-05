import { describe, expect, it } from "vitest";
import { getAllSeoPages } from "@/lib/seo-pages";
import { getSeoPageMetadata } from "@/lib/seo-page-route";

const comparisonSlugs = new Set([
  "static-analysis-vs-codyn",
  "codyn-vs-sonarqube",
  "codyn-vs-snyk",
]);

describe("SEO page system", () => {
  it("defines eight high-intent SEO pages with rich long-form content contracts", () => {
    const pages = getAllSeoPages();

    expect(pages).toHaveLength(8);
    for (const page of pages) {
      expect(page.slug).toBeTruthy();
      expect(page.title).toBeTruthy();
      expect(page.metaDescription.length).toBeGreaterThan(80);
      expect(page.h1).toBeTruthy();
      expect(page.primaryIntent).toBeTruthy();
      expect(page.keywords.length).toBeGreaterThanOrEqual(5);
      expect(page.sections.length).toBeGreaterThanOrEqual(4);
      expect(page.faq.length).toBeGreaterThanOrEqual(5);
      expect(page.faq.length).toBeLessThanOrEqual(8);
      expect(page.schemaTypes).toEqual(expect.arrayContaining(["FAQPage", "BreadcrumbList"]));
      expect(page.ctaTargets.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("applies schema and table contracts by page type", () => {
    const pages = getAllSeoPages();

    for (const page of pages) {
      const isComparison = comparisonSlugs.has(page.slug);
      if (isComparison) {
        expect(page.schemaTypes).not.toContain("SoftwareApplication");
        expect(page.comparisonTable).toBeDefined();
        expect(page.comparisonTable?.rows.length).toBeGreaterThanOrEqual(5);
        expect(page.comparisonTable?.differentiators.length).toBeGreaterThanOrEqual(3);
      } else {
        expect(page.schemaTypes).toContain("SoftwareApplication");
        expect(page.comparisonTable).toBeUndefined();
      }
    }
  });

  it("builds unique canonical metadata for each SEO page", () => {
    const pages = getAllSeoPages();
    const canonicals = new Set<string>();
    const titles = new Set<string>();

    for (const page of pages) {
      const metadata = getSeoPageMetadata(page.slug);
      const canonical = metadata.alternates?.canonical;
      expect(typeof canonical).toBe("string");
      expect((canonical as string).startsWith("/")).toBe(true);
      expect(canonicals.has(canonical as string)).toBe(false);
      canonicals.add(canonical as string);

      const title =
        typeof metadata.title === "string"
          ? metadata.title
          : metadata.title?.toString() ?? "";
      expect(titles.has(title)).toBe(false);
      titles.add(title);

      const keywords = metadata.keywords as string[] | undefined;
      expect(Array.isArray(keywords)).toBe(true);
      expect((keywords ?? []).length).toBeGreaterThanOrEqual(6);
    }
  });
});
