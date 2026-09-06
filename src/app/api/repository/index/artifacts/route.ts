import { NextRequest, NextResponse } from "next/server";
import { parseRepositoryInput } from "@/lib/codyn-dashboard";
import { getRepositoryArtifactView } from "@/lib/services/repository-analysis-artifacts";
import { isRepositoryIndexingConfigured } from "@/lib/services/repository-analysis-jobs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    if (!isRepositoryIndexingConfigured()) {
        return NextResponse.json({ error: "Repository indexing requires a configured PostgreSQL database." }, { status: 503 });
    }
    const parsed = parseRepositoryInput(request.nextUrl.searchParams.get("repo") || "");
    if (!parsed) return NextResponse.json({ error: "Invalid owner/repository." }, { status: 400 });
    const path = request.nextUrl.searchParams.get("path") || undefined;
    if (path && (path.length > 400 || path.startsWith("/") || path.includes("\\"))) {
        return NextResponse.json({ error: "Invalid repository path." }, { status: 400 });
    }
    try {
        const result = await getRepositoryArtifactView({
            owner: parsed.owner,
            repo: parsed.repo,
            revision: request.nextUrl.searchParams.get("revision") || undefined,
            path,
        });
        return result ? NextResponse.json(result) : NextResponse.json({ error: "No completed repository index is available for this revision." }, { status: 404 });
    } catch (error) {
        console.error("Failed to load repository artifacts:", error);
        return NextResponse.json({ error: "Repository artifacts could not be loaded." }, { status: 503 });
    }
}
