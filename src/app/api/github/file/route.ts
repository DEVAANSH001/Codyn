import { auth } from "@/lib/auth";
import { parseRepositoryInput } from "@/lib/codyn-dashboard";
import { getRepo, getErrorStatus } from "@/lib/github";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const parsed = parseRepositoryInput(request.nextUrl.searchParams.get("repo") || "");
    const path = request.nextUrl.searchParams.get("path") || "";
    if (!parsed || !path || path.length > 400 || path.startsWith("/") || path.includes("\\") ||
        path.split("/").some(part => !part || part === "." || part === "..")) {
        return NextResponse.json({ error: "Invalid repository file." }, { status: 400 });
    }

    const session = await auth();
    const accessToken = session?.user?.id ? session.accessToken : undefined;
    try {
        const repository = await getRepo(parsed.owner, parsed.repo, accessToken);
        if (repository.private && !accessToken) {
            return NextResponse.json({ error: "Connect GitHub to read this private repository." }, { status: 403 });
        }

        const encodedPath = path.split("/").map(encodeURIComponent).join("/");
        const githubToken = repository.private ? accessToken : (process.env.GITHUB_TOKEN || accessToken);
        const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/contents/${encodedPath}`, {
            headers: {
                Accept: "application/vnd.github+json",
                ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
            },
            cache: "no-store",
        });
        if (!response.ok) {
            return NextResponse.json({ error: response.status === 404 ? "File not found or GitHub access is missing." : "Could not read this GitHub file." }, { status: response.status });
        }
        const data = await response.json();
        if (Array.isArray(data) || data.type !== "file" || data.size > 1_000_000) {
            return NextResponse.json({ error: "This file is too large or cannot be previewed." }, { status: 422 });
        }
        return NextResponse.json({
            size: data.size,
            content: data.content,
            encoding: data.encoding,
            html_url: data.html_url,
            download_url: repository.private ? null : data.download_url,
        }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
        const status = getErrorStatus(error);
        if (error instanceof Error && error.message.startsWith("Connect GitHub")) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: status === 404 ? "Repository not found or GitHub access is missing. Reconnect GitHub if this is a private repo." : "Could not load repository file." }, { status: status === 404 ? 404 : 502 });
    }
}
