import { NextRequest, NextResponse } from "next/server";
import { parseRepositoryInput } from "@/lib/codyn-dashboard";
import { getSnapshot, GitHubError } from "@/lib/github-public";
import { computeRepositoryHealth } from "@/lib/repository-health";
import { getRepositoryArtifactView } from "@/lib/services/repository-analysis-artifacts";
import { isRepositoryIndexingConfigured } from "@/lib/services/repository-analysis-jobs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const parsed = parseRepositoryInput(request.nextUrl.searchParams.get("repo") || "");
    if (!parsed) return NextResponse.json({ error: "Invalid owner/repository." }, { status: 400 });
    try {
        const snapshot = await getSnapshot(parsed.owner, parsed.repo);
        let dependencies: Parameters<typeof computeRepositoryHealth>[1] = [];
        if (isRepositoryIndexingConfigured()) {
            try {
                const artifacts = await getRepositoryArtifactView({ owner: parsed.owner, repo: parsed.repo, revision: snapshot.revision });
                if (artifacts) dependencies = artifacts.dependencies.map((edge) => ({
                    sourcePath: edge.sourcePath,
                    targetPath: edge.targetPath,
                    importSource: edge.importSource,
                    importedNames: Array.isArray(edge.importedNames) ? edge.importedNames.filter((item): item is string => typeof item === "string") : [],
                    isTypeOnly: edge.isTypeOnly,
                    line: edge.line,
                }));
            } catch {
                // Health remains useful with tree-only signals when durable artifacts are unavailable.
            }
        }
        return NextResponse.json({ revision: snapshot.revision, ...computeRepositoryHealth(snapshot.files.map((file) => file.path), dependencies) });
    } catch (error) {
        return NextResponse.json({ error: error instanceof GitHubError ? error.message : "Repository health could not be calculated." }, { status: error instanceof GitHubError ? error.status : 502 });
    }
}
