import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCanonicalSiteUrlMock, getCuratedReposMock, getIndexableTopicsMock } = vi.hoisted(() => ({
  getCanonicalSiteUrlMock: vi.fn(),
  getCuratedReposMock: vi.fn(),
  getIndexableTopicsMock: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: {
    statSync: vi.fn().mockReturnValue({ mtime: new Date("2026-03-15T10:00:00Z") }),
  },
}));

vi.mock("@/lib/site-url", () => ({ getCanonicalSiteUrl: getCanonicalSiteUrlMock }));
vi.mock("@/lib/repo-catalog", () => ({
  getCuratedRepos: getCuratedReposMock,
  getIndexableTopics: getIndexableTopicsMock,
}));

import sitemap from "@/app/sitemap";

describe("sitemap metadata", () => {
  beforeEach(() => {
    getCanonicalSiteUrlMock.mockReturnValue("https://codyn.in");
    getCuratedReposMock.mockResolvedValue([]);
    getIndexableTopicsMock.mockResolvedValue([]);
  });

  it("indexes only curated repos and indexable topics", async () => {
    getCuratedReposMock.mockResolvedValue([
      { owner: "facebook", repo: "react" },
      { owner: "vercel", repo: "next.js" },
    ]);
    getIndexableTopicsMock.mockResolvedValue(["typescript", "react"]);

    const routes = await sitemap();

    expect(routes.some((entry) => entry.url === "https://codyn.in/repo/facebook/react")).toBe(true);
    expect(routes.some((entry) => entry.url === "https://codyn.in/repo/vercel/next.js")).toBe(true);
    expect(routes.some((entry) => entry.url === "https://codyn.in/topics/typescript")).toBe(true);
    expect(routes.some((entry) => entry.url === "https://codyn.in/topics/react")).toBe(true);
  });

  it("includes core SEO landing pages and excludes blog and coming-soon routes", async () => {
    const routes = await sitemap();

    expect(routes.some((entry) => entry.url === "https://codyn.in/faq")).toBe(true);
    expect(routes.some((entry) => entry.url === "https://codyn.in/github-code-analyzer")).toBe(true);
    expect(routes.some((entry) => entry.url.includes("/blog"))).toBe(false);
    expect(routes.some((entry) => entry.url.includes("/coming-soon"))).toBe(false);
  });
});
