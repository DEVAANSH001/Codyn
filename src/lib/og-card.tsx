import { normalizeMetaText, truncateMetaText, inferChatIntent, chatIntentLabel, chatIntentDescription, buildReportSummaryDescription } from "./seo";

export interface OgCardStat {
    label: string;
    value: string;
}

export interface OgCardSpec {
    eyebrow: string;
    title: string;
    description: string;
    asset: string;
    assetAlt: string;
    accent: string;
    chips: string[];
    stats: OgCardStat[];
    avatar?: string;
    avatarLabel?: string;
    footer?: string;
    layout?: "split" | "centered";
}

const DEFAULT_FOOTER = "Agentic CAG for GitHub repositories and developer profiles.";

const MARKETING_PRESETS: Record<string, Omit<OgCardSpec, "asset" | "assetAlt" | "accent" | "footer"> & { asset: string; accent: string }> = {
    home: {
        eyebrow: "Codyn",
        title: "AI-Powered Code Intelligence | Codyn",
        description: "Understand complex codebases instantly with Agentic CAG. Chat with any GitHub repository, generate architecture flowcharts, and run deep security scans.",
        asset: "/assets/landing_page.png",
        accent: "#8b5cf6",
        chips: ["Chat", "Analyze", "Secure"],
        stats: [
            { label: "Tech", value: "Agentic CAG" },
            { label: "UI", value: "Flowcharts" },
        ],
    },
    blog: {
        eyebrow: "Engineering",
        title: "Codyn Engineering Notes",
        description: "Deep dives into Agentic CAG, AI-driven code analysis, and high-context security research from the Codyn team.",
        asset: "/og.png",
        accent: "#22c55e",
        chips: ["Engineering", "Security", "AI"],
        stats: [
            { label: "Insights", value: "Deep Dive" },
            { label: "Focus", value: "Practical" },
        ],
    },
    solutions: {
        eyebrow: "Solutions",
        title: "Scalable Repository Intelligence | Codyn",
        description: "Pick the right Codyn workflow for your team: deep repository analysis, context-aware code reviews, or automated security scans.",
        asset: "/assets/dashboard_overview.png",
        accent: "#38bdf8",
        chips: ["Analysis", "Review", "Security"],
        stats: [
            { label: "Signal", value: "Maximum" },
            { label: "Set up", value: "None" },
        ],
    },
    compare: {
        eyebrow: "Compare",
        title: "The Next Gen of Code Analysis | Codyn",
        description: "See why our Agentic CAG architecture outperforms traditional RAG for large-scale source code understanding and navigation.",
        asset: "/assets/architecture_example.png",
        accent: "#42a5ff",
        chips: ["CAG vs RAG", "Full Context", "Zero Snippets"],
        stats: [
            { label: "Depth", value: "Infinite" },
            { label: "Speed", value: "Instant" },
        ],
    },
    explore: {
        eyebrow: "Explore",
        title: "Discover Repositories | Codyn",
        description: "Explore curated topic clusters and thousands of GitHub repositories with deep, AI-powered architectural insights.",
        asset: "/assets/architecture_example.png",
        accent: "#14b8a6",
        chips: ["Topic Hubs", "Curated Repo", "Search"],
        stats: [
            { label: "Discovery", value: "Enabled" },
            { label: "Intelligence", value: "High" },
        ],
    },
    trending: {
        eyebrow: "Trending",
        title: "Trending Repositories | Codyn",
        description: "Analyze the hottest GitHub repositories in real-time. Understand the code behind the trends with instant repository chat.",
        asset: "/assets/dashboard_starred_repos.png",
        accent: "#60a5fa",
        chips: ["Weekly", "AI Insights", "Chat Now"],
        stats: [
            { label: "Freshness", value: "Live" },
            { label: "Focus", value: "Popularity" },
        ],
    },
    "github-repository-analysis": {
        eyebrow: "Analysis",
        title: "Evaluate unfamiliar repositories fast",
        description: "Understand architecture, code quality, and repository risk before you adopt or contribute.",
        asset: "/assets/dashboard_overview.png",
        accent: "#f59e0b",
        chips: ["Due diligence", "Architecture", "Risk"],
        stats: [
            { label: "Surface", value: "Full repo" },
            { label: "Speed", value: "Fast" },
        ],
    },
    "ai-code-review-tool": {
        eyebrow: "Code Review",
        title: "Review implementation with full context",
        description: "Context-aware code review across the repository, not just isolated diffs.",
        asset: "/assets/dashboard_recent_scans.png",
        accent: "#8b5cf6",
        chips: ["Context", "Review", "Feedback"],
        stats: [
            { label: "Blind spots", value: "Lower" },
            { label: "Loop", value: "Faster" },
        ],
    },
    "security-scanner": {
        eyebrow: "Security",
        title: "Deep Security Repository Scanning | Codyn",
        description: "Find and fix vulnerabilities with Agentic CAG analysis. Actionable findings, severity context, and repo-wide risk assessments.",
        asset: "/assets/security_report.png",
        accent: "#ef4444",
        chips: ["Vulns", "Audit", "Fixes"],
        stats: [
            { label: "Scope", value: "Full-repo" },
            { label: "Outcome", value: "Secure" },
        ],
    },
    about: {
        eyebrow: "Mission",
        title: "The Mission Behind Codyn",
        description: "We help developers navigate unfamiliar codebases faster with context-intelligent AI that truly understands entire repositories.",
        asset: "/assets/landing_page.png",
        accent: "#14b8a6",
        chips: ["Values", "Technology", "Our Story"],
        stats: [
            { label: "Transparency", value: "High" },
            { label: "Architecture", value: "CAG" },
        ],
    },
    faq: {
        eyebrow: "Help Center",
        title: "Frequently Asked Questions | Codyn",
        description: "Detailed answers about Codyn for GitHub repository chat, AI code intelligence, and automated security scans.",
        asset: "/og.png",
        accent: "#38bdf8",
        chips: ["Documentation", "Usage", "Limits"],
        stats: [
            { label: "Guidance", value: "Expert" },
            { label: "Access", value: "Self-serve" },
        ],
    },
    privacy: {
        eyebrow: "Privacy",
        title: "How Codyn handles data",
        description: "Privacy guidance for account data, usage analytics, and scan-related information.",
        asset: "/assets/security_report.png",
        accent: "#0ea5e9",
        chips: ["Retention", "Account data", "Audit trail"],
        stats: [
            { label: "Policy", value: "Live" },
            { label: "Scope", value: "Clear" },
        ],
    },
    terms: {
        eyebrow: "Terms",
        title: "Codyn usage terms",
        description: "Guidelines for using Codyn responsibly across public and authorized workflows.",
        asset: "/assets/architecture_example.png",
        accent: "#f59e0b",
        chips: ["Usage", "Policy", "Compliance"],
        stats: [
            { label: "Status", value: "Live" },
            { label: "Coverage", value: "Platform" },
        ],
    },
    "coming-soon": {
        eyebrow: "Roadmap",
        title: "Something new is coming",
        description: "Preview the next Codyn feature or page that is on the roadmap.",
        asset: "/assets/dashboard_recent_scans.png",
        accent: "#42a5ff",
        chips: ["In progress", "Fresh build", "Watch this space"],
        stats: [
            { label: "Status", value: "Soon" },
            { label: "Mode", value: "Preview" },
        ],
    },
};

