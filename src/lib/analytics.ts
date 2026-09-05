import { kv } from "@vercel/kv";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import type { FalsePositiveReviewSummary } from "@/lib/services/report-false-positives";
import { getFalsePositiveReviewSummary } from "@/lib/services/report-false-positives";

export interface KVUsagePoint {
    timestamp: number;
    size: number; // bytes
}

export interface AnalyticsData {
    totalVisitors: number;
    totalQueries: number;
    activeNow: number;
    activeUsers24h: number;
    returningUsers30d: number;
    retentionRate30d: number;
    totalLoggedInUsers: number;
    deviceStats: Record<string, number>;
    countryStats: Record<string, number>;
    recentVisitors: VisitorData[];
    loggedInUsers: LoggedInUserData[];
    nextVisitorCursor?: string | null;
    nextLoggedInCursor?: string | null;
    kvStats?: {
        currentSize: number;
        maxSize: number;
        history?: KVUsagePoint[];
    };
    searchPerformance?: {
        byWindow: Record<SelectionPerformanceWindow, SelectionPerformanceMetrics>;
    };
    reportFunnel?: ReportFunnelMetrics;
    falsePositiveReview?: FalsePositiveReviewSummary;
}

export interface AnalyticsSummaryData {
    totalVisitors: number;
    totalQueries: number;
    totalLoggedInUsers: number;
    deviceStats: Record<string, number>;
    countryStats: Record<string, number>;
    kvStats?: {
        currentSize: number;
        maxSize: number;
        history?: KVUsagePoint[];
    };
}

export interface AnalyticsDetailsOptions {
    visitorLimit?: number;
    visitorCursor?: string | null;
    loggedInLimit?: number;
    loggedInCursor?: string | null;
    includeSelection?: boolean;
    includeFunnel?: boolean;
    includeFalsePositiveReview?: boolean;
    includeKvHistory?: boolean;
}

export interface VisitorData {
    id: string;
    actorType: "anonymous" | "authenticated";
    actorKey: string;
    userId?: string | null;
    anonId?: string | null;
    githubLogin?: string | null;
    email?: string | null;
    country: string;
    device: string;
    lastSeen: number;
    queryCount: number;
    firstSeen: number;
}

export interface LoggedInUserData {
    id: string;
    email: string | null;
    githubLogin: string | null;
    queryCount: number;
    scanCount: number;
    searchCount: number;
    chatCount: number;
    createdAt: number;
    lastActivityAt: number | null;
}

export type SelectionPerformanceWindow = "24h" | "7d";

export interface SelectionPerformanceMetrics {
    avgSelectionMs: number;
    indexHitRate: number;
    fallbackRate: number;
    selections: number;
}

export const REPORT_CONVERSION_EVENTS = [
    "report_viewed_shared",
    "report_fix_prompt_copied",
    "report_fix_prompt_previewed",
    "report_fix_login_gate_shown",
    "report_fix_login_completed",
    "report_fix_chat_started",
    "report_false_positive_flagged",
    "report_shared_link_invalid",
    "report_expired_viewed",
    // Legacy keys kept for backwards compatibility with historical tracking.
    "report_fix_in_chat_clicked",
    "report_discuss_in_chat_clicked",
    "report_create_pr_clicked",
    "report_create_pr_login_completed",
    "report_create_pr_phase2_waitlist_shown",
] as const;

export type ReportConversionEvent = (typeof REPORT_CONVERSION_EVENTS)[number];

export interface ReportFunnelMetrics {
    totals: Record<ReportConversionEvent, number>;
    weekly: Record<ReportConversionEvent, number>;
    weeklyConversionRate: number;
    weeklyFalsePositiveRate: number;
    weeklyExpiredLinkFailures: number;
}

interface ReportConversionTrackingOptions {
    actorUsername?: string | null;
}

const SELECTION_TELEMETRY_SAMPLE_RATE = 0.1;
const DEFAULT_VISITOR_DETAIL_LIMIT = 10;
const DEFAULT_LOGGED_IN_DETAIL_LIMIT = 10;
const DEFAULT_ADMIN_ANALYTICS_REVALIDATE_SECONDS = 60;
const ACTIVE_DAY_TTL_SECONDS = 45 * 24 * 60 * 60;
const ACTOR_LAST_SEEN_KEY = "stats:actors:last_seen";
const ACTOR_HASH_PREFIX = "actor:";
const ACTIVE_DAY_PREFIX = "stats:active:day:";
const LEGACY_VISITORS_SET_KEY = "visitors";
const ANALYTICS_DB_BACKOFF_MS = 30_000;
const ANALYTICS_DB_WARNING_THROTTLE_MS = 60_000;
const PRISMA_CONNECTIVITY_ERROR_CODES = new Set(["P1001", "P1008", "P2024"]);
const PRISMA_CONNECTIVITY_ERROR_PATTERNS = [
    "can't reach database server",
    "timed out fetching a new connection from the connection pool",
    "connection pool timeout",
] as const;

let analyticsDbBackoffUntil = 0;
let lastAnalyticsDbWarningAt = 0;

export const ADMIN_ANALYTICS_CACHE_TAGS = [
    "admin-analytics-summary",
    "admin-analytics-details",
    "admin-analytics-snapshot",
    "admin-logged-in-users",
] as const;

function actorHashKey(actorMember: string): string {
    return `${ACTOR_HASH_PREFIX}${actorMember}`;
}

function activeDayKey(dayKey: string): string {
    return `${ACTIVE_DAY_PREFIX}${dayKey}`;
}

function actorMemberFromAnonId(anonId: string): string {
    return `anon:${anonId}`;
}

function actorMemberFromUserId(userId: string): string {
    return `user:${userId}`;
}

function parseOffsetCursor(rawCursor?: string | null): number {
    if (!rawCursor) return 0;
    const parsed = Number.parseInt(rawCursor, 10);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
}

function nextOffsetCursor(offset: number, fetched: number, totalKnown?: number): string | null {
    if (fetched <= 0) return null;
    const next = offset + fetched;
    if (typeof totalKnown === "number" && next >= totalKnown) {
        return null;
    }
    return String(next);
}

const EMPTY_SELECTION_METRICS: SelectionPerformanceMetrics = {
    avgSelectionMs: 0,
    indexHitRate: 0,
    fallbackRate: 0,
    selections: 0,
};

const EMPTY_FALSE_POSITIVE_REVIEW: FalsePositiveReviewSummary = {
    total: 0,
    pending: 0,
    confirmedFalsePositive: 0,
    rejected: 0,
    recentSubmissions: [],
};

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "";
}

function getPrismaErrorCode(error: unknown): string | null {
    if (!error || typeof error !== "object") return null;
    if (!("code" in error)) return null;
    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === "string" ? maybeCode : null;
}

