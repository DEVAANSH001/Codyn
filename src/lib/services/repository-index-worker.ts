import { prisma } from "@/lib/db";
import { getSnapshot, isReadableFile, readRepoFile } from "@/lib/github-public";
import { prepareRepositoryArtifacts, saveRepositoryArtifacts, type RepositorySourceFile } from "@/lib/services/repository-analysis-artifacts";

const MAX_SOURCE_FILES_PER_JOB = 200;
const FETCH_CONCURRENCY = 4;

function isIndexableSource(path: string): boolean {
    return /\.(?:[cm]?[jt]sx?)$/i.test(path);
}

export function selectIndexableSourceFiles<T extends { path: string; type: "blob" | "tree"; mode: string; size?: number; sha: string }>(files: T[]): T[] {
    return files.filter((file) => isReadableFile(file)).filter((file) => isIndexableSource(file.path)).slice(0, MAX_SOURCE_FILES_PER_JOB);
}

async function claimNextJob() {
    const candidate = await prisma.repositoryAnalysisJob.findFirst({
        where: { status: "QUEUED" },
        orderBy: { createdAt: "asc" },
    });
    if (!candidate) return null;

    const claimed = await prisma.repositoryAnalysisJob.updateMany({
        where: { id: candidate.id, status: "QUEUED" },
        data: { status: "RUNNING", attempts: { increment: 1 }, claimedAt: new Date(), errorMessage: null },
    });
    if (claimed.count !== 1) return null;

    return prisma.repositoryAnalysisJob.findUniqueOrThrow({
        where: { id: candidate.id },
        include: { repositoryIndex: true },
    });
}

async function fetchSourceFiles(owner: string, repo: string, snapshot: Awaited<ReturnType<typeof getSnapshot>>): Promise<{ files: RepositorySourceFile[]; skipped: number; eligible: number }> {
    const candidates = selectIndexableSourceFiles(snapshot.files);
    const files: RepositorySourceFile[] = [];
    const eligible = snapshot.files.filter(isReadableFile).filter((file) => isIndexableSource(file.path)).length;
    let skipped = eligible - candidates.length;

    for (let start = 0; start < candidates.length; start += FETCH_CONCURRENCY) {
        const batch = await Promise.allSettled(candidates.slice(start, start + FETCH_CONCURRENCY).map(async (file) => ({
            path: file.path,
            sha: file.sha,
            size: file.size,
            content: await readRepoFile(owner, repo, file.path, snapshot),
        })));
        for (const result of batch) {
            if (result.status === "fulfilled") files.push(result.value);
            else skipped += 1;
        }
    }
    return { files, skipped, eligible };
}

export type RepositoryIndexWorkerResult =
    | { processed: false; reason: "empty" | "contended" }
    | { processed: true; jobId: string; status: "READY" | "FAILED" | "CANCELLED" };

/** Claims and processes at most one queued job. Invoke from a protected scheduler. */
export async function processNextRepositoryIndexJob(): Promise<RepositoryIndexWorkerResult> {
    const job = await claimNextJob();
    if (!job) return { processed: false, reason: "empty" };

    try {
        const { repositoryIndex: index } = job;
        await prisma.repositoryIndex.update({
            where: { id: index.id },
            data: { status: "INDEXING", startedAt: new Date(), errorMessage: null },
        });
        const snapshot = await getSnapshot(index.owner, index.repo);
        if (snapshot.revision !== index.revision) {
            const message = "The repository advanced before this revision could be indexed. Queue the latest revision instead.";
            await prisma.$transaction([
                prisma.repositoryAnalysisJob.update({ where: { id: job.id }, data: { status: "CANCELLED", errorMessage: message, completedAt: new Date() } }),
                prisma.repositoryIndex.update({ where: { id: index.id }, data: { status: "CANCELLED", errorMessage: message, completedAt: new Date() } }),
            ]);
            return { processed: true, jobId: job.id, status: "CANCELLED" };
        }

        const source = await fetchSourceFiles(index.owner, index.repo, snapshot);
        const artifacts = prepareRepositoryArtifacts(source.files);
        await saveRepositoryArtifacts(index.id, artifacts);
        await prisma.$transaction([
            prisma.repositoryAnalysisJob.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date() } }),
            prisma.repositoryIndex.update({
                where: { id: index.id },
                data: {
                    status: "READY",
                    totalFiles: source.eligible,
                    skippedFiles: source.skipped,
                    errorMessage: null,
                    completedAt: new Date(),
                },
            }),
        ]);
        return { processed: true, jobId: job.id, status: "READY" };
    } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 1000) : "Repository indexing failed.";
        await prisma.$transaction([
            prisma.repositoryAnalysisJob.update({ where: { id: job.id }, data: { status: "FAILED", errorMessage: message, completedAt: new Date() } }),
            prisma.repositoryIndex.update({ where: { id: job.repositoryIndexId }, data: { status: "FAILED", errorMessage: message, completedAt: new Date() } }),
        ]);
        console.error("Repository indexing job failed:", error);
        return { processed: true, jobId: job.id, status: "FAILED" };
    }
}
