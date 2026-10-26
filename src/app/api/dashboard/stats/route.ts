import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserScans } from "@/lib/services/scan-storage";
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

    const userId = getSessionUserId(session);
    if (!userId) {
        return NextResponse.json(getInvalidSessionApiError(), { status: 401 });
    }

    try {
        const [scans, conversations] = await Promise.all([
            getUserScans(userId),
            prisma.chatConversation.findMany({
                where: { userId, scope: "repo" },
                select: { owner: true, repo: true },
            }),
        ]);

        const reposScanned = new Set<string>();
        let issuesFound = 0;
        let deepScans = 0;

        for (const scan of scans) {
            reposScanned.add(`${scan.owner}/${scan.repo}`);
            issuesFound += scan.summary.total || 0;
            if (scan.depth === 'deep') {
                deepScans += 1;
            }
        }

        for (const conversation of conversations) {
            if (conversation.owner && conversation.repo) {
                reposScanned.add(`${conversation.owner}/${conversation.repo}`);
            }
        }

        return NextResponse.json({
            stats: {
                reposScanned: reposScanned.size,
                issuesFound,
                deepScans
            }
        });
    } catch {
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