function isPrismaConnectivityError(error: unknown): boolean {
    const code = getPrismaErrorCode(error);
    if (code && PRISMA_CONNECTIVITY_ERROR_CODES.has(code)) {
        return true;
    }

    const message = getErrorMessage(error).toLowerCase();
    return PRISMA_CONNECTIVITY_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

function isAnalyticsDbInBackoff(): boolean {
    return Date.now() < analyticsDbBackoffUntil;
}

function activateAnalyticsDbBackoff(context: string, error: unknown): boolean {
    if (!isPrismaConnectivityError(error)) {
        return false;
    }

    const now = Date.now();
    analyticsDbBackoffUntil = Math.max(analyticsDbBackoffUntil, now + ANALYTICS_DB_BACKOFF_MS);

    if (now - lastAnalyticsDbWarningAt > ANALYTICS_DB_WARNING_THROTTLE_MS) {
        const code = getPrismaErrorCode(error);
        const detail = code ? `code=${code}` : "transient connection error";
        console.warn(`[analytics] ${context}: DB unavailable (${detail}); using KV-only fallback temporarily.`);
        lastAnalyticsDbWarningAt = now;
    }

    return true;
}

const getCachedFalsePositiveReviewSummary = unstable_cache(
    async (): Promise<FalsePositiveReviewSummary> => {
        if (isAnalyticsDbInBackoff()) {
            return EMPTY_FALSE_POSITIVE_REVIEW;
        }

        try {
            return await getFalsePositiveReviewSummary(25);
        } catch (error) {
            if (!activateAnalyticsDbBackoff("false positive review summary", error)) {
                console.warn("False positive review summary unavailable, serving empty summary.");
            }
            return EMPTY_FALSE_POSITIVE_REVIEW;
        }
    },
    ["admin-false-positive-review-v1"],
    { revalidate: DEFAULT_ADMIN_ANALYTICS_REVALIDATE_SECONDS, tags: ["admin-analytics-snapshot", "admin-analytics-details"] },
);

/**
 * Fetch and parse KV info for storage stats
 */
async function getKVStats(): Promise<{ currentSize: number, maxSize: number }> {
    try {
        const info = await kv.exec(['INFO']) as string;

        // Parse "total_data_size" and "max_data_size"
        const totalSizeMatch = info.match(/total_data_size:(\d+)/);
        return {
            currentSize: totalSizeMatch ? parseInt(totalSizeMatch[1], 10) : 0,
            maxSize: 256 * 1024 * 1024 // Final corrected limit: 256MB
        };
    } catch (error) {
        console.error("Failed to fetch KV stats:", error);
        return { currentSize: 0, maxSize: 256 * 1024 * 1024 };
    }
}

/**
 * Record current KV usage in history list
 */
async function recordKVUsageHistory(currentSize: number): Promise<KVUsagePoint[]> {
    const HISTORY_KEY = "stats:kv:history";
    const MAX_HISTORY = 5000; // ~100 days @ 30 min intervals
    const INTERVAL = 30 * 60 * 1000; // 30 mins
    const now = Date.now();

    try {
        // Get the last point to check for throttling
        const lastPoints = await kv.lrange(HISTORY_KEY, 0, 0) as KVUsagePoint[];
        let shouldAdd = true;

        if (lastPoints && lastPoints.length > 0) {
            const lastPoint = lastPoints[0];
            if (now - lastPoint.timestamp < INTERVAL) {
                shouldAdd = false;
            }
        }

        if (shouldAdd) {
            const newPoint: KVUsagePoint = { timestamp: now, size: currentSize };
            const pipeline = kv.pipeline();
            pipeline.lpush(HISTORY_KEY, newPoint);
            pipeline.ltrim(HISTORY_KEY, 0, MAX_HISTORY - 1);
            await pipeline.exec();
        }

        // Return the full history
        const history = await kv.lrange(HISTORY_KEY, 0, MAX_HISTORY - 1) as KVUsagePoint[];
        return history.reverse(); // Reverse so it's chronological for the graph
    } catch (error) {
        console.error("Failed to record KV history:", error);
        return [];
    }
}

async function trackActorActivity(params: {
    actorMember: string;
    actorType: "anonymous" | "authenticated";
    country?: string;
    device?: "mobile" | "desktop" | "unknown";
    userAgent?: string;
    userId?: string | null;
    anonId?: string | null;
    queryIncrement?: number;
}): Promise<void> {
    const timestamp = Date.now();
    const dayKey = dayKeyFromDate(new Date(timestamp));
    const hashKey = actorHashKey(params.actorMember);

    const existing = await kv.hgetall<Record<string, string | number>>(hashKey);
    const hasExisting = Boolean(existing && Object.keys(existing).length > 0);
    const pipeline = kv.pipeline();

    pipeline.hset(hashKey, {
        firstSeen: hasExisting ? Number(existing?.firstSeen ?? timestamp) : timestamp,
        lastSeen: timestamp,
        actorType: params.actorType,
        ...(params.country ? { country: params.country } : {}),
        ...(params.device ? { device: params.device } : {}),
        ...(params.userAgent ? { userAgent: params.userAgent } : {}),
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.anonId ? { anonId: params.anonId } : {}),
    });

    if (typeof params.queryIncrement === "number" && params.queryIncrement > 0) {
        pipeline.hincrby(hashKey, "queryCount", params.queryIncrement);
    } else if (!hasExisting) {
        pipeline.hset(hashKey, { queryCount: 0 });
    }

    pipeline.sadd(activeDayKey(dayKey), params.actorMember);
    pipeline.expire(activeDayKey(dayKey), ACTIVE_DAY_TTL_SECONDS);

    await Promise.all([
        kv.exec(["ZADD", ACTOR_LAST_SEEN_KEY, timestamp, params.actorMember]),
        pipeline.exec(),
    ]);
}

/**
 * Track an anonymous visitor event (e.g., query) in KV.
 * Only tracks if the ID starts with 'anon_'.
 */
export async function trackEvent(
    visitorId: string,
    eventType: 'query' | 'visit',
    metadata: {
        country?: string;
        device?: 'mobile' | 'desktop' | 'unknown';
        userAgent?: string;
    }
) {
    // Only track actual anonymous visitors here.
    if (!visitorId.startsWith("anon_")) {
        return;
    }

    try {
        const timestamp = Date.now();
        const visitorKey = `visitor:${visitorId}`;
        const actorMember = actorMemberFromAnonId(visitorId);

        const existing = await kv.hgetall(visitorKey);
        const pipeline = kv.pipeline();

        // 1. Add to global visitors set
        pipeline.sadd(LEGACY_VISITORS_SET_KEY, visitorId);

        // 2. Set static first-seen data only for new visitors
        if (!existing) {
            pipeline.hset(visitorKey, {
                firstSeen: timestamp,
                country: metadata.country || 'Unknown',
                device: metadata.device || 'unknown',
                userAgent: metadata.userAgent || ''
            });
        }

        // 3. Always update dynamic fields
        pipeline.hset(visitorKey, {
            lastSeen: timestamp,
            ...(metadata.country && { country: metadata.country }),
            ...(metadata.device && { device: metadata.device })
        });

        // 4. Increment query counter
        if (eventType === 'query') {
            pipeline.incr("queries:total");
            pipeline.hincrby(visitorKey, "queryCount", 1);
        }

        // 5. Update global device/country stats as hashes (single-key aggregations)
        if (metadata.country) {
            pipeline.hincrby("stats:country", metadata.country, 1);
        }
        if (metadata.device) {
            pipeline.hincrby("stats:device", metadata.device, 1);
        }

        await Promise.all([
            pipeline.exec(),
            trackActorActivity({
                actorMember,
                actorType: "anonymous",
                country: metadata.country,
                device: metadata.device ?? "unknown",
                userAgent: metadata.userAgent,
                anonId: visitorId,
                queryIncrement: eventType === "query" ? 1 : 0,
            }),
        ]);
    } catch (error) {
        console.error("Failed to track analytics event:", error);
    }
}

export async function trackSelectionPerformance(params: {
    type: "index_hit" | "index_miss" | "llm_fallback";
    selectionMs: number;
}): Promise<void> {
    try {
        if (Math.random() >= SELECTION_TELEMETRY_SAMPLE_RATE) {
            return;
        }

        const dayKey = new Date().toISOString().slice(0, 10);
        const baseKey = `stats:selection:${dayKey}`;
        const ttlSeconds = 14 * 24 * 60 * 60;
        const duration = Math.max(0, Math.round(params.selectionMs));

        const pipeline = kv.pipeline();
        pipeline.incrby(`${baseKey}:ms_total`, duration);
        pipeline.incr(`${baseKey}:${params.type}`);
        pipeline.expire(`${baseKey}:ms_total`, ttlSeconds);
        pipeline.expire(`${baseKey}:${params.type}`, ttlSeconds);
        await pipeline.exec();
    } catch (error) {
        console.error("Failed to track selection performance:", error);
    }
}

