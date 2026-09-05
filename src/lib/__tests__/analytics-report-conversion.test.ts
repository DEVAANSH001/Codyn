import { beforeEach, describe, expect, it, vi } from "vitest";

type PipelineCall = { type: string; key: string };

const {
    pipelineCalls,
    scardMock,
    getMock,
    smembersMock,
    hgetallMock,
    keysMock,
    execInfoMock,
    lrangeMock,
    pipelineExecMock,
    userFindManyMock,
    userAggregateMock,
    repoScanGroupByMock,
    recentSearchGroupByMock,
    chatGroupByMock,
    reportFalsePositiveFindManyMock,
    reportFalsePositiveGroupByMock,
} = vi.hoisted(() => ({
    pipelineCalls: [] as PipelineCall[],
    scardMock: vi.fn(),
    getMock: vi.fn(),
    smembersMock: vi.fn(),
    hgetallMock: vi.fn(),
    keysMock: vi.fn(),
    execInfoMock: vi.fn(),
    lrangeMock: vi.fn(),
    pipelineExecMock: vi.fn(),
    userFindManyMock: vi.fn(),
    userAggregateMock: vi.fn(),
    repoScanGroupByMock: vi.fn(),
    recentSearchGroupByMock: vi.fn(),
    chatGroupByMock: vi.fn(),
    reportFalsePositiveFindManyMock: vi.fn(),
    reportFalsePositiveGroupByMock: vi.fn(),
}));

