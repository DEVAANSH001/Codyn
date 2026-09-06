import { NextRequest, NextResponse } from "next/server";
import { parseRepositoryInput } from "@/lib/codyn-dashboard";
import { buildArchitectureGraph } from "@/lib/architecture-graph";
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
        return NextResponse.json(buildArchitectureGraph(artifacts));
    } catch (error) {
        console.error("Architecture graph failed:", error);
        return NextResponse.json({ error: "Architecture graph could not be loaded." }, { status: 503 });
    }
}
