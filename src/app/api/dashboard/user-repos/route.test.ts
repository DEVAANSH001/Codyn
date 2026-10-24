import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
    authMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
    auth: authMock,
}));

import { GET } from "@/app/api/dashboard/user-repos/route";

describe("GET /api/dashboard/user-repos", () => {
    beforeEach(() => {
        authMock.mockReset();
        vi.unstubAllGlobals();
    });

    it("does not use the shared server token for a connected user without OAuth access", async () => {
        authMock.mockResolvedValue({ user: { id: "user_1" } });
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const response = await GET();

        expect(response.status).toBe(403);
        expect((await response.json()).code).toBe("GITHUB_RECONNECT_REQUIRED");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("only reports private access when GitHub granted the repo scope", async () => {
        authMock.mockResolvedValue({ user: { id: "user_1" }, accessToken: "user-token", oauthScope: "read:user user:email" });
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ full_name: "owner/public", private: false }]), {
            headers: { "x-oauth-scopes": "read:user, user:email" },
        }));
        vi.stubGlobal("fetch", fetchMock);

        const response = await GET();

        expect((await response.json()).hasPrivateAccess).toBe(false);
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/user/repos?"), expect.objectContaining({
            headers: expect.objectContaining({ Authorization: "Bearer user-token" }),
            cache: "no-store",
        }));
    });

    it("recognizes the granted private repo scope", async () => {
        authMock.mockResolvedValue({ user: { id: "user_1" }, accessToken: "user-token" });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", {
            headers: { "x-oauth-scopes": "read:user, repo" },
        })));

        const response = await GET();
        expect((await response.json()).hasPrivateAccess).toBe(true);
    });

    it("returns INVALID_SESSION when user exists without id", async () => {
        authMock.mockResolvedValue({
            user: { name: "User", email: "user@example.com" },
        });

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body).toEqual({
            error: "Unauthorized",
            code: "INVALID_SESSION",
        });
    });
});
