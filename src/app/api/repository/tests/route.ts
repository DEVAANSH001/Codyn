import { NextRequest, NextResponse } from "next/server";
import { parseRepositoryInput } from "@/lib/codyn-dashboard";
import { getSnapshot, GitHubError } from "@/lib/github-public";
import { mapSourceToTests } from "@/lib/test-intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const parsed = parseRepositoryInput(request.nextUrl.searchParams.get("repo") || "");
    const path = request.nextUrl.searchParams.get("path") || "";
    if (!parsed || !path || path.length > 400 || path.startsWith("/") || path.includes("\\")) return NextResponse.json({ error: "Invalid repository or path." }, { status: 400 });
    try {
        const snapshot = await getSnapshot(parsed.owner, parsed.repo);
        return NextResponse.json({ revision: snapshot.revision, ...mapSourceToTests(path, snapshot.files.filter((file) => file.type === "blob").map((file) => file.path)) });
    } catch (error) {
        return NextResponse.json({ error: error instanceof GitHubError ? error.message : "Test mapping could not be completed." }, { status: error instanceof GitHubError ? error.status : 502 });
    }
}
