import type { ScanRecord } from "./codyn-dashboard";

export interface DashboardScan {
    id: string;
    owner: string;
    repo: string;
    timestamp: number;
    depth: string;
    summary: { high: number; medium: number; low: number; total: number };
    source: "account" | "browser";
    href: string;
    expired: boolean;
}

export type AccountScanHistory = Omit<DashboardScan, "source" | "href" | "expired"> & { expiresAt: number };

export function mergeScanHistory(accountScans: AccountScanHistory[], browserScans: ScanRecord[], limit?: number, now = Date.now()): DashboardScan[] {
    const account: DashboardScan[] = accountScans.map(scan => ({
        id: scan.id,
        owner: scan.owner,
        repo: scan.repo,
        timestamp: scan.timestamp,
        depth: scan.depth,
        summary: scan.summary,
        source: "account",
        href: `/report/${encodeURIComponent(scan.id)}`,
        expired: scan.expiresAt <= now,
    }));
    const browser: DashboardScan[] = browserScans.map(scan => ({
        id: scan.id,
        owner: scan.owner,
        repo: scan.repo,
        timestamp: Date.parse(scan.createdAt) || 0,
        depth: scan.depth,
        summary: { ...scan.issues, total: scan.issues.high + scan.issues.medium + scan.issues.low },
        source: "browser",
        href: `/report/local/${encodeURIComponent(scan.id)}`,
        expired: false,
    }));
    const combined = [...account, ...browser].sort((a, b) => b.timestamp - a.timestamp);
    return typeof limit === "number" && limit > 0 ? combined.slice(0, limit) : combined;
}
