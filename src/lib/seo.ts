import type { Metadata } from "next";

export type OgCardVariant = "home" | "repo" | "profile" | "report" | "blog" | "topic" | "marketing";

export type ChatIntent = "architecture" | "security" | "explain" | "general";

const BRAND_NAME = "Codyn";
const BRAND_TWITTER_HANDLE = "@_sam2903";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const STATIC_OG_FALLBACK = "/og/homepage.png";

const STATIC_OG_VARIANTS: Record<string, string> = {
    "home": "/og/homepage.png",
    "coming-soon": "/og/coming-soon.png",
    "security-scanner": "/og/security-scanner.png",
    "about": "/og/about.png",
    "solutions": "/og/solutions.png",
    "ai-code-review-tool": "/og/ai-code-review-tool.png",
    "compare": "/og/compare.png",
    "faq": "/og/faq.png",
    "explore": "/og/explore.png",
    "trending": "/og/trending.png",
    "github-repository-analysis": "/og/github-repository-analysis.png",
    "blog": "/og/blogs.png",
    "privacy": "/og/privacy.png",
    "terms": "/og/terms.png",
};

const STATIC_OG_TYPES: Partial<Record<OgCardVariant, string>> = {
    marketing: "/og/homepage.png",
    repo: "/og/repository-analysis.png",
    profile: "/og/homepage.png",
    report: "/og/security-scan-report.png",
    blog: "/og/blogs.png",
    topic: "/og/trending-topics.png",
};

