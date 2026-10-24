import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getInvalidSessionApiError, getSessionAuthState, getSessionUserId } from "@/lib/session-guard";

export async function GET() {
    const session = await auth();
    const authState = getSessionAuthState(session);

    if (authState === "unauthenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (authState === "invalid") {
        return NextResponse.json(getInvalidSessionApiError(), { status: 401 });
    }

    if (!getSessionUserId(session)) {
        return NextResponse.json(getInvalidSessionApiError(), { status: 401 });
    }

    const accessToken = session?.accessToken;
    if (!accessToken) {
        return NextResponse.json({ error: "Reconnect GitHub to access your repositories.", code: "GITHUB_RECONNECT_REQUIRED" }, { status: 403 });
    }

    try {
        const repos: unknown[] = [];
        let grantedScopes = session?.oauthScope ?? "";
        for (let page = 1; page <= 10; page++) {
            const res = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member&page=${page}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
                cache: "no-store",
            });
            if (res.status === 401) {
                return NextResponse.json({ error: "GitHub access expired. Reconnect your account.", code: "GITHUB_RECONNECT_REQUIRED" }, { status: 403 });
            }
            if (!res.ok) {
                console.error("GitHub API error fetching user repos", await res.text());
                return NextResponse.json({ error: "Failed to fetch repositories" }, { status: res.status });
            }
            grantedScopes = res.headers.get("x-oauth-scopes") ?? grantedScopes;
            const data: unknown = await res.json();
            if (!Array.isArray(data)) break;
            repos.push(...data);
            if (!res.headers.get("link")?.includes('rel="next"')) break;
        }
        const hasPrivateAccess = grantedScopes.split(",").some(scope => scope.trim() === "repo") ||
            grantedScopes.split(/\s+/).includes("repo");

        return NextResponse.json({
            repos,
            hasPrivateAccess,
        });

    } catch (error) {
        console.error("Error fetching user repos:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
