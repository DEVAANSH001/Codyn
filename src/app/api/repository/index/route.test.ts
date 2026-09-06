import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getSnapshotMock, getLatestStatusMock, indexingConfiguredMock, queueMock } = vi.hoisted(() => ({
    getSnapshotMock: vi.fn(),
    getLatestStatusMock: vi.fn(),
    indexingConfiguredMock: vi.fn(),
    queueMock: vi.fn(),
}));

vi.mock("@/lib/github-public", () => ({
    getSnapshot: getSnapshotMock,
    GitHubError: class GitHubError extends Error {
        constructor(public status: number, message: string) {
            super(message);
        }
    },
}));

vi.mock("@/lib/services/repository-analysis-jobs", () => ({
    getLatestRepositoryIndexStatus: getLatestStatusMock,
    isRepositoryIndexingConfigured: indexingConfiguredMock,
    queueRepositoryAnalysis: queueMock,
}));

import { GET, POST } from "@/app/api/repository/index/route";

function getRequest(repo: string) {
    return new NextRequest(`http://localhost/api/repository/index?repo=${repo}`);
}

function postRequest(body: object) {
    return new NextRequest("http://localhost/api/repository/index", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify(body),
    });
}

describe("/api/repository/index", () => {
    beforeEach(() => {
        indexingConfiguredMock.mockReset();
        getSnapshotMock.mockReset();
        getLatestStatusMock.mockReset();
        queueMock.mockReset();
        indexingConfiguredMock.mockReturnValue(true);
    });

    afterEach(() => vi.restoreAllMocks());

    it("requires persistent storage before queueing work", async () => {
        indexingConfiguredMock.mockReturnValue(false);

        const response = await POST(postRequest({ repo: "owner/repo" }));

        expect(response.status).toBe(503);
        expect(await response.json()).toEqual(expect.objectContaining({ error: expect.stringContaining("PostgreSQL") }));
        expect(getSnapshotMock).not.toHaveBeenCalled();
    });

    it("queues a single immutable repository revision", async () => {
        getSnapshotMock.mockResolvedValue({ revision: "abc123", files: [{ path: "src/index.ts" }] });
        queueMock.mockResolvedValue({ index: { id: "index-1", status: "QUEUED", revision: "abc123" }, queued: true });

        const response = await POST(postRequest({ repo: "Owner/Repo" }));

        expect(response.status).toBe(202);
        expect(queueMock).toHaveBeenCalledWith({
            owner: "Owner",
            repo: "Repo",
            revision: "abc123",
            treeSha: "abc123",
            totalFiles: 1,
        });
    });

    it("returns the most recently updated index for a repository", async () => {
        getLatestStatusMock.mockResolvedValue({ id: "index-1", status: "READY" });

        const response = await GET(getRequest("owner/repo"));

        expect(response.status).toBe(200);
        expect(getLatestStatusMock).toHaveBeenCalledWith("owner", "repo");
        expect(await response.json()).toEqual({ index: { id: "index-1", status: "READY" } });
    });
});
