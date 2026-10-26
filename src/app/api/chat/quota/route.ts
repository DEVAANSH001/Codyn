import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { ANON_COOKIE_NAME, getAnonymousActorId } from "@/lib/actor-id";
import { getToolBudgetWindowUsage, type CacheAudience, type ToolBudgetScope } from "@/lib/cache";
import { getInvalidSessionApiError, getSessionAuthState, getSessionUserId } from "@/lib/session-guard";
import { getDailyNebiusCount, getDailyQueryCount, getUserEntitlement, NEBIUS_DAILY_QUERIES } from "@/lib/plans";

function parseScope(value: string | null): ToolBudgetScope | null {
    if (value === "repo" || value === "profile") {
        return value;
    }
    return null;
}

export async function GET(req: NextRequest) {
    try {
        const scope = parseScope(req.nextUrl.searchParams.get("scope"));
        if (!scope) {
            return NextResponse.json({ error: "Invalid or missing scope. Use scope=repo|profile." }, { status: 400 });
        }

        const session = await auth();
        const authState = getSessionAuthState(session);
        if (authState === "invalid") {
            return NextResponse.json(getInvalidSessionApiError(), { status: 401 });
        }

        const userId = getSessionUserId(session);
        const audience: CacheAudience = userId ? "authenticated" : "anonymous";
        const anonCookieId = req.cookies.get(ANON_COOKIE_NAME)?.value ?? null;
        const actorId = userId ?? getAnonymousActorId(req.headers, anonCookieId);
        const usage = await getToolBudgetWindowUsage(scope, audience, actorId);
        if (userId) {
            const entitlement = await getUserEntitlement(userId);
            const [used, nebiusUsed] = await Promise.all([getDailyQueryCount(userId), getDailyNebiusCount(userId)]);
            const limit = entitlement.dailyQueryLimit ?? 999999;
            const tomorrow = new Date();
            tomorrow.setUTCHours(24, 0, 0, 0);
            return NextResponse.json({ scope, audience, used, limit, remaining: Math.max(0, limit - used), resetAt: tomorrow.toISOString(), windowSecondsRemaining: Math.ceil((tomorrow.getTime() - Date.now()) / 1000), exhausted: used >= limit, plan: entitlement.name, unlimited: entitlement.dailyQueryLimit === null, ...(entitlement.modelIds.length ? { nebiusUsed, nebiusLimit: NEBIUS_DAILY_QUERIES } : {}) });
        }

        return NextResponse.json({
            scope,
            audience,
            ...usage,
            exhausted: usage.remaining <= 0,
        });
    } catch (error: unknown) {
        console.error("Quota API route error:", {
            path: req.nextUrl.pathname,
            error,
        });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