/**
 * Track an authenticated user query event in Postgres.
 * Also handles migrating stats from an anonymous visitor ID if provided.
 */
export async function trackAuthenticatedQueryEvent(
    userId: string,
    anonOrOptions?: string | {
        anonId?: string;
        country?: string;
        device?: "mobile" | "desktop" | "unknown";
        userAgent?: string;
    }
): Promise<void> {
    try {
        const options = typeof anonOrOptions === "string"
            ? { anonId: anonOrOptions }
            : (anonOrOptions ?? {});
        const anonId = options.anonId;

        // 1. Fetch user to check if admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { githubLogin: true }
        });

        if (isAdminActorUsername(user?.githubLogin)) {
            return;
        }

        // 2. Migration logic: if anonId provided, move its queryCount from KV to Postgres
        let migratedQueries = 0;
        if (anonId && anonId.startsWith("anon_")) {
            const visitorKey = `visitor:${anonId}`;
            const anonActorMember = actorMemberFromAnonId(anonId);
            const existing = await kv.hgetall<Record<string, string | number>>(visitorKey);

            if (existing && existing.queryCount) {
                migratedQueries = Number(existing.queryCount);

                // Atomic migration: decrement KV total and remove visitor record
                const cleanupPipeline = kv.pipeline();
                cleanupPipeline.srem(LEGACY_VISITORS_SET_KEY, anonId);
                cleanupPipeline.del(visitorKey);
                cleanupPipeline.del(actorHashKey(anonActorMember));
                cleanupPipeline.decrby("queries:total", migratedQueries);
                for (const dayKey of getRecentDayKeys(30)) {
                    cleanupPipeline.srem(activeDayKey(dayKey), anonActorMember);
                }
                await Promise.all([
                    cleanupPipeline.exec(),
                    kv.exec(["ZREM", ACTOR_LAST_SEEN_KEY, anonActorMember]),
                ]);
            }
        }

        // 3. Increment authenticated user stats in Postgres
        await prisma.user.upsert({
            where: { id: userId },
            update: {
                queryCount: { increment: migratedQueries + 1 },
                lastQueryAt: new Date(),
            },
            create: {
                id: userId,
                queryCount: migratedQueries + 1,
                lastQueryAt: new Date(),
            },
        });

        await trackActorActivity({
            actorMember: actorMemberFromUserId(userId),
            actorType: "authenticated",
            country: options.country,
            device: options.device ?? "unknown",
            userAgent: options.userAgent,
            userId,
            anonId: anonId ?? null,
            queryIncrement: migratedQueries + 1,
        });
    } catch (error) {
        console.error("Failed to track authenticated query event:", error);
    }
}

function bigIntToNumber(value: bigint | null | undefined): number | null {
    if (typeof value !== "bigint") return null;
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : null;
}

function numberOrZero(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function getLoggedInUserStatsUncached(): Promise<LoggedInUserData[]> {
    if (isAnalyticsDbInBackoff()) {
        return [];
    }

    try {
        type UserRow = Prisma.UserGetPayload<{
            select: {
                id: true;
                email: true;
                githubLogin: true;
                queryCount: true;
                createdAt: true;
                lastQueryAt: true;
            };
        }>;

        const [users, scanAgg, searchAgg, chatAgg] = await Promise.all([
            prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    githubLogin: true,
                    queryCount: true,
                    createdAt: true,
                    lastQueryAt: true,
                },
                orderBy: [{ createdAt: "desc" }],
            }),
            prisma.repoScan.groupBy({
                by: ["userId"],
                where: { userId: { not: null } },
                _count: { _all: true },
                _max: { timestamp: true },
            }),
            prisma.recentSearch.groupBy({
                by: ["userId"],
                _count: { _all: true },
                _max: { timestamp: true },
            }),
            prisma.chatConversation.groupBy({
                by: ["userId"],
                _count: { _all: true },
                _max: { updatedAt: true },
            }),
        ]);

        const scanMap = new Map<string, { count: number; maxTimestamp: number | null }>();
        for (const row of scanAgg) {
            if (!row.userId) continue;
            scanMap.set(row.userId, {
                count: row._count._all,
                maxTimestamp: bigIntToNumber(row._max.timestamp),
            });
        }

        const searchMap = new Map<string, { count: number; maxTimestamp: number | null }>();
        for (const row of searchAgg) {
            searchMap.set(row.userId, {
                count: row._count._all,
                maxTimestamp: bigIntToNumber(row._max.timestamp),
            });
        }

        const chatMap = new Map<string, { count: number; maxTimestamp: number | null }>();
        for (const row of chatAgg) {
            chatMap.set(row.userId, {
                count: row._count._all,
                maxTimestamp: row._max.updatedAt ? row._max.updatedAt.getTime() : null,
            });
        }

        const rows = (users as UserRow[])
            .map((user): LoggedInUserData | null => {
                const scans = scanMap.get(user.id);
                const searches = searchMap.get(user.id);
                const chats = chatMap.get(user.id);
                const lastActivityAt = Math.max(
                    user.lastQueryAt?.getTime() ?? 0,
                    scans?.maxTimestamp ?? 0,
                    searches?.maxTimestamp ?? 0,
                    chats?.maxTimestamp ?? 0,
                );

                if (isAdminActorUsername(user.githubLogin)) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    githubLogin: user.githubLogin,
                    queryCount: user.queryCount,
                    scanCount: scans?.count ?? 0,
                    searchCount: searches?.count ?? 0,
                    chatCount: chats?.count ?? 0,
                    createdAt: user.createdAt.getTime(),
                    lastActivityAt: lastActivityAt > 0 ? lastActivityAt : null,
                };
            })
            .filter((user): user is LoggedInUserData => (
                user !== null &&
                (
                    Boolean(user.email || user.githubLogin) ||
                    user.queryCount > 0 ||
                    user.scanCount > 0 ||
                    user.searchCount > 0 ||
                    user.chatCount > 0
                )
            ))
            .sort((a, b) => {
                const aLast = a.lastActivityAt ?? 0;
                const bLast = b.lastActivityAt ?? 0;
                if (aLast !== bLast) return bLast - aLast;
                return b.queryCount - a.queryCount;
            });

        return rows;
    } catch (error) {
        if (activateAnalyticsDbBackoff("logged-in user stats", error)) {
            return [];
        }
        console.error("Failed to query logged-in user stats:", error);
        return [];
    }
}

const getCachedLoggedInUserStats = unstable_cache(
    async (): Promise<LoggedInUserData[]> => getLoggedInUserStatsUncached(),
    ["admin-logged-in-users-v2"],
    { revalidate: DEFAULT_ADMIN_ANALYTICS_REVALIDATE_SECONDS, tags: ["admin-logged-in-users", "admin-analytics-details"] },
);

async function getLoggedInUserStatsPage(limit: number, cursor?: string | null): Promise<{
    rows: LoggedInUserData[];
    nextCursor: string | null;
    total: number;
}> {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const offset = parseOffsetCursor(cursor);
    const allRows = await getCachedLoggedInUserStats();
    const rows = allRows.slice(offset, offset + safeLimit);
    return {
        rows,
        nextCursor: nextOffsetCursor(offset, rows.length, allRows.length),
        total: allRows.length,
    };
}

function dayKeyFromDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function getRecentDayKeys(days: number): string[] {
    const keys: string[] = [];
    for (let i = 0; i < days; i += 1) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        keys.push(dayKeyFromDate(date));
    }
    return keys;
}

