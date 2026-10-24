import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authMock, getRepoMock } = vi.hoisted(() => ({ authMock: vi.fn(), getRepoMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/github", () => ({ getRepo: getRepoMock, getErrorStatus: () => undefined }));

import { GET } from "@/app/api/github/file/route";

const request = (path = "src/index.ts") => new NextRequest(`http://localhost/api/github/file?repo=owner%2Frepo&path=${encodeURIComponent(path)}`);

describe("GET /api/github/file", () => {
    beforeEach(() => {
        authMock.mockReset();
        getRepoMock.mockReset();
        vi.unstubAllGlobals();
    });

    it("reads a private file with the connected user's token", async () => {
        authMock.mockResolvedValue({ user: { id: "user_1" }, accessToken: "user-token" });
        getRepoMock.mockResolvedValue({ private: true });
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
            type: "file", size: 5, content: "aGVsbG8=", encoding: "base64",
            html_url: "https://github.com/owner/repo/blob/main/src/index.ts",
            download_url: "https://raw.githubusercontent.com/owner/repo/main/src/index.ts",
        })));
        vi.stubGlobal("fetch", fetchMock);

        const response = await GET(request());
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.content).toBe("aGVsbG8=");
        expect(body.download_url).toBeNull();
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/contents/src/index.ts"), expect.objectContaining({
            headers: expect.objectContaining({ Authorization: "Bearer user-token" }),
            cache: "no-store",
        }));
    });

    it("rejects a private file without the user's OAuth token", async () => {
        authMock.mockResolvedValue(null);
        getRepoMock.mockResolvedValue({ private: true });
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const response = await GET(request());
        expect(response.status).toBe(403);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("rejects path traversal", async () => {
        const response = await GET(request("../secret"));
        expect(response.status).toBe(400);
        expect(authMock).not.toHaveBeenCalled();
    });
});
