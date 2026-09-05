import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCatalogDataMock, getUserReposMock, kvGetMock } = vi.hoisted(() => ({
    getCatalogDataMock: vi.fn(),
    getUserReposMock: vi.fn(),
    kvGetMock: vi.fn(),
}));

vi.mock("@/lib/repo-catalog", () => ({
    getCatalogData: getCatalogDataMock,
}));

vi.mock("@/lib/github", () => ({
    getUserRepos: getUserReposMock,
    octokit: {
        rest: {
            search: {
                repos: vi.fn(),
            },
        },
    },
}));

vi.mock("@vercel/kv", () => ({
    kv: {
        get: kvGetMock,
        set: vi.fn(),
    },
}));

import { getRepoSuggestions } from "@/lib/services/repo-suggestions";

describe("repo suggestions query gating", () => {
    beforeEach(() => {
        getCatalogDataMock.mockReset();
        getUserReposMock.mockReset();
        kvGetMock.mockReset();
    });

    it("returns no suggestions for query lengths below 3 and skips downstream reads", async () => {
        const shortResult = await getRepoSuggestions("ab");
        const spacedShortResult = await getRepoSuggestions(" a ");

        expect(shortResult).toEqual([]);
        expect(spacedShortResult).toEqual([]);
        expect(getCatalogDataMock).not.toHaveBeenCalled();
        expect(getUserReposMock).not.toHaveBeenCalled();
        expect(kvGetMock).not.toHaveBeenCalled();
    });
});
