-- CreateEnum
CREATE TYPE "RepositoryIndexStatus" AS ENUM ('QUEUED', 'INDEXING', 'READY', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RepositoryAnalysisJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "RepositoryIndex" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "treeSha" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "RepositoryIndexStatus" NOT NULL DEFAULT 'QUEUED',
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "processedFiles" INTEGER NOT NULL DEFAULT 0,
    "skippedFiles" INTEGER NOT NULL DEFAULT 0,
    "failedFiles" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositoryAnalysisJob" (
    "id" TEXT NOT NULL,
    "repositoryIndexId" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "status" "RepositoryAnalysisJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "payload" JSONB,
    "errorMessage" TEXT,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryAnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryIndex_owner_repo_revision_key" ON "RepositoryIndex"("owner", "repo", "revision");
CREATE INDEX "RepositoryIndex_owner_repo_updatedAt_idx" ON "RepositoryIndex"("owner", "repo", "updatedAt" DESC);
CREATE INDEX "RepositoryIndex_status_updatedAt_idx" ON "RepositoryIndex"("status", "updatedAt");
CREATE INDEX "RepositoryAnalysisJob_status_createdAt_idx" ON "RepositoryAnalysisJob"("status", "createdAt");
CREATE INDEX "RepositoryAnalysisJob_repositoryIndexId_createdAt_idx" ON "RepositoryAnalysisJob"("repositoryIndexId", "createdAt" DESC);
CREATE INDEX "RepositoryAnalysisJob_requestedByUserId_createdAt_idx" ON "RepositoryAnalysisJob"("requestedByUserId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "RepositoryAnalysisJob" ADD CONSTRAINT "RepositoryAnalysisJob_repositoryIndexId_fkey" FOREIGN KEY ("repositoryIndexId") REFERENCES "RepositoryIndex"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RepositoryAnalysisJob" ADD CONSTRAINT "RepositoryAnalysisJob_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
