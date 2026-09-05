import { beforeEach, describe, expect, it, vi } from "vitest";

type PipelineCall = { type: string; key: string };

const { pipelineCalls, pipelineExecMock } = vi.hoisted(() => ({
    pipelineCalls: [] as PipelineCall[],
    pipelineExecMock: vi.fn(),
}));

vi.mock("@vercel/kv", () => ({
    kv: {
        pipeline: () => {
            const localCalls: PipelineCall[] = [];
            const pipeline = {
                incr: (key: string) => {
                    localCalls.push({ type: "incr", key });
                    return pipeline;
                },
                incrby: (key: string) => {
                    localCalls.push({ type: "incrby", key });
                    return pipeline;
                },
                expire: (key: string) => {
                    localCalls.push({ type: "expire", key });
                    return pipeline;
                },
                exec: async () => {
                    pipelineCalls.push(...localCalls);
                    return pipelineExecMock(localCalls);
                },
            };
            return pipeline;
        },
    },
}));

vi.mock("@/lib/db", () => ({
    prisma: {
        user: { findMany: vi.fn(), aggregate: vi.fn() },
        repoScan: { groupBy: vi.fn(), count: vi.fn() },
        recentSearch: { groupBy: vi.fn() },
        chatConversation: { groupBy: vi.fn() },
        reportFalsePositive: { findMany: vi.fn(), groupBy: vi.fn() },
    },
}));

vi.mock("@/lib/services/report-false-positives", () => ({
    getFalsePositiveReviewSummary: vi.fn(),
}));

import { trackSelectionPerformance } from "@/lib/analytics";

describe("selection telemetry sampling", () => {
    beforeEach(() => {
        pipelineCalls.length = 0;
        pipelineExecMock.mockReset();
    });

    it("skips telemetry writes for non-sampled requests", async () => {
        const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.91);
        await trackSelectionPerformance({ type: "index_hit", selectionMs: 120 });
        randomSpy.mockRestore();

        expect(pipelineCalls).toEqual([]);
    });

    it("writes sampled telemetry without legacy :count keys", async () => {
        const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.01);
        await trackSelectionPerformance({ type: "llm_fallback", selectionMs: 87 });
        randomSpy.mockRestore();

        expect(pipelineCalls.some((call) => call.key.includes(":count"))).toBe(false);
        expect(pipelineCalls.some((call) => call.type === "incrby" && call.key.includes(":ms_total"))).toBe(true);
        expect(pipelineCalls.some((call) => call.type === "incr" && call.key.includes(":llm_fallback"))).toBe(true);
    });
});
