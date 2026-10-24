import { describe, expect, it } from "vitest";
import { mergeScanHistory } from "@/lib/scan-history";

describe("mergeScanHistory", () => {
    it("shows account and browser scans newest first with working report destinations", () => {
        const scans = mergeScanHistory(
            [{ id: "account-1", owner: "acme", repo: "server", timestamp: 1000, expiresAt: 1500, depth: "deep", summary: { high: 1, medium: 0, low: 0, total: 1 } }],
            [{ id: "browser-1", owner: "acme", repo: "local", createdAt: new Date(2000).toISOString(), depth: "quick", issues: { high: 0, medium: 2, low: 1 } }],
            undefined,
            2000,
        );

        expect(scans.map(scan => [scan.source, scan.href, scan.expired])).toEqual([
            ["browser", "/report/local/browser-1", false],
            ["account", "/report/account-1", true],
        ]);
        expect(scans[0].summary.total).toBe(3);
        expect(mergeScanHistory([], [], 5)).toEqual([]);
        expect(mergeScanHistory([], [{ id: "browser-1", owner: "acme", repo: "local", createdAt: new Date(2000).toISOString(), depth: "quick", issues: { high: 0, medium: 2, low: 1 } }], 1)).toHaveLength(1);
    });
});