function emptyReportFunnelMetrics(): ReportFunnelMetrics {
    const zeroTotals = Object.fromEntries(
        REPORT_CONVERSION_EVENTS.map((event) => [event, 0])
    ) as Record<ReportConversionEvent, number>;

    return {
        totals: { ...zeroTotals },
        weekly: { ...zeroTotals },
        weeklyConversionRate: 0,
        weeklyFalsePositiveRate: 0,
        weeklyExpiredLinkFailures: 0,
    };
}

async function getReportFunnelMetrics(): Promise<ReportFunnelMetrics> {
    try {
        const totalsPipeline = kv.pipeline();
        REPORT_CONVERSION_EVENTS.forEach((event) => {
            totalsPipeline.get(`stats:report:${event}`);
        });
        const totalValues = await totalsPipeline.exec() as Array<number | string | null>;

        const totals = emptyReportFunnelMetrics().totals;
        REPORT_CONVERSION_EVENTS.forEach((event, index) => {
            totals[event] = Number(totalValues[index] || 0);
        });

        const dayKeys = getRecentDayKeys(7);
        const weeklyPipeline = kv.pipeline();
        for (const event of REPORT_CONVERSION_EVENTS) {
            for (const dayKey of dayKeys) {
                weeklyPipeline.get(`stats:report:${event}:${dayKey}`);
            }
        }

        const weeklyValues = await weeklyPipeline.exec() as Array<number | string | null>;
        const weekly = emptyReportFunnelMetrics().weekly;

        let cursor = 0;
        for (const event of REPORT_CONVERSION_EVENTS) {
            let totalForEvent = 0;
            for (let i = 0; i < dayKeys.length; i += 1) {
                totalForEvent += Number(weeklyValues[cursor] || 0);
                cursor += 1;
            }
            weekly[event] = totalForEvent;
        }

        const views = weekly.report_viewed_shared;
        const fixStarts = weekly.report_fix_chat_started;
        const falsePositiveFlags = weekly.report_false_positive_flagged;
        const expiredFailures = weekly.report_shared_link_invalid + weekly.report_expired_viewed;

        return {
            totals,
            weekly,
            weeklyConversionRate: views > 0 ? (fixStarts / views) * 100 : 0,
            weeklyFalsePositiveRate: views > 0 ? (falsePositiveFlags / views) * 100 : 0,
            weeklyExpiredLinkFailures: expiredFailures,
        };
    } catch (error) {
        console.error("Failed to aggregate report funnel metrics:", error);
        return emptyReportFunnelMetrics();
    }
}

function isAdminActorUsername(actorUsername?: string | null): boolean {
    const configuredAdmin = process.env.ADMIN_GITHUB_USERNAME?.trim();
    if (!configuredAdmin || !actorUsername) {
        return false;
    }

    return actorUsername === configuredAdmin;
}

export async function trackReportConversionEvent(
    event: ReportConversionEvent,
    scanId?: string,
    options?: ReportConversionTrackingOptions,
): Promise<void> {
    if (isAdminActorUsername(options?.actorUsername)) {
        return;
    }

    try {
        const dayKey = dayKeyFromDate(new Date());
        const pipeline = kv.pipeline();
        pipeline.incr(`stats:report:${event}`);
        pipeline.incr(`stats:report:${event}:${dayKey}`);

        if (scanId) {
            pipeline.incr(`stats:report:scan:${scanId}:${event}`);
        }

        await pipeline.exec();
    } catch (error) {
        console.error("Failed to track report conversion event:", error);
    }
}

export async function resetReportConversionMetrics(): Promise<void> {
    try {
        const keys = await kv.keys("stats:report:*");
        if (keys.length === 0) {
            return;
        }

        const pipeline = kv.pipeline();
        keys.forEach((key) => {
            pipeline.del(key);
        });
        await pipeline.exec();
    } catch (error) {
        console.error("Failed to reset report conversion metrics:", error);
        throw error;
    }
}

/**
 * Fetch aggregated analytics data for the dashboard
 */

async function getManualAnalyticsAdjustments(): Promise<{ visitors: number; queries: number }> {
    try {
        const [visitorsAdjustment, queriesAdjustment] = await Promise.all([
            kv.get<number>("stats:adjustment:visitors"),
            kv.get<number>("stats:adjustment:queries"),
        ]);

        return {
            visitors: Number(visitorsAdjustment || 0),
            queries: Number(queriesAdjustment || 0),
        };
    } catch (error) {
        console.error("Failed to fetch manual analytics adjustments:", error);
        return { visitors: 0, queries: 0 };
    }
}

async function getGeoDeviceStatsFromHashes(): Promise<{
    countryStats: Record<string, number>;
    deviceStats: Record<string, number>;
}> {
    try {
        const [countryHash, deviceHash] = await Promise.all([
            kv.hgetall<Record<string, number | string>>("stats:country"),
            kv.hgetall<Record<string, number | string>>("stats:device"),
        ]);

        const countryStats: Record<string, number> = {};
        const deviceStats: Record<string, number> = {
            mobile: 0,
            desktop: 0,
            unknown: 0,
        };

        if (countryHash && typeof countryHash === "object") {
            Object.entries(countryHash).forEach(([country, value]) => {
                countryStats[country] = Number(value || 0);
            });
        }

        if (deviceHash && typeof deviceHash === "object") {
            Object.entries(deviceHash).forEach(([device, value]) => {
                deviceStats[device] = Number(value || 0);
            });
        }

        return { countryStats, deviceStats };
    } catch (error) {
        console.error("Failed to fetch country/device hash stats:", error);
        return {
            countryStats: {},
            deviceStats: { mobile: 0, desktop: 0, unknown: 0 },
        };
    }
}

