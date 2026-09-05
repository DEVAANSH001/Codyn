import { beforeEach, describe, expect, it, vi } from "vitest";

const {
    kvValues,
    scardMock,
    getMock,
    setMock,
    repoScanCountMock,
    userCountMock,
    userAggregateMock,
} = vi.hoisted(() => ({
    kvValues: new Map<string, unknown>(),
    scardMock: vi.fn(),
    getMock: vi.fn(),
    setMock: vi.fn(),
    repoScanCountMock: vi.fn(),
    userCountMock: vi.fn(),
    userAggregateMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@vercel/kv", () => ({
    kv: {
        scard: scardMock,
        get: getMock,
        set: setMock,
    },
}));

vi.mock("@/lib/db", () => ({
    prisma: {
        repoScan: {
            count: repoScanCountMock,
        },
        user: {
            count: userCountMock,
            aggregate: userAggregateMock,
        },
    },
}));

vi.mock("@/lib/services/report-false-positives", () => ({
    getFalsePositiveReviewSummary: vi.fn(),
}));

async function loadGetPublicStats() {
    const mod = await import("@/lib/analytics");
    return mod.getPublicStats;
}

describe("getPublicStats resilience", () => {
    beforeEach(() => {
        vi.resetModules();

        kvValues.clear();
        scardMock.mockReset();
        getMock.mockReset();
        setMock.mockReset();
        repoScanCountMock.mockReset();
        userCountMock.mockReset();
        userAggregateMock.mockReset();

        delete process.env.ADMIN_GITHUB_USERNAME;

        getMock.mockImplementation(async (key: string) => {
            return kvValues.get(key) ?? 0;
        });

        setMock.mockImplementation(async (key: string, value: unknown) => {
            kvValues.set(key, value);
            return "OK";
        });

        scardMock.mockResolvedValue(0);
        repoScanCountMock.mockResolvedValue(0);
        userCountMock.mockResolvedValue(0);
        userAggregateMock.mockResolvedValue({ _sum: { queryCount: 0 } });
    });

    it("retries transient failures and computes stats without collapsing to zero", async () => {
        kvValues.set("queries:total", 250);
        kvValues.set("stats:adjustment:visitors", 7);
        kvValues.set("stats:adjustment:queries", 9);

        scardMock
            .mockRejectedValueOnce(new Error("transient kv timeout"))
            .mockResolvedValue(80);
        repoScanCountMock.mockResolvedValue(31);
        userCountMock.mockResolvedValue(17);
        userAggregateMock.mockResolvedValue({ _sum: { queryCount: 120 } });

        const getPublicStats = await loadGetPublicStats();
        const result = await getPublicStats();

        expect(scardMock).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            totalVisitors: 104,
            totalQueries: 379,
            totalScans: 31,
        });
        expect(setMock).toHaveBeenCalledWith(
            expect.stringContaining("stats:public:last-good"),
            expect.objectContaining(result),
            expect.objectContaining({ ex: expect.any(Number) }),
        );
    });

    it("returns last-known-good snapshot when live reads fail", async () => {
        kvValues.set("queries:total", 100);
        kvValues.set("stats:adjustment:visitors", 5);
        kvValues.set("stats:adjustment:queries", 10);
        scardMock.mockResolvedValue(50);
        repoScanCountMock.mockResolvedValue(20);
        userCountMock.mockResolvedValue(7);
        userAggregateMock.mockResolvedValue({ _sum: { queryCount: 50 } });

        const getPublicStats = await loadGetPublicStats();
        const first = await getPublicStats();

        scardMock.mockRejectedValue(new Error("kv unavailable"));
        getMock.mockRejectedValue(new Error("kv unavailable"));
        repoScanCountMock.mockRejectedValue(new Error("db unavailable"));
        userCountMock.mockRejectedValue(new Error("db unavailable"));
        userAggregateMock.mockRejectedValue(new Error("db unavailable"));

        const second = await getPublicStats();

        expect(first).toEqual({
            totalVisitors: 62,
            totalQueries: 160,
            totalScans: 20,
        });
        expect(second).toEqual(first);
    });
});
