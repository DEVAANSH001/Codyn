import { describe, expect, it } from "vitest";
import { resolveOgCardSpec } from "@/lib/og-card";

describe("resolveOgCardSpec", () => {
    it("falls back to the home marketing card for unknown types", () => {
        const spec = resolveOgCardSpec(new URLSearchParams("type=unknown"), "https://codyn.in");

        expect(spec.eyebrow).toBe("Codyn");
        expect(spec.title).toBe("AI-Powered Code Intelligence | Codyn");
        expect(spec.asset).toBe("https://codyn.in/assets/landing_page.png");
        expect(spec.chips).toEqual(["Chat", "Analyze", "Secure"]);
    });

    it("builds repo cards with chat intent and repository stats", () => {
        const spec = resolveOgCardSpec(
            new URLSearchParams(
                "type=repo&owner=acme&repo=widget&description=Fast%20and%20focused&stars=42&forks=7&language=TypeScript&mode=security",
            ),
            "https://codyn.in",
        );

        expect(spec.eyebrow).toBe("Security Repo Chat");
        expect(spec.title).toBe("acme/widget");
        expect(spec.description).toContain("Surface risks");
        expect(spec.description).toContain("Fast and focused");
        expect(spec.avatar).toBe("https://github.com/acme.png?size=256");
        expect(spec.chips[0]).toBe("Security chat");
        expect(spec.stats[0]).toEqual({ label: "Stars", value: "42" });
        expect(spec.stats[1]).toEqual({ label: "Forks", value: "7" });
    });

    it("builds profile cards with avatar and prompt-aware copy", () => {
        const spec = resolveOgCardSpec(
            new URLSearchParams(
                "type=profile&username=ada&name=Ada%20Lovelace&bio=Pioneer%20of%20computing.&repos=3&followers=100&following=5&mode=architecture",
            ),
            "https://codyn.in",
        );

        expect(spec.eyebrow).toBe("Architecture Profile");
        expect(spec.title).toBe("Ada Lovelace (@ada)");
        expect(spec.description).toContain("Generate architecture flowcharts");
        expect(spec.description).toContain("Pioneer of computing.");
        expect(spec.avatar).toBe("https://github.com/ada.png?size=256");
        expect(spec.chips[0]).toBe("3 repos");
    });

    it("builds report cards with health scores and shared labels", () => {
        const spec = resolveOgCardSpec(
            new URLSearchParams(
                "type=report&owner=acme&repo=widget&critical=2&high=1&medium=0&low=4&health=72&grade=B&shared=true",
            ),
            "https://codyn.in",
        );

        expect(spec.eyebrow).toBe("Codyn Security Report");
        expect(spec.title).toBe("acme/widget");
        expect(spec.description).toContain("Review 2 critical, 1 high, 0 medium, 4 low findings");
        expect(spec.description).toContain("Security Health Score 72/100 (B)");
        expect(spec.chips[0]).toBe("Health 72/100");
        expect(spec.chips[1]).toBe("Grade B");
        expect(spec.stats[0]).toEqual({ label: "Critical", value: "2" });
    });

    it("builds blog cards with article context", () => {
        const spec = resolveOgCardSpec(
            new URLSearchParams(
                "type=blog&title=The%20Future%20of%20Codyn&description=Engineering%20notes%20for%20high-context%20analysis.&category=Insights&author=Codyn&readTime=5%20min%20read",
            ),
            "https://codyn.in",
        );

        expect(spec.eyebrow).toBe("Blog");
        expect(spec.title).toBe("The Future of Codyn");
        expect(spec.description).toContain("Engineering notes");
        expect(spec.chips[0]).toBe("Insights");
        expect(spec.chips[1]).toBe("Codyn");
        expect(spec.chips[2]).toBe("5 min read");
    });

    it("builds topic cards with repository counts", () => {
        const spec = resolveOgCardSpec(
            new URLSearchParams(
                "type=topic&topic=security&description=Curated%20projects%20for%20security.&repos=2&stars=1200&topRepo=acme%2Fwidget",
            ),
            "https://codyn.in",
        );

        expect(spec.eyebrow).toBe("Topic Hub");
        expect(spec.title).toBe("Best security repositories");
        expect(spec.description).toContain("Curated projects for security.");
        expect(spec.chips[0]).toBe("2 repos");
        expect(spec.chips[1]).toBe("1,200 stars");
        expect(spec.chips[2]).toBe("acme/widget");
        expect(spec.stats[0]).toEqual({ label: "Repos", value: "2" });
    });
});