async function getRecentVisitorsPage(
    limit: number,
    cursor?: string | null,
    loggedInUserLookup?: Map<string, LoggedInUserData>
): Promise<{ rows: VisitorData[]; nextCursor: string | null }> {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const offset = parseOffsetCursor(cursor);
    const stop = offset + safeLimit - 1;

    const getLegacyRecentVisitorsPage = async (): Promise<{ rows: VisitorData[]; nextCursor: string | null }> => {
        try {
            const visitorIdsRaw = await kv.smembers(LEGACY_VISITORS_SET_KEY);
            if (!Array.isArray(visitorIdsRaw) || visitorIdsRaw.length === 0) {
                return { rows: [], nextCursor: null };
            }

            const visitorIds = visitorIdsRaw.filter((id): id is string => typeof id === "string" && id.length > 0);
            if (visitorIds.length === 0) {
                return { rows: [], nextCursor: null };
            }

            const pipeline = kv.pipeline();
            visitorIds.forEach((id) => pipeline.hgetall(`visitor:${id}`));
            const visitorHashes = await pipeline.exec() as Array<Record<string, string | number> | null>;

            const legacyRows = visitorIds
                .map((id, index): VisitorData | null => {
                    const hash = visitorHashes[index] ?? {};
                    const lastSeen = numberOrZero(hash.lastSeen);
                    if (!Number.isFinite(lastSeen) || lastSeen <= 0) {
                        return null;
                    }

                    const firstSeenCandidate = numberOrZero(hash.firstSeen);
                    const firstSeen = firstSeenCandidate > 0 ? firstSeenCandidate : lastSeen;

                    return {
                        id,
                        actorKey: actorMemberFromAnonId(id),
                        actorType: "anonymous",
                        userId: null,
                        anonId: id,
                        githubLogin: null,
                        email: null,
                        country: typeof hash.country === "string" ? hash.country : "Unknown",
                        device: typeof hash.device === "string" ? hash.device : "unknown",
                        lastSeen,
                        firstSeen,
                        queryCount: numberOrZero(hash.queryCount ?? 0),
                    };
                })
                .filter((row): row is VisitorData => row !== null)
                .sort((a, b) => b.lastSeen - a.lastSeen);

            if (legacyRows.length === 0) {
                return { rows: [], nextCursor: null };
            }

            const rows = legacyRows.slice(offset, offset + safeLimit);
            return {
                rows,
                nextCursor: nextOffsetCursor(offset, rows.length, legacyRows.length),
            };
        } catch (error) {
            console.error("Failed to fetch recent visitors via legacy visitor hashes:", error);
            return { rows: [], nextCursor: null };
        }
    };

    try {
        const range = await kv.exec(["ZREVRANGE", ACTOR_LAST_SEEN_KEY, offset, stop, "WITHSCORES"]) as string[] | null;
        if (!Array.isArray(range) || range.length === 0) {
            return getLegacyRecentVisitorsPage();
        }

        const actorMembers: string[] = [];
        const scores = new Map<string, number>();
        for (let i = 0; i < range.length; i += 2) {
            const member = range[i];
            const score = Number(range[i + 1]);
            if (typeof member !== "string" || !Number.isFinite(score)) continue;
            actorMembers.push(member);
            scores.set(member, score);
        }

        if (actorMembers.length === 0) {
            return getLegacyRecentVisitorsPage();
        }

        const pipeline = kv.pipeline();
        actorMembers.forEach((member) => pipeline.hgetall(actorHashKey(member)));
        const actorHashes = await pipeline.exec() as Array<Record<string, string | number> | null>;

        const rows: VisitorData[] = actorMembers.map((member, index) => {
            const hash = actorHashes[index] ?? {};
            const isUser = member.startsWith("user:");
            const actorType: VisitorData["actorType"] = isUser ? "authenticated" : "anonymous";
            const actorId = isUser ? member.slice("user:".length) : member.slice("anon:".length);
            const linkedAccount = isUser ? loggedInUserLookup?.get(actorId) : undefined;
            const fallbackLastSeen = scores.get(member) ?? 0;
            const parsedLastSeen = numberOrZero(hash.lastSeen ?? fallbackLastSeen);
            const lastSeen = Number.isFinite(parsedLastSeen) ? parsedLastSeen : fallbackLastSeen;
            const parsedFirstSeen = numberOrZero(hash.firstSeen ?? lastSeen);

            return {
                id: actorId,
                actorKey: member,
                actorType,
                userId: isUser ? actorId : null,
                anonId: isUser ? null : actorId,
                githubLogin: linkedAccount?.githubLogin ?? (typeof hash.githubLogin === "string" ? hash.githubLogin : null),
                email: linkedAccount?.email ?? (typeof hash.email === "string" ? hash.email : null),
                country: typeof hash.country === "string" ? hash.country : "Unknown",
                device: typeof hash.device === "string" ? hash.device : "unknown",
                lastSeen,
                firstSeen: Number.isFinite(parsedFirstSeen) ? parsedFirstSeen : lastSeen,
                queryCount: numberOrZero(hash.queryCount ?? 0),
            };
        });

        return {
            rows,
            nextCursor: actorMembers.length < safeLimit
                ? null
                : nextOffsetCursor(offset, actorMembers.length),
        };
    } catch (error) {
        console.error("Failed to fetch recent visitors via recency index:", error);
        return { rows: [], nextCursor: null };
    }
}

async function getActiveUsers24hFromRecencyIndex(): Promise<number> {
    try {
        const now = Date.now();
        const active24hRaw = await kv.exec(["ZCOUNT", ACTOR_LAST_SEEN_KEY, now - (24 * 60 * 60 * 1000), "+inf"]);
        return numberOrZero(active24hRaw);
    } catch (error) {
        console.error("Failed to compute 24h activity count from recency index:", error);
        return 0;
    }
}

function toRetentionResult(returningUsers30d: number, activeUsers30d: number): { returningUsers30d: number; retentionRate30d: number } {
    return {
        returningUsers30d,
        retentionRate30d: activeUsers30d > 0
            ? Number(((returningUsers30d / activeUsers30d) * 100).toFixed(1))
            : 0,
    };
}

function hasAtLeastTwoDistinctDaysInWindow(firstSeen: number, lastSeen: number, windowStart: number): boolean {
    if (lastSeen < windowStart) {
        return false;
    }
    const boundedFirst = Math.max(firstSeen, windowStart);
    return dayKeyFromDate(new Date(boundedFirst)) !== dayKeyFromDate(new Date(lastSeen));
}

async function getRetentionMetrics30dFallback(windowStart: number): Promise<{ returningUsers30d: number; retentionRate30d: number }> {
    try {
        const range = await kv.exec(["ZRANGEBYSCORE", ACTOR_LAST_SEEN_KEY, windowStart, "+inf", "WITHSCORES"]) as string[] | null;
        if (!Array.isArray(range) || range.length === 0) {
            return toRetentionResult(0, 0);
        }

        const actorMembers: string[] = [];
        const lastSeenByActor = new Map<string, number>();
        for (let i = 0; i < range.length; i += 2) {
            const member = range[i];
            const score = Number(range[i + 1]);
            if (typeof member !== "string" || !Number.isFinite(score)) continue;
            actorMembers.push(member);
            lastSeenByActor.set(member, score);
        }

        if (actorMembers.length === 0) {
            return toRetentionResult(0, 0);
        }

        const pipeline = kv.pipeline();
        actorMembers.forEach((member) => pipeline.hgetall(actorHashKey(member)));
        const actorHashes = await pipeline.exec() as Array<Record<string, string | number> | null>;

        let returningUsers30d = 0;
        for (let i = 0; i < actorMembers.length; i += 1) {
            const member = actorMembers[i];
            const hash = actorHashes[i] ?? {};
            const fallbackLastSeen = lastSeenByActor.get(member) ?? 0;
            const lastSeen = numberOrZero(hash.lastSeen ?? fallbackLastSeen);
            const firstSeen = numberOrZero(hash.firstSeen ?? lastSeen);
            const queryCount = numberOrZero(hash.queryCount ?? 0);

            const appearsOnMultipleDays = hasAtLeastTwoDistinctDaysInWindow(firstSeen, lastSeen, windowStart);
            // During rollout warmup, day-level sets may be incomplete. queryCount>=2 is a conservative repeat-usage fallback.
            if (appearsOnMultipleDays || queryCount >= 2) {
                returningUsers30d += 1;
            }
        }

        return toRetentionResult(returningUsers30d, actorMembers.length);
    } catch (error) {
        console.error("Failed to compute fallback 30d retention metrics:", error);
        return toRetentionResult(0, 0);
    }
}

async function getLegacyRetentionMetrics30d(windowStart: number): Promise<{ returningUsers30d: number; retentionRate30d: number }> {
    try {
        const legacyVisitorIds = await kv.smembers(LEGACY_VISITORS_SET_KEY);
        if (!Array.isArray(legacyVisitorIds) || legacyVisitorIds.length === 0) {
            return toRetentionResult(0, 0);
        }

        const validVisitorIds = legacyVisitorIds
            .filter((id): id is string => typeof id === "string" && id.length > 0);
        if (validVisitorIds.length === 0) {
            return toRetentionResult(0, 0);
        }

        const pipeline = kv.pipeline();
        validVisitorIds.forEach((id) => pipeline.hgetall(`visitor:${id}`));
        const visitorHashes = await pipeline.exec() as Array<Record<string, string | number> | null>;

        let activeUsers30d = 0;
        let returningUsers30d = 0;

        for (let i = 0; i < validVisitorIds.length; i += 1) {
            const hash = visitorHashes[i] ?? {};
            const lastSeen = numberOrZero(hash.lastSeen);
            if (lastSeen < windowStart) {
                continue;
            }

            activeUsers30d += 1;
            const firstSeen = numberOrZero(hash.firstSeen ?? lastSeen);
            const queryCount = numberOrZero(hash.queryCount ?? 0);

            const appearsOnMultipleDays = hasAtLeastTwoDistinctDaysInWindow(firstSeen, lastSeen, windowStart);
            if (appearsOnMultipleDays || queryCount >= 2) {
                returningUsers30d += 1;
            }
        }

        return toRetentionResult(returningUsers30d, activeUsers30d);
    } catch (error) {
        console.error("Failed to compute legacy 30d retention metrics:", error);
        return toRetentionResult(0, 0);
    }
}