vi.mock("@vercel/kv", () => ({
    kv: {
        scard: scardMock,
        get: getMock,
        smembers: smembersMock,
        hgetall: hgetallMock,
        keys: keysMock,
        exec: execInfoMock,
        lrange: lrangeMock,
        pipeline: () => {
            const localCalls: PipelineCall[] = [];
            const pipeline = {
                get: (key: string) => {
                    localCalls.push({ type: "get", key });
                    return pipeline;
                },
                hgetall: (key: string) => {
                    localCalls.push({ type: "hgetall", key });
                    return pipeline;
                },
                smembers: (key: string) => {
                    localCalls.push({ type: "smembers", key });
                    return pipeline;
                },
                incr: (key: string) => {
                    localCalls.push({ type: "incr", key });
                    return pipeline;
                },
                incrby: (key: string) => {
                    localCalls.push({ type: "incrby", key });
                    return pipeline;
                },
                del: (key: string) => {
                    localCalls.push({ type: "del", key });
                    return pipeline;
                },
                decrby: (key: string) => {
                    localCalls.push({ type: "decrby", key });
                    return pipeline;
                },
                srem: (key: string) => {
                    localCalls.push({ type: "srem", key });
                    return pipeline;
                },
                expire: (key: string) => {
                    localCalls.push({ type: "expire", key });
                    return pipeline;
                },
                lpush: () => pipeline,
                ltrim: () => pipeline,
                sadd: () => pipeline,
                hset: () => pipeline,
                hincrby: () => pipeline,
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
        user: {
            findMany: userFindManyMock,
            aggregate: userAggregateMock,
        },
        repoScan: {
            groupBy: repoScanGroupByMock,
        },
        recentSearch: {
            groupBy: recentSearchGroupByMock,
        },
        chatConversation: {
            groupBy: chatGroupByMock,
        },
        reportFalsePositive: {
            findMany: reportFalsePositiveFindManyMock,
            groupBy: reportFalsePositiveGroupByMock,
        },
    },
}));

import { getAnalyticsData, getAnalyticsDetails, resetReportConversionMetrics, trackReportConversionEvent } from "@/lib/analytics";

describe("report conversion analytics", () => {
    beforeEach(() => {
        pipelineCalls.length = 0;
        scardMock.mockReset();
        getMock.mockReset();
        smembersMock.mockReset();
        hgetallMock.mockReset();
        keysMock.mockReset();
        execInfoMock.mockReset();
        lrangeMock.mockReset();
        pipelineExecMock.mockReset();
        userFindManyMock.mockReset();
        userAggregateMock.mockReset();
        repoScanGroupByMock.mockReset();
        recentSearchGroupByMock.mockReset();
        chatGroupByMock.mockReset();
        reportFalsePositiveFindManyMock.mockReset();
        reportFalsePositiveGroupByMock.mockReset();

        scardMock.mockResolvedValue(0);
        getMock.mockResolvedValue(0);
        smembersMock.mockResolvedValue([]);
        hgetallMock.mockResolvedValue({});
        keysMock.mockResolvedValue([]);
        execInfoMock.mockImplementation(async (command: unknown) => {
            if (Array.isArray(command)) {
                if (command[0] === "ZCARD" || command[0] === "ZCOUNT") return 0;
                if (command[0] === "ZREVRANGE") return [];
                if (command[0] === "ZADD" || command[0] === "ZREM") return 1;
                if (command[0] === "INFO") return "total_data_size:0";
            }
            return 0;
        });
        lrangeMock.mockResolvedValue([]);
        pipelineExecMock.mockResolvedValue([]);
        userFindManyMock.mockResolvedValue([]);
        userAggregateMock.mockResolvedValue({
            _sum: { queryCount: 0 },
            _count: { id: 0 },
        });
        repoScanGroupByMock.mockResolvedValue([]);
        recentSearchGroupByMock.mockResolvedValue([]);
        chatGroupByMock.mockResolvedValue([]);
        reportFalsePositiveFindManyMock.mockResolvedValue([]);
        reportFalsePositiveGroupByMock.mockResolvedValue([]);
    });

    it("tracks report conversion with total and daily counters", async () => {
        await trackReportConversionEvent("report_fix_chat_started", "scan_123");

        const incrementedKeys = pipelineCalls.filter((c) => c.type === "incr").map((c) => c.key);
        expect(incrementedKeys).toContain("stats:report:report_fix_chat_started");
        expect(incrementedKeys.some((key) => key.startsWith("stats:report:report_fix_chat_started:"))).toBe(true);
        expect(incrementedKeys).toContain("stats:report:scan:scan_123:report_fix_chat_started");
    });

    it("skips report conversion for the configured admin", async () => {
        process.env.ADMIN_GITHUB_USERNAME = "403errors";

        await trackReportConversionEvent("report_fix_chat_started", "scan_123", {
            actorUsername: "403errors",
        });

        expect(pipelineCalls.filter((c) => c.type === "incr")).toEqual([]);
    });

    it("resets report funnel metrics", async () => {
        keysMock.mockResolvedValue([
            "stats:report:report_viewed_shared",
            "stats:report:report_fix_chat_started:2026-03-09",
        ]);

        await resetReportConversionMetrics();

        expect(pipelineCalls.filter((c) => c.type === "del").map((c) => c.key)).toEqual([
            "stats:report:report_viewed_shared",
            "stats:report:report_fix_chat_started:2026-03-09",
        ]);
    });

    it("returns report funnel metrics in analytics payload", async () => {
        const data = await getAnalyticsData();

        expect(data.reportFunnel).toBeDefined();
        expect(data.reportFunnel?.weeklyConversionRate).toBeGreaterThanOrEqual(0);
        expect(data.reportFunnel?.weeklyFalsePositiveRate).toBeGreaterThanOrEqual(0);
        expect(data.reportFunnel?.weeklyExpiredLinkFailures).toBeGreaterThanOrEqual(0);
        expect(data.reportFunnel?.totals.report_viewed_shared).toBeGreaterThanOrEqual(0);
        expect(data.falsePositiveReview?.recentSubmissions).toEqual([]);
    });

    it("derives retention from legacy visitor hashes when new retention indexes are empty", async () => {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        smembersMock.mockImplementation(async (key: string) => {
            if (key === "visitors") {
                return ["anon_repeat", "anon_single"];
            }
            return [];
        });

        execInfoMock.mockImplementation(async (command: unknown) => {
            if (Array.isArray(command)) {
                if (command[0] === "ZCARD" || command[0] === "ZCOUNT") return 0;
                if (command[0] === "ZREVRANGE" || command[0] === "ZRANGEBYSCORE") return [];
                if (command[0] === "ZADD" || command[0] === "ZREM") return 1;
                if (command[0] === "INFO") return "total_data_size:0";
            }
            return 0;
        });

        pipelineExecMock.mockImplementation(async (localCalls: PipelineCall[]) => {
            if (localCalls.every((call) => call.type === "smembers" && call.key.startsWith("stats:active:day:"))) {
                return localCalls.map(() => []);
            }

            if (localCalls.every((call) => call.type === "hgetall" && call.key.startsWith("visitor:"))) {
                return localCalls.map((call) => {
                    if (call.key === "visitor:anon_repeat") {
                        return {
                            firstSeen: now - 20 * dayMs,
                            lastSeen: now - 2 * dayMs,
                            queryCount: 5,
                        };
                    }

                    return {
                        firstSeen: now - dayMs,
                        lastSeen: now - dayMs,
                        queryCount: 1,
                    };
                });
            }

            return [];
        });

        const details = await getAnalyticsDetails({
            visitorLimit: 10,
            loggedInLimit: 10,
            includeSelection: false,
            includeFunnel: false,
            includeFalsePositiveReview: false,
            includeKvHistory: false,
        });

        expect(details.returningUsers30d).toBe(1);
        expect(details.retentionRate30d).toBe(50);
    });

    it("returns recent visitors from legacy visitor hashes when actor recency index is empty", async () => {
        const now = Date.now();

        smembersMock.mockImplementation(async (key: string) => {
            if (key === "visitors") {
                return ["anon_legacy"];
            }
            return [];
        });

        execInfoMock.mockImplementation(async (command: unknown) => {
            if (Array.isArray(command)) {
                if (command[0] === "ZREVRANGE" || command[0] === "ZRANGEBYSCORE") return [];
                if (command[0] === "ZCARD" || command[0] === "ZCOUNT") return 0;
                if (command[0] === "ZADD" || command[0] === "ZREM") return 1;
                if (command[0] === "INFO") return "total_data_size:0";
            }
            return 0;
        });

        pipelineExecMock.mockImplementation(async (localCalls: PipelineCall[]) => {
            if (localCalls.every((call) => call.type === "hgetall" && call.key.startsWith("visitor:"))) {
                return localCalls.map(() => ({
                    firstSeen: now - 2 * 60 * 60 * 1000,
                    lastSeen: now - 60 * 1000,
                    queryCount: 3,
                    country: "IN",
                    device: "desktop",
                }));
            }

            if (localCalls.every((call) => call.type === "smembers" && call.key.startsWith("stats:active:day:"))) {
                return localCalls.map(() => []);
            }

            return [];
        });

        const details = await getAnalyticsDetails({
            visitorLimit: 10,
            loggedInLimit: 10,
            includeSelection: false,
            includeFunnel: false,
            includeFalsePositiveReview: false,
            includeKvHistory: false,
        });

        expect(details.recentVisitors).toHaveLength(1);
        expect(details.recentVisitors?.[0]).toMatchObject({
            id: "anon_legacy",
            actorType: "anonymous",
            country: "IN",
            device: "desktop",
            queryCount: 3,
        });
    });
});
