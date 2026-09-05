import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    kvIncrByMock,
    kvExpireMock,
    kvMGetMock,
    kvSetExMock,
} = vi.hoisted(() => ({
    kvIncrByMock: vi.fn(),
    kvExpireMock: vi.fn(),
    kvMGetMock: vi.fn(),
    kvSetExMock: vi.fn(),
}));

vi.mock("@vercel/kv", () => ({
    kv: {
        incrby: kvIncrByMock,
        expire: kvExpireMock,
        mget: kvMGetMock,
        setex: kvSetExMock,
    },
}));

import { consumeToolBudgetUsage, resolveAnonymousConsecutivePaths } from "@/lib/cache";

describe("cache command reduction helpers", () => {
    beforeEach(() => {
        kvIncrByMock.mockReset();
        kvExpireMock.mockReset();
        kvMGetMock.mockReset();
        kvSetExMock.mockReset();
    });

    it("sets tool-budget expiry only on first write of the day key", async () => {
        kvIncrByMock.mockResolvedValueOnce(2);
        kvExpireMock.mockResolvedValue(1);

        await consumeToolBudgetUsage("repo", "anonymous", "anon_1", 2);
        expect(kvExpireMock).toHaveBeenCalledTimes(1);

        kvIncrByMock.mockResolvedValueOnce(5);
        await consumeToolBudgetUsage("repo", "anonymous", "anon_1", 3);
        expect(kvExpireMock).toHaveBeenCalledTimes(1);
    });

    it("caps anonymous consecutive-path tracking writes to 5 paths", async () => {
        kvIncrByMock.mockResolvedValue(10);
        kvMGetMock.mockResolvedValue([]);
        kvSetExMock.mockResolvedValue("OK");

        const paths = ["a", "b", "c", "d", "e", "f", "g"];
        await resolveAnonymousConsecutivePaths("acme", "repo", paths, {
            audience: "anonymous",
            actorId: "anon_1",
            visibility: "public",
        });

        expect(kvMGetMock).toHaveBeenCalledTimes(1);
        const keysArg = kvMGetMock.mock.calls[0]?.[0] as string[];
        expect(keysArg.length).toBe(5);
        expect(kvSetExMock).toHaveBeenCalledTimes(5);
    });
});