async function getRetentionMetrics30d(): Promise<{ returningUsers30d: number; retentionRate30d: number }> {
    try {
        const now = Date.now();
        const windowStart = now - (30 * 24 * 60 * 60 * 1000);
        const dayKeys = getRecentDayKeys(30);
        const pipeline = kv.pipeline();
        dayKeys.forEach((day) => pipeline.smembers(activeDayKey(day)));
        const dayMembers = await pipeline.exec() as Array<string[] | null>;

        const activityDaysByActor = new Map<string, number>();
        for (const members of dayMembers) {
            if (!Array.isArray(members)) continue;
            for (const member of members) {
                activityDaysByActor.set(member, (activityDaysByActor.get(member) ?? 0) + 1);
            }
        }

        const activeUsers30d = activityDaysByActor.size;
        let returningUsers30d = 0;
        activityDaysByActor.forEach((days) => {
            if (days >= 2) {
                returningUsers30d += 1;
            }
        });

        let best = toRetentionResult(returningUsers30d, activeUsers30d);

        const fallback = await getRetentionMetrics30dFallback(windowStart);
        if (
            fallback.returningUsers30d > best.returningUsers30d ||
            (fallback.returningUsers30d === best.returningUsers30d && fallback.retentionRate30d > best.retentionRate30d)
        ) {
            best = fallback;
        }

        const legacyFallback = await getLegacyRetentionMetrics30d(windowStart);
        if (
            legacyFallback.returningUsers30d > best.returningUsers30d ||
            (legacyFallback.returningUsers30d === best.returningUsers30d && legacyFallback.retentionRate30d > best.retentionRate30d)
        ) {
            best = legacyFallback;
        }

        return best;
    } catch (error) {
        console.error("Failed to compute 30d retention metrics:", error);
        return { returningUsers30d: 0, retentionRate30d: 0 };
    }
}

function getDayKeyFromTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString().slice(0, 10);
}

async function getSelectionPerformance(window: SelectionPerformanceWindow): Promise<SelectionPerformanceMetrics> {
    try {
        const now = Date.now();
        const dayKeys = new Set<string>();

        if (window === "24h") {
            dayKeys.add(getDayKeyFromTimestamp(now));
            dayKeys.add(getDayKeyFromTimestamp(now - 24 * 60 * 60 * 1000));
        } else {
            for (let i = 0; i < 7; i += 1) {
                dayKeys.add(getDayKeyFromTimestamp(now - i * 24 * 60 * 60 * 1000));
            }
        }

        const keys = Array.from(dayKeys);
        const pipeline = kv.pipeline();
        keys.forEach((dayKey) => {
            const baseKey = `stats:selection:${dayKey}`;
            pipeline.get(`${baseKey}:ms_total`);
            pipeline.get(`${baseKey}:index_hit`);
            pipeline.get(`${baseKey}:llm_fallback`);
        });
        const values = await pipeline.exec() as Array<number | string | null>;

        let selections = 0;
        let msTotal = 0;
        let indexHits = 0;
        let fallbacks = 0;

        for (let i = 0; i < values.length; i += 3) {
            msTotal += Number(values[i] || 0);
            indexHits += Number(values[i + 1] || 0);
            fallbacks += Number(values[i + 2] || 0);
        }
        selections = indexHits + fallbacks;

        const avgSelectionMs = selections > 0 ? Math.round(msTotal / selections) : 0;
        const indexHitRate = selections > 0 ? Number(((indexHits / selections) * 100).toFixed(1)) : 0;
        const fallbackRate = selections > 0 ? Number(((fallbacks / selections) * 100).toFixed(1)) : 0;

        return {
            avgSelectionMs,
            indexHitRate,
            fallbackRate,
            selections,
        };
    } catch (error) {
        console.error("Failed to fetch selection performance metrics:", error);
        return { avgSelectionMs: 0, indexHitRate: 0, fallbackRate: 0, selections: 0 };
    }
}

async function getAnalyticsSummaryUncached(): Promise<AnalyticsSummaryData> {
    try {
        const adminUsername = process.env.ADMIN_GITHUB_USERNAME?.trim();
        const [actorCountRaw, anonVisitorCountRaw, totalAnonQueriesRaw, manualAdjustments, kvInfo, geoDeviceStats] = await Promise.all([
            kv.exec(["ZCARD", ACTOR_LAST_SEEN_KEY]),
            kv.scard(LEGACY_VISITORS_SET_KEY),
            kv.get<number>("queries:total"),
            getManualAnalyticsAdjustments(),
            getKVStats(),
            getGeoDeviceStatsFromHashes(),
        ]);

        const totalActors = numberOrZero(actorCountRaw);
        const totalAnonVisitors = numberOrZero(anonVisitorCountRaw);
        const totalAnonQueries = numberOrZero(totalAnonQueriesRaw);
        let totalLoggedInUsers = 0;
        let authQueryTotal = 0;

        if (!isAnalyticsDbInBackoff()) {
            try {
                const authUserAgg = await prisma.user.aggregate({
                    where: adminUsername ? {
                        OR: [
                            { githubLogin: { not: adminUsername } },
                            { githubLogin: null },
                        ],
                    } : {},
                    _sum: { queryCount: true },
                    _count: { id: true },
                });
                totalLoggedInUsers = numberOrZero(authUserAgg._count.id);
                authQueryTotal = numberOrZero(authUserAgg._sum.queryCount);
            } catch (error) {
                if (!activateAnalyticsDbBackoff("summary aggregate", error)) {
                    console.error("Failed to fetch authenticated summary counters:", error);
                }
            }
        }

        const totalVisitors = totalActors > 0
            ? totalActors + manualAdjustments.visitors
            : totalAnonVisitors + manualAdjustments.visitors + totalLoggedInUsers;

        return {
            totalVisitors,
            totalQueries: totalAnonQueries + manualAdjustments.queries + authQueryTotal,
            totalLoggedInUsers,
            deviceStats: geoDeviceStats.deviceStats,
            countryStats: geoDeviceStats.countryStats,
            kvStats: {
                currentSize: kvInfo.currentSize,
                maxSize: kvInfo.maxSize,
            },
        };
    } catch (error) {
        console.error("Failed to fetch analytics summary:", error);
        return {
            totalVisitors: 0,
            totalQueries: 0,
            totalLoggedInUsers: 0,
            deviceStats: {},
            countryStats: {},
            kvStats: {
                currentSize: 0,
                maxSize: 256 * 1024 * 1024,
            },
        };
    }
}

export const getAnalyticsSummary = unstable_cache(
    async (): Promise<AnalyticsSummaryData> => getAnalyticsSummaryUncached(),
    ["admin-analytics-summary-v1"],
    { revalidate: DEFAULT_ADMIN_ANALYTICS_REVALIDATE_SECONDS, tags: ["admin-analytics-summary", "admin-analytics-snapshot"] },
);

