import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    ANON_COOKIE_NAME,
    getAnonymousActorId,
    getAnonymousCookieIdFromActorId,
    isValidAnonymousCookieId,
} from "@/lib/actor-id";
import {
    getInvalidSessionApiError,
    getSessionAuthState,
    getSessionUserId,
} from "@/lib/session-guard";

type CreateRunBody = {
    scope: "repo" | "profile";
    owner?: string | null;
    repo?: string | null;
    username?: string | null;
    clientRequestId: string;
};

function resolveConversationKey(
    body: CreateRunBody,
): {
    conversationKey: string;
    owner: string | null;
    repo: string | null;
    username: string | null;
} | null {
    if (body.scope === "repo") {
        const owner = typeof body.owner === "string" ? body.owner : null;
        const repo = typeof body.repo === "string" ? body.repo : null;
        if (!owner || !repo) return null;
        return {
            conversationKey: `repo:${owner}:${repo}`,
            owner,
            repo,
            username: null,
        };
    }

    const username = typeof body.username === "string" ? body.username : null;
    if (!username) return null;
    return {
        conversationKey: `profile:${username}`,
        owner: null,
        repo: null,
        username,
    };
}

function runResponse(
    req: NextRequest,
    userId: string | null,
    actorId: string,
    body: object,
    status = 200,
) {
    const response = NextResponse.json(body, { status });
    const cookieId = getAnonymousCookieIdFromActorId(actorId);
    if (
        !userId &&
        cookieId &&
        !isValidAnonymousCookieId(req.cookies.get(ANON_COOKIE_NAME)?.value)
    ) {
        response.cookies.set({
            name: ANON_COOKIE_NAME,
            value: cookieId,
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 365,
        });
    }
    return response;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    const authState = getSessionAuthState(session);
    if (authState === "invalid") {
        return NextResponse.json(getInvalidSessionApiError(), { status: 401 });
    }

    const userId = getSessionUserId(session);
    const anonCookieId = req.cookies.get(ANON_COOKIE_NAME)?.value ?? null;
    const actorId = userId ?? getAnonymousActorId(req.headers, anonCookieId);

    const body = (await req
        .json()
        .catch(() => null)) as Partial<CreateRunBody> | null;
    if (!body || typeof body !== "object") {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 },
        );
    }
    const scope = body.scope;
    const clientRequestId =
        typeof body.clientRequestId === "string" ? body.clientRequestId : "";
    if ((scope !== "repo" && scope !== "profile") || !clientRequestId.trim()) {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 },
        );
    }

    const resolved = resolveConversationKey({
        scope,
        owner: body.owner ?? null,
        repo: body.repo ?? null,
        username: body.username ?? null,
        clientRequestId,
    });
    if (!resolved) {
        return NextResponse.json(
            { error: "Missing conversation parameters" },
            { status: 400 },
        );
    }

    if (!process.env.DATABASE_URL?.trim()) {
        return runResponse(req, userId, actorId, {
            runId: null,
            persistence: "disabled",
        });
    }

    try {
        const existing = await prisma.chatRun.findUnique({
            where: {
                actorId_conversationKey_clientRequestId: {
                    actorId,
                    conversationKey: resolved.conversationKey,
                    clientRequestId,
                },
            },
            select: {
                id: true,
                status: true,
                partialText: true,
                finalText: true,
            },
        });

        if (existing) {
            return runResponse(req, userId, actorId, {
                runId: existing.id,
                persistence: "enabled",
                status: existing.status,
                partialText: existing.partialText,
                finalText: existing.finalText,
            });
        }

        const run = await prisma.chatRun.create({
            data: {
                actorId,
                userId: userId ?? null,
                conversationKey: resolved.conversationKey,
                scope,
                owner: resolved.owner,
                repo: resolved.repo,
                username: resolved.username,
                clientRequestId,
                status: "RUNNING",
                partialText: "",
            },
            select: { id: true },
        });

        return runResponse(req, userId, actorId, {
            runId: run.id,
            persistence: "enabled",
            status: "RUNNING",
            partialText: "",
            finalText: null,
        });
    } catch (error) {
        console.error("Failed to create chat run:", error);
        return NextResponse.json(
            {
                error: "Chat history storage is unavailable. Please try again shortly.",
                code: "CHAT_STORAGE_UNAVAILABLE",
            },
            { status: 503 },
        );
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    const authState = getSessionAuthState(session);
    if (authState === "invalid") {
        return NextResponse.json(getInvalidSessionApiError(), { status: 401 });
    }

    const userId = getSessionUserId(session);
    const anonCookieId = req.cookies.get(ANON_COOKIE_NAME)?.value ?? null;
    const actorId = userId ?? getAnonymousActorId(req.headers, anonCookieId);

    const { searchParams } = new URL(req.url);
    const runId = searchParams.get("runId") ?? "";
    if (!runId.trim()) {
        return NextResponse.json({ error: "Missing runId" }, { status: 400 });
    }

    if (!process.env.DATABASE_URL?.trim()) {
        return NextResponse.json(
            {
                error: "Saved chat runs are not available on this instance.",
                code: "CHAT_PERSISTENCE_DISABLED",
            },
            { status: 404 },
        );
    }

    try {
        const run = await prisma.chatRun.findFirst({
            where: { id: runId, actorId },
            select: {
                id: true,
                status: true,
                partialText: true,
                finalText: true,
                errorMessage: true,
                updatedAt: true,
            },
        });

        if (!run) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({
            runId: run.id,
            status: run.status,
            partialText: run.partialText,
            finalText: run.finalText,
            errorMessage: run.errorMessage,
            updatedAt: run.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error("Failed to load chat run:", error);
        return NextResponse.json(
            {
                error: "Chat history storage is unavailable. Please try again shortly.",
                code: "CHAT_STORAGE_UNAVAILABLE",
            },
            { status: 503 },
        );
    }
}