const MARKETING_ASSET_FALLBACKS: Record<string, string> = {
    home: "/assets/landing_page.png",
    blog: "/og.png",
    solutions: "/assets/dashboard_overview.png",
    compare: "/assets/architecture_example.png",
    explore: "/assets/architecture_example.png",
    trending: "/assets/dashboard_starred_repos.png",
    "github-repository-analysis": "/assets/dashboard_overview.png",
    "ai-code-review-tool": "/assets/dashboard_recent_scans.png",
    "security-scanner": "/assets/security_report.png",
    about: "/assets/landing_page.png",
    faq: "/og.png",
    privacy: "/assets/security_report.png",
    terms: "/assets/architecture_example.png",
    "coming-soon": "/assets/dashboard_recent_scans.png",
};

function safeInt(value: string | null | undefined): number | null {
    if (typeof value !== "string") return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function assetUrl(baseUrl: string, asset: string | null | undefined, fallback: string): string {
    const resolved = normalizeMetaText(asset) || fallback;
    try {
        return new URL(resolved, baseUrl).toString();
    } catch {
        return new URL(fallback, baseUrl).toString();
    }
}

function normalizeAccent(value: string | null | undefined, fallback: string): string {
    const resolved = normalizeMetaText(value);
    return resolved || fallback;
}

function makeProfileAvatar(baseUrl: string, username: string): string {
    return new URL(`https://github.com/${encodeURIComponent(username)}.png?size=256`, baseUrl).toString();
}

function makeOwnerAvatar(baseUrl: string, owner: string): string {
    return new URL(`https://github.com/${encodeURIComponent(owner)}.png?size=256`, baseUrl).toString();
}

function marketingSpec(page: string | null, baseUrl: string, overrides: Partial<OgCardSpec> = {}): OgCardSpec {
    const normalizedPage = normalizeMetaText(page).toLowerCase() || "home";
    const preset = MARKETING_PRESETS[normalizedPage] ?? MARKETING_PRESETS.home;
    const fallbackAsset = MARKETING_ASSET_FALLBACKS[normalizedPage] ?? MARKETING_ASSET_FALLBACKS.home;

    return {
        eyebrow: overrides.eyebrow ?? preset.eyebrow,
        title: overrides.title ? truncateMetaText(overrides.title, 90) : preset.title,
        description: overrides.description ? truncateMetaText(overrides.description, 170) : preset.description,
        asset: assetUrl(baseUrl, overrides.asset, fallbackAsset),
        assetAlt: overrides.assetAlt ?? preset.title,
        accent: normalizeAccent(overrides.accent, preset.accent),
        chips: overrides.chips ?? preset.chips,
        stats: overrides.stats ?? preset.stats,
        avatar: overrides.avatar ? assetUrl(baseUrl, overrides.avatar, fallbackAsset) : undefined,
        avatarLabel: overrides.avatarLabel,
        footer: overrides.footer ?? DEFAULT_FOOTER,
    };
}

function repoSpec(params: URLSearchParams, baseUrl: string): OgCardSpec {
    const owner = normalizeMetaText(params.get("owner")) || "developer";
    const repo = normalizeMetaText(params.get("repo")) || "repository";
    const description = truncateMetaText(params.get("description") || "Analyze architecture, code quality, and security with Codyn.", 170);
    const stars = safeInt(params.get("stars"));
    const forks = safeInt(params.get("forks"));
    const language = normalizeMetaText(params.get("language"));
    const mode = inferChatIntent(params.get("mode"));
    const accent = normalizeAccent(params.get("accent"), mode === "security" ? "#ef4444" : "#60a5fa");

    const chips = [
        mode === "general" ? "Repo chat" : `${chatIntentLabel(mode)} chat`,
        stars !== null ? `${stars.toLocaleString()} stars` : "Live context",
        language ? language : "GitHub repo",
    ];

    const stats: OgCardStat[] = [
        { label: "Stars", value: stars !== null ? stars.toLocaleString() : "Live" },
        { label: "Forks", value: forks !== null ? forks.toLocaleString() : "Context" },
        { label: "Lang", value: language || "GitHub" },
    ];

    return {
        eyebrow: mode === "general" ? "Repository Chat" : `${chatIntentLabel(mode)} Repo Chat`,
        title: truncateMetaText(`${owner}/${repo}`, 90),
        description: mode === "general" ? description : `${chatIntentDescription(mode)} ${description}`,
        asset: assetUrl(baseUrl, params.get("asset"), "/og.png"),
        assetAlt: `${owner}/${repo} repository preview`,
        accent,
        chips,
        stats,
        avatar: makeOwnerAvatar(baseUrl, owner),
        avatarLabel: owner,
        footer: DEFAULT_FOOTER,
        layout: "centered",
    };
}

function profileSpec(params: URLSearchParams, baseUrl: string): OgCardSpec {
    const username = normalizeMetaText(params.get("username")) || "developer";
    const name = normalizeMetaText(params.get("name"));
    const bio = truncateMetaText(params.get("bio") || "Developer profile analysis with cross-repo context.", 170);
    const repos = safeInt(params.get("repos"));
    const followers = safeInt(params.get("followers"));
    const following = safeInt(params.get("following"));
    const mode = inferChatIntent(params.get("mode"));
    const accent = normalizeAccent(params.get("accent"), "#14b8a6");

    return {
        eyebrow: mode === "general" ? "Developer Profile" : `${chatIntentLabel(mode)} Profile`,
        title: truncateMetaText(name ? `${name} (@${username})` : `@${username}`, 90),
        description: mode === "general"
            ? bio
            : `${chatIntentDescription(mode)} ${bio}`,
        asset: assetUrl(baseUrl, params.get("asset"), `https://github.com/${encodeURIComponent(username)}.png?size=512`),
        assetAlt: `${username} profile avatar`,
        accent,
        chips: [
            repos !== null ? `${repos.toLocaleString()} repos` : "Profile intel",
            followers !== null ? `${followers.toLocaleString()} followers` : "Cross-repo",
            following !== null ? `${following.toLocaleString()} following` : "Open source",
        ],
        stats: [
            { label: "Repos", value: repos !== null ? repos.toLocaleString() : "Live" },
            { label: "Followers", value: followers !== null ? followers.toLocaleString() : "Profile" },
            { label: "Following", value: following !== null ? following.toLocaleString() : "Context" },
        ],
        avatar: makeProfileAvatar(baseUrl, username),
        avatarLabel: username,
        footer: DEFAULT_FOOTER,
        layout: "centered",
    };
}

function reportSpec(params: URLSearchParams, baseUrl: string): OgCardSpec {
    const owner = normalizeMetaText(params.get("owner")) || "developer";
    const repo = normalizeMetaText(params.get("repo")) || "repository";
    const critical = safeInt(params.get("critical")) ?? 0;
    const high = safeInt(params.get("high")) ?? 0;
    const medium = safeInt(params.get("medium")) ?? 0;
    const low = safeInt(params.get("low")) ?? 0;
    const health = safeInt(params.get("health"));
    const grade = normalizeMetaText(params.get("grade"));
    const trend = normalizeMetaText(params.get("trend"));
    const depth = normalizeMetaText(params.get("depth"));
    const shared = normalizeMetaText(params.get("shared"));
    const accent = normalizeAccent(params.get("accent"), critical > 0 ? "#ef4444" : "#22c55e");

    return {
        eyebrow: "Codyn Security Report",
        title: truncateMetaText(`${owner}/${repo}`, 90),
        description: buildReportSummaryDescription({
            critical,
            high,
            medium,
            low,
            score: health ?? undefined,
            grade: grade || undefined,
            trend: trend || undefined,
        }),
        asset: assetUrl(baseUrl, params.get("asset"), "/assets/security_report.png"),
        assetAlt: `${owner}/${repo} security report preview`,
        accent,
        chips: [
            health !== null ? `Health ${health}/100` : "Security scan",
            grade ? `Grade ${grade}` : `${critical + high + medium + low} findings`,
            depth || "Codyn report",
        ],
        stats: [
            { label: "Critical", value: critical.toLocaleString() },
            { label: "High", value: high.toLocaleString() },
            { label: "Medium", value: medium.toLocaleString() },
        ],
        avatar: makeOwnerAvatar(baseUrl, owner),
        avatarLabel: owner,
        footer: DEFAULT_FOOTER,
        layout: "centered",
    };
}

function blogSpec(params: URLSearchParams, baseUrl: string): OgCardSpec {
    const title = normalizeMetaText(params.get("title")) || "Codyn Insights";
    const description = truncateMetaText(params.get("description") || "Engineering notes, security writeups, and product thinking from Codyn.", 170);
    const category = normalizeMetaText(params.get("category")) || "Insights";
    const author = normalizeMetaText(params.get("author"));
    const readTime = normalizeMetaText(params.get("readTime"));
    const accent = normalizeAccent(params.get("accent"), "#42a5ff");

    return {
        eyebrow: "Blog",
        title: truncateMetaText(title, 90),
        description,
        asset: assetUrl(baseUrl, params.get("image"), "/og.png"),
        assetAlt: `${title} cover image`,
        accent,
        chips: [
            category,
            author || "Codyn",
            readTime || "Fresh insight",
        ],
        stats: [
            { label: "Format", value: "Article" },
            { label: "Lens", value: "Engineering" },
        ],
        footer: DEFAULT_FOOTER,
        layout: "centered",
    };
}

function topicSpec(params: URLSearchParams, baseUrl: string): OgCardSpec {
    const topic = normalizeMetaText(params.get("topic")) || "topic";
    const description = truncateMetaText(params.get("description") || `Curated open-source repositories for ${topic}.`, 170);
    const repos = safeInt(params.get("repos"));
    const stars = safeInt(params.get("stars"));
    const topRepo = normalizeMetaText(params.get("topRepo"));
    const accent = normalizeAccent(params.get("accent"), "#38bdf8");

    return {
        eyebrow: "Topic Hub",
        title: truncateMetaText(`Best ${topic} repositories`, 90),
        description,
        asset: assetUrl(baseUrl, params.get("asset"), "/assets/architecture_example.png"),
        assetAlt: `${topic} repository topic preview`,
        accent,
        chips: [
            repos !== null ? `${repos.toLocaleString()} repos` : "Curated",
            stars !== null ? `${stars.toLocaleString()} stars` : "Search intent",
            topRepo || "GitHub topics",
        ],
        stats: [
            { label: "Repos", value: repos !== null ? repos.toLocaleString() : "Live" },
            { label: "Stars", value: stars !== null ? stars.toLocaleString() : "Topics" },
        ],
        footer: DEFAULT_FOOTER,
    };
}

export function resolveOgCardSpec(params: URLSearchParams, baseUrl: string): OgCardSpec {
    const rawType = normalizeMetaText(params.get("type")).toLowerCase();

    if (rawType === "repo") {
        return repoSpec(params, baseUrl);
    }
    if (rawType === "profile") {
        return profileSpec(params, baseUrl);
    }
    if (rawType === "report") {
        return reportSpec(params, baseUrl);
    }
    if (rawType === "blog") {
        return blogSpec(params, baseUrl);
    }
    if (rawType === "topic") {
        return topicSpec(params, baseUrl);
    }
    if (rawType === "marketing") {
        return marketingSpec(params.get("variant"), baseUrl, {
            title: params.get("title") ?? undefined,
            description: params.get("description") ?? undefined,
            asset: params.get("asset") ?? undefined,
            assetAlt: params.get("assetAlt") ?? undefined,
            accent: params.get("accent") ?? undefined,
            eyebrow: params.get("eyebrow") ?? undefined,
            avatar: params.get("avatar") ?? undefined,
            avatarLabel: params.get("avatarLabel") ?? undefined,
            footer: params.get("footer") ?? undefined,
        });
    }

    return marketingSpec("home", baseUrl);
}

export function OgCard({ spec }: { spec: OgCardSpec }) {
    const logoUrl = spec.avatar || new URL(
        "/1080x1080.png",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ).toString();

    const titleLength = spec.title.length;
    const isBrandOnly = spec.title === "Codyn";
    const accentColor = spec.accent || "#3182ce"; // Default blue
    
    const isSplit = spec.layout === "split";
    
    return (
        <div
            style={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: isSplit ? "row" : "column",
                alignItems: "center",
                justifyContent: isSplit ? "space-between" : "center",
                backgroundColor: "#000",
                color: "#fff",
                padding: isSplit ? "0 80px" : "60px 80px",
                fontFamily: "Montserrat, sans-serif",
                position: "relative",
                overflow: "hidden"
            }}
        >
            {/* Landing Page Background - Subtle Grid Pattern */}
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                opacity: 0.4
            }} />

            {/* Intense Purple Glow Top Left */}
            <div style={{ 
                position: "absolute", 
                top: "-20%", 
                left: "-10%", 
                width: "1000px", 
                height: "1000px", 
                borderRadius: "500px", 
                background: "radial-gradient(circle, rgba(147, 51, 234, 0.45), transparent 70%)",
            }} />

            {/* Intense Blue Glow Bottom Right */}
            <div style={{ 
                position: "absolute", 
                bottom: "-20%", 
                right: "-10%", 
                width: "1000px", 
                height: "1000px", 
                borderRadius: "500px", 
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent 70%)",
            }} />

            {/* Content Wrapper */}
            <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: isSplit ? "flex-start" : "center", 
                textAlign: isSplit ? "left" : "center", 
                width: isSplit ? "550px" : "100%",
            }}>
                
                {/* Logo with Gradient Ring */}
                <div style={{ 
                    width: isSplit ? "80px" : "128px", 
                    height: isSplit ? "80px" : "128px", 
                    borderRadius: "999px",
                    padding: "3px",
                    marginBottom: isSplit ? "20px" : "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #00d2ff, #3b82f6, #00d2ff)",
                    boxShadow: "0 0 40px rgba(139, 92, 246, 0.4)"
                }}>
                    <div style={{ 
                        width: "100%", 
                        height: "100%", 
                        borderRadius: "999px", 
                        backgroundColor: "#000", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        overflow: "hidden",
                        padding: "4px"
                    }}>
                        <img src={logoUrl} width={isSplit ? 70 : 120} height={isSplit ? 70 : 120} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                </div>

                {/* Eyebrow Label (Blog, Report, etc.) */}
                {!isBrandOnly && (
                    <div style={{ 
                        fontSize: isSplit ? "18px" : "20px", 
                        fontWeight: 700, 
                        color: accentColor, 
                        letterSpacing: "0.15em", 
                        textTransform: "uppercase",
                        marginBottom: "16px",
                        opacity: 0.9
                    }}>
                        {spec.eyebrow}
                    </div>
                )}

                {/* Main Content Title (Page Specific) - Refined H2 Style */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative", marginBottom: "24px" }}>
                    <div style={{ 
                        fontSize: isBrandOnly ? "110px" : (isSplit ? (titleLength > 40 ? "32px" : "48px") : (titleLength > 15 ? (titleLength > 25 ? "32px" : "36px") : "48px")),
                        fontWeight: 700, 
                        letterSpacing: "-0.04em", 
                        margin: 0,
                        padding: 0,
                        lineHeight: 1.2,
                        backgroundImage: "linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0.6))",
                        backgroundClip: "text",
                        color: "transparent",
                        textAlign: isSplit ? "left" : "center",
                        maxWidth: isSplit ? "550px" : "900px"
                    }}>
                        {spec.title}
                    </div>
                </div>

                {/* Agentic CAG Badge Section */}
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px", 
                    padding: "8px 20px", 
                    backgroundColor: "rgba(59, 130, 246, 0.08)", 
                    border: "1px solid rgba(59, 130, 246, 0.2)", 
                    borderRadius: "999px",
                    marginBottom: "24px"
                }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255, 255, 255, 0.8)", display: "flex", alignItems: "center" }}>
                        Powered by 
                        <span style={{ 
                            marginLeft: "6px",
                            fontWeight: 700, 
                            backgroundImage: "linear-gradient(to right, #60a5fa, #8deaff)", 
                            backgroundClip: "text", 
                            color: "transparent" 
                        }}>Agentic CAG Architecture</span>
                    </span>
                </div>

                {/* Page Description - Limited height to avoid overlap */}
                <p style={{ 
                    marginTop: "8px",
                    fontSize: isSplit ? "20px" : "24px", 
                    color: "rgba(255, 255, 255, 0.6)", 
                    fontWeight: 500,
                    lineHeight: 1.4,
                    maxWidth: isSplit ? "500px" : "850px",
                    display: "-webkit-box",
                    WebkitLineClamp: isSplit ? 3 : 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                }}>
                    {spec.description}
                </p>

            </div>

            {/* Side Image for Split Layout */}
            {isSplit && spec.asset && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '480px',
                    height: '420px',
                    position: 'relative'
                }}>
                    {/* Glowing background for image */}
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        bottom: '-20px',
                        left: '-20px',
                        right: '-20px',
                        background: `radial-gradient(circle, ${accentColor}33, transparent 70%)`,
                    }} />
                    
                    <img 
                        src={spec.asset} 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                            borderRadius: '24px', 
                            border: `1px solid ${accentColor}44`,
                            boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 20px ${accentColor}22`
                        }} 
                    />
                </div>
            )}

        </div>
    );
}
