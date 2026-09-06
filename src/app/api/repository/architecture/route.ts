import { NextRequest, NextResponse } from "next/server";
import { parseRepositoryInput } from "@/lib/codyn-dashboard";
import { analyzeArchitectureRules } from "@/lib/architecture-rules";
import { getRepositoryArtifactView } from "@/lib/services/repository-analysis-artifacts";
import { isRepositoryIndexingConfigured } from "@/lib/services/repository-analysis-jobs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    if (!isRepositoryIndexingConfigured()) return NextResponse.json({ error: "Architecture analysis requires a configured repository index." }, { status: 503 });
    const parsed = parseRepositoryInput(request.nextUrl.searchParams.get("repo") || "");
    if (!parsed) return NextResponse.json({ error: "Invalid owner/repository." }, { status: 400 });
    try {
        const artifacts = await getRepositoryArtifactView({ owner: parsed.owner, repo: parsed.repo, revision: request.nextUrl.searchParams.get("revision") || undefined });
        if (!artifacts) return NextResponse.json({ error: "No completed repository index is available for this revision." }, { status: 404 });
        const edges = artifacts.dependencies.map((edge) => ({ sourcePath: edge.sourcePath, targetPath: edge.targetPath, importSource: edge.importSource, importedNames: Array.isArray(edge.importedNames) ? edge.importedNames.filter((item): item is string => typeof item === "string") : [], isTypeOnly: edge.isTypeOnly, line: edge.line }));
        return NextResponse.json({ revision: artifacts.revision, violations: analyzeArchitectureRules(edges) });
    } catch (error) {
        console.error("Architecture analysis failed:", error);
        return NextResponse.json({ error: "Architecture analysis could not be calculated." }, { status: 503 });
    }
}
