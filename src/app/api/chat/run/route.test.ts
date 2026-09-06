import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ANON_COOKIE_NAME, getAnonymousActorId } from "@/lib/actor-id";

const { authMock, chatRun } = vi.hoisted(() => ({
    authMock: vi.fn(),
    chatRun: { findUnique: vi.fn(), create: vi.fn(), findFirst: vi.fn() },
}));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ prisma: { chatRun } }));

import { GET, POST } from "./route";

const validBody = {
    scope: "repo",
    owner: "octocat",
    repo: "Hello-World",
    clientRequestId: "request-1",
};
function request(
    body: unknown = validBody,
    headers: Record<string, string> = {},
) {
    return new NextRequest("http://localhost/api/chat/run", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Codyn test browser",
            ...headers,
        },
        body: JSON.stringify(body),
    });
}

describe("chat run persistence", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.stubEnv("DATABASE_URL", "");
        authMock.mockResolvedValue(null);
        chatRun.findUnique.mockResolvedValue(null);
        chatRun.create.mockResolvedValue({ id: "run-1" });
    });
    afterEach(() => vi.unstubAllEnvs());

    it("explicitly disables persistence without accessing Prisma when no database is configured", async () => {
        const response = await POST(request());
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            runId: null,
            persistence: "disabled",
        });
        expect(chatRun.findUnique).not.toHaveBeenCalled();
        expect(chatRun.create).not.toHaveBeenCalled();
    });

    it("validates requests and invalid sessions even when persistence is disabled", async () => {
        expect((await POST(request({ ...validBody, repo: null }))).status).toBe(
            400,
        );
        expect((await POST(request(null))).status).toBe(400);
        authMock.mockResolvedValue({ user: { name: "Expired user" } });
        const response = await POST(request());
        expect(response.status).toBe(401);
        expect(await response.json()).toMatchObject({
            code: "INVALID_SESSION",
        });
    });

    it("sets the same anonymous actor cookie used to create the run for the following stream request", async () => {
        vi.stubEnv("DATABASE_URL", "postgresql://test");
        const req = request();
        const response = await POST(req);
        const cookie = response.cookies.get(ANON_COOKIE_NAME);
        expect(cookie?.value).toMatch(/^[a-f0-9]{24}$/);
        const streamActor = getAnonymousActorId(
            new Headers({ "User-Agent": "changed proxy headers" }),
            cookie?.value,
        );
        expect(chatRun.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ actorId: streamActor }),
            }),
        );
    });

    it("preserves an existing anonymous cookie and reuses an idempotent run", async () => {
        vi.stubEnv("DATABASE_URL", "postgresql://test");
        const cookieId = "1234567890abcdef12345678";
        chatRun.findUnique.mockResolvedValue({
            id: "existing-run",
            status: "COMPLETED",
            partialText: "answer",
            finalText: "answer",
        });
        const response = await POST(
            request(validBody, { Cookie: `${ANON_COOKIE_NAME}=${cookieId}` }),
        );
        expect(await response.json()).toMatchObject({
            runId: "existing-run",
            persistence: "enabled",
        });
        expect(chatRun.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    actorId_conversationKey_clientRequestId: {
                        actorId: `anon_${cookieId}`,
                        conversationKey: "repo:octocat:Hello-World",
                        clientRequestId: "request-1",
                    },
                },
            }),
        );
        expect(chatRun.create).not.toHaveBeenCalled();
        expect(response.cookies.get(ANON_COOKIE_NAME)).toBeUndefined();
    });

    it("creates authenticated profile runs with the authenticated actor", async () => {
        vi.stubEnv("DATABASE_URL", "postgresql://test");
        authMock.mockResolvedValue({ user: { id: "user-1" } });
        const response = await POST(
            request({
                scope: "profile",
                username: "octocat",
                clientRequestId: "request-2",
            }),
        );
        expect(await response.json()).toMatchObject({
            runId: "run-1",
            persistence: "enabled",
        });
        expect(chatRun.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    actorId: "user-1",
                    userId: "user-1",
                    conversationKey: "profile:octocat",
                }),
            }),
        );
        expect(response.cookies.get(ANON_COOKIE_NAME)).toBeUndefined();
    });

    it("does not hide a configured database failure as disabled persistence", async () => {
        vi.stubEnv("DATABASE_URL", "postgresql://test");
        chatRun.findUnique.mockRejectedValue(new Error("Database unavailable"));
        const log = vi.spyOn(console, "error").mockImplementation(() => {});
        const response = await POST(request());
        expect(response.status).toBe(503);
        expect(await response.json()).toMatchObject({
            code: "CHAT_STORAGE_UNAVAILABLE",
        });
        log.mockRestore();
    });

    it("returns a safe unavailable response for an old run when persistence is disabled", async () => {
        const response = await GET(
            new NextRequest("http://localhost/api/chat/run?runId=old-run"),
        );
        expect(response.status).toBe(404);
        expect(await response.json()).toMatchObject({
            code: "CHAT_PERSISTENCE_DISABLED",
        });
        expect(chatRun.findFirst).not.toHaveBeenCalled();
    });

    it("does not return runs belonging to another actor", async () => {
        vi.stubEnv("DATABASE_URL", "postgresql://test");
        authMock.mockResolvedValue({ user: { id: "user-1" } });
        chatRun.findFirst.mockResolvedValue(null);
        const response = await GET(
            new NextRequest(
                "http://localhost/api/chat/run?runId=another-user-run",
            ),
        );
        expect(response.status).toBe(404);
        expect(chatRun.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "another-user-run", actorId: "user-1" },
            }),
        );
    });
});
