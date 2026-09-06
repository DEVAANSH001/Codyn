-- CreateTable
CREATE TABLE "RepositoryIndexedFile" (
    "id" TEXT NOT NULL,
    "repositoryIndexId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sha" TEXT,
    "size" INTEGER,
    "language" TEXT,
    "parseStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "parseError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryIndexedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositorySymbol" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    "startLine" INTEGER NOT NULL,
    "startColumn" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,
    "endColumn" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositorySymbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositoryDependency" (
    "id" TEXT NOT NULL,
    "repositoryIndexId" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "targetPath" TEXT,
    "importSource" TEXT NOT NULL,
    "importedNames" JSONB NOT NULL,
    "isTypeOnly" BOOLEAN NOT NULL DEFAULT false,
    "line" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoryDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryIndexedFile_repositoryIndexId_path_key" ON "RepositoryIndexedFile"("repositoryIndexId", "path");
CREATE INDEX "RepositoryIndexedFile_repositoryIndexId_parseStatus_idx" ON "RepositoryIndexedFile"("repositoryIndexId", "parseStatus");
CREATE INDEX "RepositorySymbol_fileId_name_idx" ON "RepositorySymbol"("fileId", "name");
CREATE INDEX "RepositorySymbol_name_kind_idx" ON "RepositorySymbol"("name", "kind");
CREATE INDEX "RepositoryDependency_repositoryIndexId_sourcePath_idx" ON "RepositoryDependency"("repositoryIndexId", "sourcePath");
CREATE INDEX "RepositoryDependency_repositoryIndexId_targetPath_idx" ON "RepositoryDependency"("repositoryIndexId", "targetPath");

-- AddForeignKey
ALTER TABLE "RepositoryIndexedFile" ADD CONSTRAINT "RepositoryIndexedFile_repositoryIndexId_fkey" FOREIGN KEY ("repositoryIndexId") REFERENCES "RepositoryIndex"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RepositorySymbol" ADD CONSTRAINT "RepositorySymbol_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "RepositoryIndexedFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RepositoryDependency" ADD CONSTRAINT "RepositoryDependency_repositoryIndexId_fkey" FOREIGN KEY ("repositoryIndexId") REFERENCES "RepositoryIndex"("id") ON DELETE CASCADE ON UPDATE CASCADE;
