import { beforeEach, describe, expect, it, vi } from "vitest";

const { kvGetMock, pipelineExecMock, pipelineCalls } = vi.hoisted(() => ({
    kvGetMock: vi.fn(),
    pipelineExecMock: vi.fn(),
    pipelineCalls: [] as string[],
}));

vi.mock("@vercel/kv", () => ({
    kv: {
        get: kvGetMock,
        pipeline: () => {
            const keys: string[] = [];
            const pipeline = {
                incr: (key: string) => {
                    keys.push(`incr:${key}`);
                    return pipeline;
                },
                expire: (key: string) => {
                    keys.push(`expire:${key}`);
                    return pipeline;
                },
                exec: async () => {
                    pipelineCalls.push(...keys);
                    return pipelineExecMock(keys);
                },
            };
            return pipeline;
        },
    },
}));

import { loadRepoIndex } from "@/lib/services/repo-index-service";

describe("repo index access write throttle", () => {
    beforeEach(() => {
        kvGetMock.mockReset();
        pipelineExecMock.mockReset();
        pipelineCalls.length = 0;

        kvGetMock.mockImplementation(async (key: string) => {
            if (key === "index_head:acme/widget") return "sha123";
            if (key === "repo_index:acme/widget:sha123:v1") {
                return JSON.stringify({
                    version: 1,
                    createdAt: 1,
                    entries: [],
                });
            }
            return null;
        });
    });

    it("records access at most once within throttle window", async () => {
        const first = await loadRepoIndex("acme", "widget");
        const second = await loadRepoIndex("acme", "widget");

        expect(first).not.toBeNull();
        expect(second).not.toBeNull();
        expect(pipelineExecMock).toHaveBeenCalledTimes(1);
        expect(pipelineCalls.some((entry) => entry.startsWith("incr:index_access:acme/widget"))).toBe(true);
    });
});
