import { afterEach, describe, expect, it, vi } from "vitest";
import { createChatRun } from "../chat-run-client";

const conversation = {
    scope: "repo" as const,
    owner: "octocat",
    repo: "Hello-World",
};

describe("createChatRun", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("allows streaming without a run only for explicit disabled persistence", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValue(
                    Response.json({ runId: null, persistence: "disabled" }),
                ),
        );
        expect(await createChatRun(conversation)).toBeNull();
    });

    it("returns a persisted run and sends the requested conversation", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(
                Response.json({ runId: "run-1", persistence: "enabled" }),
            );
        vi.stubGlobal("fetch", fetchMock);
        expect(await createChatRun(conversation)).toBe("run-1");
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
            ...conversation,
            clientRequestId: expect.any(String),
        });
    });

    it.each([401, 503])(
        "preserves HTTP %s failures instead of silently skipping run creation",
        async (status) => {
            const code =
                status === 401 ? "INVALID_SESSION" : "CHAT_STORAGE_UNAVAILABLE";
            vi.stubGlobal(
                "fetch",
                vi
                    .fn()
                    .mockResolvedValue(
                        Response.json(
                            { error: "Cannot start chat", code },
                            { status },
                        ),
                    ),
            );
            await expect(createChatRun(conversation)).rejects.toMatchObject({
                status,
                code,
                message: "Cannot start chat",
            });
        },
    );

    it("rejects successful but malformed responses", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(Response.json({ runId: null })),
        );
        await expect(createChatRun(conversation)).rejects.toThrow(
            "valid conversation",
        );
    });
});