export function normalizeMetaText(value: string | null | undefined): string {
    return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function truncateMetaText(value: string | null | undefined, maxLength: number = 180): string {
    const normalized = normalizeMetaText(value);
    if (!normalized) return "";
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function buildOgImageUrl(
    type: OgCardVariant,
    params: Record<string, string | number | boolean | null | undefined> = {}
): string {
    const variant = typeof params.variant === "string" ? params.variant : undefined;
    if (variant && STATIC_OG_VARIANTS[variant]) {
        return STATIC_OG_VARIANTS[variant];
    }

    return STATIC_OG_TYPES[type] ?? STATIC_OG_FALLBACK;
}

export function buildNoIndexRobots(): NonNullable<Metadata["robots"]> {
    return {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    };
}

function toMetadataImage(url: string, alt: string): { url: string; alt: string; width: number; height: number } {
    return {
        url,
        alt,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
    };
}

type SeoMetadataInput = {
    title: string;
    description: string;
    canonical?: string;
    keywords?: string[];
    ogType?: "website" | "article";
    ogImage?: string;
    ogSpec?: {
        type: OgCardVariant;
        variant?: string;
        params?: Record<string, string | number | boolean | null | undefined>;
    };
    ogTitle?: string;
    ogDescription?: string;
    twitterImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterCreator?: string;
    twitterSite?: string;
    robots?: Metadata["robots"];
    noIndex?: boolean;
};

export function createSeoMetadata(input: SeoMetadataInput): Metadata {
    const title = normalizeMetaText(input.title);
    const description = truncateMetaText(input.description, 180);
    
    let ogImage = input.ogImage;
    if (!ogImage && input.ogSpec) {
        ogImage = buildOgImageUrl(input.ogSpec.type, {
            variant: input.ogSpec.variant,
            ...input.ogSpec.params,
        });
    }
    
    if (!ogImage) {
        ogImage = buildOgImageUrl("marketing", { variant: "home" });
    }

    const ogTitle = normalizeMetaText(input.ogTitle) || title;
    const ogDescription = truncateMetaText(input.ogDescription ?? description, 200);
    const twitterImage = input.twitterImage ?? ogImage;
    const twitterTitle = normalizeMetaText(input.twitterTitle) || ogTitle;
    const twitterDescription = truncateMetaText(input.twitterDescription ?? ogDescription, 200);

    const metadata: Metadata = {
        title,
        description,
        keywords: input.keywords,
        alternates: input.canonical
            ? {
                canonical: input.canonical,
            }
            : undefined,
        openGraph: {
            title: ogTitle,
            description: ogDescription,
            url: input.canonical,
            siteName: BRAND_NAME,
            type: input.ogType ?? "website",
            locale: "en_US",
            images: [toMetadataImage(ogImage, ogTitle)],
        },
        twitter: {
            card: "summary_large_image",
            title: twitterTitle,
            description: twitterDescription,
            images: [twitterImage],
            creator: input.twitterCreator ?? BRAND_TWITTER_HANDLE,
            site: input.twitterSite ?? BRAND_TWITTER_HANDLE,
        },
    };

    if (input.noIndex) {
        metadata.robots = buildNoIndexRobots();
    } else if (input.robots) {
        metadata.robots = input.robots;
    }

    return metadata;
}

const ARCHITECTURE_PROMPT_PATTERNS = [
    /architecture/i,
    /flowchart/i,
    /diagram/i,
    /visualize/i,
];

const SECURITY_PROMPT_PATTERNS = [
    /security/i,
    /vulnerab/i,
    /scan/i,
];

const EXPLAIN_PROMPT_PATTERNS = [
    /explain/i,
    /walk me through/i,
    /what does this do/i,
];

export function inferChatIntent(prompt?: string | null): ChatIntent {
    const value = normalizeMetaText(prompt).toLowerCase();
    if (!value) return "general";

    if (ARCHITECTURE_PROMPT_PATTERNS.some((pattern) => pattern.test(value))) {
        return "architecture";
    }
    if (SECURITY_PROMPT_PATTERNS.some((pattern) => pattern.test(value))) {
        return "security";
    }
    if (EXPLAIN_PROMPT_PATTERNS.some((pattern) => pattern.test(value))) {
        return "explain";
    }

    return "general";
}

export function chatIntentLabel(intent: ChatIntent): string {
    switch (intent) {
        case "architecture":
            return "Architecture";
        case "security":
            return "Security";
        case "explain":
            return "Explain";
        default:
            return "Chat";
    }
}

export function chatIntentDescription(intent: ChatIntent): string {
    switch (intent) {
        case "architecture":
            return "Generate architecture flowcharts, trace code paths, and understand the system faster.";
        case "security":
            return "Surface risks, scan code paths, and turn findings into practical fixes.";
        case "explain":
            return "Break down the codebase in plain language with repository-wide context.";
        default:
            return "Chat directly with the repository or developer profile using Agentic CAG.";
    }
}

export function buildRepoChatTitle(owner: string, repo: string, intent: ChatIntent = "general"): string {
    const base = `${owner}/${repo}`;
    return intent === "general" ? base : `${base} ${chatIntentLabel(intent)}`;
}

export function buildProfileChatTitle(username: string, name?: string | null, intent: ChatIntent = "general"): string {
    const base = name ? `${name} (@${username})` : `@${username}`;
    return intent === "general" ? base : `${base} ${chatIntentLabel(intent)}`;
}

export function buildReportSummaryDescription(stats: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    score?: number;
    grade?: string;
    trend?: string;
}): string {
    const parts = [
        `${stats.critical} critical`,
        `${stats.high} high`,
        `${stats.medium} medium`,
        `${stats.low} low`,
    ];
    const summary = parts.join(", ");
    const scoreText = typeof stats.score === "number"
        ? ` Security Health Score ${stats.score}/100${stats.grade ? ` (${stats.grade})` : ""}.`
        : "";
    const trendText = stats.trend ? ` Trend: ${stats.trend}.` : "";

    return `Review ${summary} findings${scoreText}${trendText}`;
}

export function estimateSecurityHealthScore(summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
}): { score: number; grade: "A" | "B" | "C" | "D" | "F" } {
    const score = Math.max(
        0,
        Math.min(
            100,
            Math.round(100 - (summary.critical * 28) - (summary.high * 16) - (summary.medium * 8) - (summary.low * 3))
        )
    );

    const grade: "A" | "B" | "C" | "D" | "F" =
        score >= 90 ? "A" :
            score >= 80 ? "B" :
                score >= 65 ? "C" :
                    score >= 45 ? "D" : "F";

    return { score, grade };
}