export async function getAnalyticsDetails(options: AnalyticsDetailsOptions = {}): Promise<Partial<AnalyticsData>> {
    const {
        visitorLimit = DEFAULT_VISITOR_DETAIL_LIMIT,
        visitorCursor,
        loggedInLimit = DEFAULT_LOGGED_IN_DETAIL_LIMIT,
        loggedInCursor,
        includeSelection = true,
        includeFunnel = true,
        includeFalsePositiveReview = false,
        includeKvHistory = true,
    } = options;

    try {
        const safeVisitorLimit = Math.max(1, Math.min(100, Math.floor(visitorLimit)));
        const safeLoggedInLimit = Math.max(1, Math.min(200, Math.floor(loggedInLimit)));

        const [loggedInPage, selection24h, selection7d, reportFunnel, falsePositiveReview, activeUsers24h, retentionMetrics] = await Promise.all([
            getLoggedInUserStatsPage(safeLoggedInLimit, loggedInCursor).catch((error) => {
                console.error("Failed to fetch logged-in user analytics:", error);
                return { rows: [], nextCursor: null, total: 0 };
            }),
            includeSelection ? getSelectionPerformance("24h") : Promise.resolve(EMPTY_SELECTION_METRICS),
            includeSelection ? getSelectionPerformance("7d") : Promise.resolve(EMPTY_SELECTION_METRICS),
            includeFunnel ? getReportFunnelMetrics().catch((error) => {
                console.error("Failed to fetch report funnel analytics:", error);
                return emptyReportFunnelMetrics();
            }) : Promise.resolve(emptyReportFunnelMetrics()),
            includeFalsePositiveReview ? getCachedFalsePositiveReviewSummary() : Promise.resolve(EMPTY_FALSE_POSITIVE_REVIEW),
            getActiveUsers24hFromRecencyIndex(),
            getRetentionMetrics30d(),
        ]);

        const loggedInLookup = new Map<string, LoggedInUserData>(loggedInPage.rows.map((row) => [row.id, row]));
        const visitorsPage = await getRecentVisitorsPage(safeVisitorLimit, visitorCursor, loggedInLookup);

        let kvStats: AnalyticsData["kvStats"] | undefined;
        if (includeKvHistory) {
            const kvInfo = await getKVStats();
            const kvHistory = await recordKVUsageHistory(kvInfo.currentSize);
            kvStats = {
                currentSize: kvInfo.currentSize,
                maxSize: kvInfo.maxSize,
                history: kvHistory,
            };
        }

        return {
            activeNow: 0,
            activeUsers24h,
            returningUsers30d: retentionMetrics.returningUsers30d,
            retentionRate30d: retentionMetrics.retentionRate30d,
            recentVisitors: visitorsPage.rows,
            loggedInUsers: loggedInPage.rows,
            nextVisitorCursor: visitorsPage.nextCursor,
            nextLoggedInCursor: loggedInPage.nextCursor,
            searchPerformance: includeSelection ? {
                byWindow: {
                    "24h": selection24h,
                    "7d": selection7d,
                },
            } : undefined,
            reportFunnel: includeFunnel ? reportFunnel : undefined,
            falsePositiveReview: includeFalsePositiveReview ? falsePositiveReview : undefined,
            kvStats,
        };
    } catch (error) {
        console.error("Failed to fetch analytics details:", error);
        return {
            activeNow: 0,
            activeUsers24h: 0,
            returningUsers30d: 0,
            retentionRate30d: 0,
            recentVisitors: [],
            loggedInUsers: [],
            nextVisitorCursor: null,
            nextLoggedInCursor: null,
            searchPerformance: includeSelection ? {
                byWindow: {
                    "24h": EMPTY_SELECTION_METRICS,
                    "7d": EMPTY_SELECTION_METRICS,
                },
            } : undefined,
            reportFunnel: includeFunnel ? emptyReportFunnelMetrics() : undefined,
            falsePositiveReview: includeFalsePositiveReview ? EMPTY_FALSE_POSITIVE_REVIEW : undefined,
        };
    }
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
    try {
        const [summary, details] = await Promise.all([
            getAnalyticsSummaryUncached(),
            getAnalyticsDetails({
                visitorLimit: 500,
                loggedInLimit: 200,
                includeSelection: true,
                includeFunnel: true,
                includeFalsePositiveReview: true,
                includeKvHistory: true,
            }),
        ]);

        const kvHistory = details.kvStats?.history ?? [];

        return {
            totalVisitors: summary.totalVisitors,
            totalQueries: summary.totalQueries,
            totalLoggedInUsers: summary.totalLoggedInUsers,
            deviceStats: summary.deviceStats,
            countryStats: summary.countryStats,
            activeNow: details.activeNow ?? 0,
            activeUsers24h: details.activeUsers24h ?? 0,
            returningUsers30d: details.returningUsers30d ?? 0,
            retentionRate30d: details.retentionRate30d ?? 0,
            recentVisitors: details.recentVisitors ?? [],
            loggedInUsers: details.loggedInUsers ?? [],
            nextVisitorCursor: details.nextVisitorCursor ?? null,
            nextLoggedInCursor: details.nextLoggedInCursor ?? null,
            kvStats: {
                currentSize: summary.kvStats?.currentSize ?? 0,
                maxSize: summary.kvStats?.maxSize ?? 256 * 1024 * 1024,
                history: kvHistory,
            },
            searchPerformance: details.searchPerformance ?? {
                byWindow: {
                    "24h": EMPTY_SELECTION_METRICS,
                    "7d": EMPTY_SELECTION_METRICS,
                },
            },
            reportFunnel: details.reportFunnel ?? emptyReportFunnelMetrics(),
            falsePositiveReview: details.falsePositiveReview ?? EMPTY_FALSE_POSITIVE_REVIEW,
        };
    } catch (error) {
        console.error("Failed to fetch analytics data:", error);
        return {
            totalVisitors: 0,
            totalQueries: 0,
            activeNow: 0,
            activeUsers24h: 0,
            returningUsers30d: 0,
            retentionRate30d: 0,
            totalLoggedInUsers: 0,
            deviceStats: {},
            countryStats: {},
            recentVisitors: [],
            loggedInUsers: [],
            nextVisitorCursor: null,
            nextLoggedInCursor: null,
            searchPerformance: {
                byWindow: {
                    "24h": EMPTY_SELECTION_METRICS,
                    "7d": EMPTY_SELECTION_METRICS,
                },
            },
            reportFunnel: emptyReportFunnelMetrics(),
            falsePositiveReview: EMPTY_FALSE_POSITIVE_REVIEW,
            kvStats: {
                currentSize: 0,
                maxSize: 256 * 1024 * 1024,
                history: [],
            },
        };
    }
}

export const getAdminAnalyticsSnapshot = unstable_cache(
    async (): Promise<AnalyticsData> => {
        const [summary, details] = await Promise.all([
            getAnalyticsSummary(),
            getAnalyticsDetails({
                visitorLimit: DEFAULT_VISITOR_DETAIL_LIMIT,
                loggedInLimit: DEFAULT_LOGGED_IN_DETAIL_LIMIT,
                includeSelection: true,
                includeFunnel: true,
                includeFalsePositiveReview: false,
                includeKvHistory: true,
            }),
        ]);

        return {
            totalVisitors: summary.totalVisitors,
            totalQueries: summary.totalQueries,
            totalLoggedInUsers: summary.totalLoggedInUsers,
            deviceStats: summary.deviceStats,
            countryStats: summary.countryStats,
            activeNow: details.activeNow ?? 0,
            activeUsers24h: details.activeUsers24h ?? 0,
            returningUsers30d: details.returningUsers30d ?? 0,
            retentionRate30d: details.retentionRate30d ?? 0,
            recentVisitors: details.recentVisitors ?? [],
            loggedInUsers: details.loggedInUsers ?? [],
            nextVisitorCursor: details.nextVisitorCursor ?? null,
            nextLoggedInCursor: details.nextLoggedInCursor ?? null,
            kvStats: {
                currentSize: summary.kvStats?.currentSize ?? 0,
                maxSize: summary.kvStats?.maxSize ?? 256 * 1024 * 1024,
                history: details.kvStats?.history ?? [],
            },
            searchPerformance: details.searchPerformance ?? {
                byWindow: {
                    "24h": EMPTY_SELECTION_METRICS,
                    "7d": EMPTY_SELECTION_METRICS,
                },
            },
            reportFunnel: details.reportFunnel ?? emptyReportFunnelMetrics(),
            falsePositiveReview: details.falsePositiveReview ?? EMPTY_FALSE_POSITIVE_REVIEW,
        };
    },
    ["admin-analytics-snapshot-v1"],
    {
        revalidate: DEFAULT_ADMIN_ANALYTICS_REVALIDATE_SECONDS,
        tags: ["admin-analytics-snapshot", "admin-analytics-summary", "admin-analytics-details"],
    }
);

