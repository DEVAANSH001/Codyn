import { NextRequest, NextResponse } from "next/server";
import { parseRepositoryInput } from "@/lib/codyn-dashboard";
import { getSnapshot, isReadableFile, readRepoFile, GitHubError } from "@/lib/github-public";
import { detectTechStack } from "@/lib/tech-stack";

const MANIFEST_PATH = /(^|\/)(package\.json|dockerfile|docker-compose(?:\.[^.]+)?\.ya?ml|(?:[^/]+\.)?tf|schema\.prisma)$/i;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const parsed = parseRepositoryInput(request.nextUrl.searchParams.get("repo") || "");
    if (!parsed) return NextResponse.json({ error: "Invalid owner/repository." }, { status: 400 });
    try {
        const snapshot = await getSnapshot(parsed.owner, parsed.repo);
        const manifests = snapshot.files.filter(isReadableFile).filter((file) => MANIFEST_PATH.test(file.path)).slice(0, 12);
        const loaded = await Promise.allSettled(manifests.map(async (file) => ({ path: file.path, content: await readRepoFile(parsed.owner, parsed.repo, file.path, snapshot) })));
        const files = loaded.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
        return NextResponse.json({ revision: snapshot.revision, ...detectTechStack({ languages: snapshot.languages, files }) });
    } catch (error) {
        return NextResponse.json({ error: error instanceof GitHubError ? error.message : "Technology detection could not be completed." }, { status: error instanceof GitHubError ? error.status : 502 });
    }
}
