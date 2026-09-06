export type Technology = {
    name: string;
    category: "language" | "framework" | "database" | "infrastructure" | "ai" | "tooling";
    version?: string;
    evidence: string;
};

export type TechStackReport = { technologies: Technology[] };

const PACKAGE_TECHNOLOGIES: Record<string, Omit<Technology, "version" | "evidence">> = {
    next: { name: "Next.js", category: "framework" },
    react: { name: "React", category: "framework" },
    "@prisma/client": { name: "Prisma", category: "database" },
    "next-auth": { name: "Auth.js", category: "framework" },
    "@google/genai": { name: "Google GenAI", category: "ai" },
    "@upstash/redis": { name: "Upstash Redis", category: "database" },
    express: { name: "Express", category: "framework" },
    fastify: { name: "Fastify", category: "framework" },
    vite: { name: "Vite", category: "tooling" },
    typescript: { name: "TypeScript", category: "language" },
};

function addUnique(target: Technology[], item: Technology) {
    if (!target.some((current) => current.name === item.name && current.category === item.category)) target.push(item);
}

export function detectTechStack(input: { languages?: Record<string, number>; files: Array<{ path: string; content?: string }> }): TechStackReport {
    const technologies: Technology[] = [];
    for (const language of Object.keys(input.languages ?? {})) {
        addUnique(technologies, { name: language, category: "language", evidence: "GitHub language statistics" });
    }
    for (const file of input.files) {
        const normalized = file.path.toLowerCase();
        if (normalized.endsWith("dockerfile") || normalized.includes("docker-compose")) addUnique(technologies, { name: "Docker", category: "infrastructure", evidence: file.path });
        if (normalized.endsWith("terraform.tf") || normalized.endsWith(".tf")) addUnique(technologies, { name: "Terraform", category: "infrastructure", evidence: file.path });
        if (normalized.endsWith("prisma/schema.prisma")) addUnique(technologies, { name: "Prisma", category: "database", evidence: file.path });
        if (!normalized.endsWith("package.json") || !file.content) continue;
        try {
            const packageJson = JSON.parse(file.content) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
            const packages = { ...packageJson.dependencies, ...packageJson.devDependencies };
            for (const [packageName, version] of Object.entries(packages)) {
                const technology = PACKAGE_TECHNOLOGIES[packageName];
                if (technology) addUnique(technologies, { ...technology, version, evidence: file.path });
            }
        } catch {
            // Invalid manifests are ignored; the caller still receives source-evidenced results.
        }
    }
    return { technologies: technologies.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)) };
}
