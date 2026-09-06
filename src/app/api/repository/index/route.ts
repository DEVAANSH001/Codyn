import { NextRequest, NextResponse } from "next/server";
import { guardMutation, readJsonBody } from "@/lib/api-guards";
import { parseRepositoryInput } from "@/lib/codyn-dashboard";
import { getSnapshot, GitHubError } from "@/lib/github-public";
import {
    getLatestRepositoryIndexStatus,
    isRepositoryIndexingConfigured,
    queueRepositoryAnalysis,
} from "@/lib/services/repository-analysis-jobs";

export const dynamic = "force-dynamic";

function databaseUnavailable() {
    return NextResponse.json(
        { error: "Repository indexing requires a configured PostgreSQL database." },
        { status: 503 },
    );
}

export async function GET(request: NextRequest) {
    if (!isRepositoryIndexingConfigured()) return databaseUnavailable();

    const parsed = parseRepositoryInput(request.nextUrl.searchParams.get("repo") || "");
    if (!parsed) return NextResponse.json({ error: "Invalid owner/repository." }, { status: 400 });

    try {
        const index = await getLatestRepositoryIndexStatus(parsed.owner, parsed.repo);
        return NextResponse.json({ index });
    } catch (error) {
        console.error("Failed to load repository index status:", error);
        return NextResponse.json({ error: "Repository index status could not be loaded." }, { status: 503 });
    }
}

export async function POST(request: NextRequest) {
    const denied = guardMutation(request, 5);
    if (denied) return denied;
    if (!isRepositoryIndexingConfigured()) return databaseUnavailable();

    let body: { repo?: string };
    try {
        body = await readJsonBody(request);
    } catch {
        return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
    }

    const parsed = parseRepositoryInput(body.repo || "");
    if (!parsed) return NextResponse.json({ error: "Invalid owner/repository." }, { status: 400 });

    try {
        const snapshot = await getSnapshot(parsed.owner, parsed.repo);
        const result = await queueRepositoryAnalysis({
            owner: parsed.owner,
            repo: parsed.repo,
            revision: snapshot.revision,
            treeSha: snapshot.revision,
            totalFiles: snapshot.files.length,
        });
        return NextResponse.json(result, { status: result.queued ? 202 : 200 });
    } catch (error) {
        if (error instanceof GitHubError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Failed to queue repository indexing:", error);
        return NextResponse.json({ error: "Repository indexing could not be queued." }, { status: 503 });
    }
}
