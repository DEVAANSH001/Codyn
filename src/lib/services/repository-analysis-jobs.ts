import { prisma } from "@/lib/db";

const ACTIVE_JOB_STATUSES = ["QUEUED", "RUNNING"] as const;

export type RepositoryAnalysisQueueRequest = {
    owner: string;
    repo: string;
    revision: string;
    treeSha: string;
    totalFiles: number;
    requestedByUserId?: string;
};

export type RepositoryAnalysisJobView = {
    id: string;
    status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
    attempts: number;
    maxAttempts: number;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
};

export type RepositoryIndexStatusView = {
    id: string;
    owner: string;
    repo: string;
    revision: string;
    treeSha: string;
    schemaVersion: number;
    status: "QUEUED" | "INDEXING" | "READY" | "FAILED" | "CANCELLED";
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    errorMessage: string | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    latestJob: RepositoryAnalysisJobView | null;
};

export type RepositoryQueueAction = "QUEUE" | "REUSE_ACTIVE" | "REUSE_READY";

/** Keeps an immutable revision index reusable once its facts are complete. */
export function selectRepositoryQueueAction(indexStatus: string, hasActiveJob: boolean): RepositoryQueueAction {
    if (hasActiveJob) return "REUSE_ACTIVE";
    if (indexStatus === "READY") return "REUSE_READY";
    return "QUEUE";
}

export function isRepositoryIndexingConfigured(): boolean {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    return Boolean(databaseUrl && !databaseUrl.startsWith("postgresql://placeholder"));
}

function asJobView(job: {
    id: string;
    status: string;
    attempts: number;
    maxAttempts: number;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
}): RepositoryAnalysisJobView {
    return {
        id: job.id,
        status: job.status as RepositoryAnalysisJobView["status"],
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
    };
}

function asIndexStatusView(record: {
    id: string;
    owner: string;
    repo: string;
    revision: string;
    treeSha: string;
    schemaVersion: number;
    status: string;
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    errorMessage: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    jobs: Array<{
        id: string;
        status: string;
        attempts: number;
        maxAttempts: number;
        errorMessage: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}): RepositoryIndexStatusView {
    return {
        id: record.id,
        owner: record.owner,
        repo: record.repo,
        revision: record.revision,
        treeSha: record.treeSha,
        schemaVersion: record.schemaVersion,
        status: record.status as RepositoryIndexStatusView["status"],
        totalFiles: record.totalFiles,
        processedFiles: record.processedFiles,
        skippedFiles: record.skippedFiles,
        failedFiles: record.failedFiles,
        errorMessage: record.errorMessage,
        startedAt: record.startedAt?.toISOString() ?? null,
        completedAt: record.completedAt?.toISOString() ?? null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        latestJob: record.jobs[0] ? asJobView(record.jobs[0]) : null,
    };
}

/**
 * Enqueues analysis for a single immutable Git revision. This persists intent only;
 * a worker will claim the job in the AST extraction milestone.
 */
export async function queueRepositoryAnalysis(
    request: RepositoryAnalysisQueueRequest,
): Promise<{ index: RepositoryIndexStatusView; queued: boolean; reused: boolean }> {
    const owner = request.owner.toLowerCase();
    const repo = request.repo.toLowerCase();

    return prisma.$transaction(async (tx) => {
        const index = await tx.repositoryIndex.upsert({
            where: { owner_repo_revision: { owner, repo, revision: request.revision } },
            create: {
                owner,
                repo,
                revision: request.revision,
                treeSha: request.treeSha,
                totalFiles: request.totalFiles,
            },
            update: {
                treeSha: request.treeSha,
                totalFiles: request.totalFiles,
            },
        });

        const activeJob = await tx.repositoryAnalysisJob.findFirst({
            where: { repositoryIndexId: index.id, status: { in: [...ACTIVE_JOB_STATUSES] } },
            orderBy: { createdAt: "desc" },
        });

        const action = selectRepositoryQueueAction(index.status, Boolean(activeJob));
        if (action === "QUEUE") {
            await tx.repositoryAnalysisJob.create({
                data: {
                    repositoryIndexId: index.id,
                    requestedByUserId: request.requestedByUserId ?? null,
                    payload: { owner, repo, revision: request.revision, treeSha: request.treeSha },
                },
            });
            if (index.status !== "QUEUED") {
                await tx.repositoryIndex.update({
                    where: { id: index.id },
                    data: { status: "QUEUED", errorMessage: null, startedAt: null, completedAt: null, processedFiles: 0, skippedFiles: 0, failedFiles: 0 },
                });
            }
        }

        const result = await tx.repositoryIndex.findUniqueOrThrow({
            where: { id: index.id },
            include: { jobs: { orderBy: { createdAt: "desc" }, take: 1 } },
        });

        return { index: asIndexStatusView(result), queued: action === "QUEUE", reused: action === "REUSE_READY" };
    });
}

export async function getLatestRepositoryIndexStatus(
    owner: string,
    repo: string,
): Promise<RepositoryIndexStatusView | null> {
    const record = await prisma.repositoryIndex.findFirst({
        where: { owner: owner.toLowerCase(), repo: repo.toLowerCase() },
        orderBy: { updatedAt: "desc" },
        include: { jobs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    return record ? asIndexStatusView(record) : null;
}
