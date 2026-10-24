import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScanSummary } from "@/lib/security-scanner";

const { findUniqueMock, findFirstMock, findManyMock } = vi.hoisted(() => ({
    findUniqueMock: vi.fn(),
    findFirstMock: vi.fn(),
    findManyMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
    prisma: {
        repoScan: {
            findUnique: findUniqueMock,
            findFirst: findFirstMock,
            findMany: findManyMock,
        },
    },
}));

import { getPreviousScan, getUserScanHistory } from "@/lib/services/scan-storage";

function buildDbScan(overrides: Record<string, unknown>) {
    const summary: ScanSummary = {
        total: 1,
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        info: 0,
    };
    return {
        id: "scan-id",
        owner: "acme",
        repo: "widget",
        timestamp: BigInt(1000),
        expiresAt: new Date(Date.now() + 60_000),
        depth: "quick",
        summary,
        findings: [],
        userId: null,
        ...overrides,
    };
}

describe("getPreviousScan", () => {
    beforeEach(() => {
        findUniqueMock.mockReset();
        findFirstMock.mockReset();
    });

    it("returns previous scan from repository history", async () => {
        findFirstMock.mockResolvedValue(buildDbScan({ id: "older-a", timestamp: BigInt(1700) }));

        const result = await getPreviousScan("acme", "widget", "current", 1800);
        expect(result?.id).toBe("older-a");
        expect(findFirstMock).toHaveBeenCalledOnce();
    });

    it("loads current scan when timestamp is omitted", async () => {
        findUniqueMock.mockResolvedValue(buildDbScan({ id: "current", timestamp: BigInt(2000) }));
        findFirstMock.mockResolvedValue(buildDbScan({ id: "older-b", timestamp: BigInt(1700) }));

        const result = await getPreviousScan("acme", "widget", "current");
        expect(result?.id).toBe("older-b");
        expect(findUniqueMock).toHaveBeenCalledOnce();
        expect(findFirstMock).toHaveBeenCalledOnce();
    });
});

describe("getUserScanHistory", () => {
    it("keeps expired scan metadata in the account history", async () => {
        findManyMock.mockResolvedValue([buildDbScan({ expiresAt: new Date(0) })]);

        const scans = await getUserScanHistory("user-1", 20);

        expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
            where: { userId: "user-1" },
            take: 20,
        }));
        expect(scans[0]).toMatchObject({ id: "scan-id", expiresAt: 0, timestamp: 1000 });
        expect(scans[0]).not.toHaveProperty("findings");
    });
});