interface PublicStatsData {
    totalVisitors: number;
    totalQueries: number;
    totalScans: number;
}

interface ReadWithFallbackResult<T> {
    value: T;
    failed: boolean;
}

const PUBLIC_STATS_LAST_GOOD_KEY = "stats:public:last-good:v1";
const PUBLIC_STATS_LAST_GOOD_TTL_SECONDS = 24 * 60 * 60;
const PUBLIC_STATS_READ_RETRY_ATTEMPTS = 2;
const PUBLIC_STATS_READ_RETRY_DELAY_MS = 120;

let inMemoryLastKnownPublicStats: PublicStatsData | null = null;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readWithRetry<T>(label: string, reader: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= PUBLIC_STATS_READ_RETRY_ATTEMPTS; attempt += 1) {
        try {
            return await reader();
        } catch (error) {
            lastError = error;
            if (attempt < PUBLIC_STATS_READ_RETRY_ATTEMPTS) {
                await sleep(PUBLIC_STATS_READ_RETRY_DELAY_MS * attempt);
            }
        }
    }

    console.error(`[Analytics] ${label} failed after retries:`, lastError);
    throw lastError;
}

async function readWithFallback<T>(label: string, reader: () => Promise<T>, fallback: T): Promise<ReadWithFallbackResult<T>> {
    try {
        const value = await readWithRetry(label, reader);
        return { value, failed: false };
    } catch {
        return { value: fallback, failed: true };
    }
}

function hasAnyPublicStatsValue(stats: PublicStatsData): boolean {
    return stats.totalVisitors > 0 || stats.totalQueries > 0 || stats.totalScans > 0;
}

function isValidPublicStats(candidate: unknown): candidate is PublicStatsData {
    if (!candidate || typeof candidate !== "object") return false;

    const maybeStats = candidate as Record<string, unknown>;
    return (
        typeof maybeStats.totalVisitors === "number" &&
        Number.isFinite(maybeStats.totalVisitors) &&
        maybeStats.totalVisitors >= 0 &&
        typeof maybeStats.totalQueries === "number" &&
        Number.isFinite(maybeStats.totalQueries) &&
        maybeStats.totalQueries >= 0 &&
        typeof maybeStats.totalScans === "number" &&
        Number.isFinite(maybeStats.totalScans) &&
        maybeStats.totalScans >= 0
    );
}

async function persistLastKnownPublicStats(stats: PublicStatsData): Promise<void> {
    inMemoryLastKnownPublicStats = stats;

    try {
        await kv.set(PUBLIC_STATS_LAST_GOOD_KEY, { ...stats, updatedAt: Date.now() }, {
            ex: PUBLIC_STATS_LAST_GOOD_TTL_SECONDS,
        });
    } catch (error) {
        console.error("[Analytics] Failed to persist last-known public stats:", error);
    }
}

async function getLastKnownPublicStats(): Promise<PublicStatsData | null> {
    if (inMemoryLastKnownPublicStats) {
        return inMemoryLastKnownPublicStats;
    }

    try {
        const snapshot = await kv.get<unknown>(PUBLIC_STATS_LAST_GOOD_KEY);
        if (isValidPublicStats(snapshot)) {
            inMemoryLastKnownPublicStats = snapshot;
            return snapshot;
        }
    } catch (error) {
        console.error("[Analytics] Failed to load last-known public stats snapshot:", error);
    }

    return null;
}

/**
 * Fetch lightweight, aggregated stats for public viewing (e.g. landing page).
 * Cache for 5 minutes to speed up landing page requests while staying fresh.
 */
const getCachedPublicStats = unstable_cache(
    async () => {
        try {
            const adminUsername = process.env.ADMIN_GITHUB_USERNAME?.trim();

            const [anonVisitorCountRaw, totalAnonQueriesRaw, manualAdjustments, totalScans, loggedInUserCount, authQueryTotal] = await Promise.all([
                readWithFallback("kv.scard(visitors)", () => kv.scard("visitors"), 0),
                readWithFallback("kv.get(queries:total)", () => kv.get<number>("queries:total"), 0),
                readWithFallback("manual analytics adjustments", () => getManualAnalyticsAdjustments(), { visitors: 0, queries: 0 }),
                readWithFallback(
                    "prisma.repoScan.count(public stats)",
                    () => prisma.repoScan.count({
                        where: adminUsername ? {
                            OR: [
                                { userId: null },
                                { user: { githubLogin: { not: adminUsername } } },
                                { user: { githubLogin: null } }
                            ]
                        } : {}
                    }),
                    0
                ),
                readWithFallback(
                    "prisma.user.count(public stats)",
                    () => prisma.user.count({
                        where: adminUsername ? {
                            OR: [
                                { githubLogin: { not: adminUsername } },
                                { githubLogin: null }
                            ]
                        } : {}
                    }),
                    0
                ),
                readWithFallback(
                    "prisma.user.aggregate(public stats)",
                    async () => {
                        const aggregate = await prisma.user.aggregate({
                            where: adminUsername ? {
                                OR: [
                                    { githubLogin: { not: adminUsername } },
                                    { githubLogin: null }
                                ]
                            } : {},
                            _sum: { queryCount: true }
                        });

                        return Number(aggregate._sum.queryCount || 0);
                    },
                    0
                ),
            ]);

            const totalAnonVisitors = Number(anonVisitorCountRaw.value || 0);
            const totalAnonQueries = Number(totalAnonQueriesRaw.value || 0);

            const finalStats: PublicStatsData = {
                totalVisitors: totalAnonVisitors + manualAdjustments.value.visitors + loggedInUserCount.value,
                totalQueries: totalAnonQueries + manualAdjustments.value.queries + authQueryTotal.value,
                totalScans: totalScans.value,
            };

            const hadReadFailure = [
                anonVisitorCountRaw,
                totalAnonQueriesRaw,
                manualAdjustments,
                totalScans,
                loggedInUserCount,
                authQueryTotal,
            ].some((entry) => entry.failed);

            if (!hadReadFailure && hasAnyPublicStatsValue(finalStats)) {
                await persistLastKnownPublicStats(finalStats);
            } else if (hadReadFailure) {
                const fallbackStats = await getLastKnownPublicStats();
                if (fallbackStats) {
                    console.warn("[Analytics] Using last-known public stats after transient read failures.");
                    return fallbackStats;
                }
            }

            // Debug log for admin visibility (only in server console)
            console.log("[Analytics] Calculated public stats:", finalStats);

            return finalStats;
        } catch (error: unknown) {
            console.error("Failed to fetch public stats:", error);
            const fallbackStats = await getLastKnownPublicStats();
            if (fallbackStats) {
                console.warn("[Analytics] Returning last-known public stats after hard failure.");
                return fallbackStats;
            }

            return {
                totalVisitors: 0,
                totalQueries: 0,
                totalScans: 0,
            };
        }
    },
    ["public-stats-v3"], // Bumped key to force refresh
    {
        revalidate: 300,
        tags: ["public-stats"],
    }
);

export async function getPublicStats() {
    return getCachedPublicStats();
}
