import { NextRequest, NextResponse } from "next/server";
import { parseRepositoryInput } from "@/lib/codyn-dashboard";
import { getRepositoryArtifactView } from "@/lib/services/repository-analysis-artifacts";
import { isRepositoryIndexingConfigured } from "@/lib/services/repository-analysis-jobs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    if (!isRepositoryIndexingConfigured()) return NextResponse.json({ error: "Architecture graph requires a configured repository index." }, { status: 503 });
    const parsed = parseRepositoryInput(request.nextUrl.searchParams.get("repo") || "");
    if (!parsed) return NextResponse.json({ error: "Invalid owner/repository." }, { status: 400 });
    try {
        const artifacts = await getRepositoryArtifactView({ owner: parsed.owner, repo: parsed.repo, revision: request.nextUrl.searchParams.get("revision") || undefined });
        if (!artifacts) return NextResponse.json({ error: "No completed repository index is available for this revision." }, { status: 404 });
        const nodes = artifacts.files.slice(0, 80).map((file) => ({ path: file.path, symbolCount: file.symbols.length }));
        const allowed = new Set(nodes.map((node) => node.path));
        const edges = artifacts.dependencies.filter((edge) => edge.targetPath && allowed.has(edge.sourcePath) && allowed.has(edge.targetPath)).slice(0, 180).map((edge) => ({ source: edge.sourcePath, target: edge.targetPath! }));
        return NextResponse.json({ revision: artifacts.revision, nodes, edges, truncated: artifacts.files.length > nodes.length });
    } catch (error) {
        console.error("Architecture graph failed:", error);
        return NextResponse.json({ error: "Architecture graph could not be loaded." }, { status: 503 });
    }
}
