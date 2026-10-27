import { describe, expect, it } from "vitest";
import authConfig from "@/lib/auth.config";
import { INVALID_SESSION_ERROR_CODE } from "@/lib/session-guard";

describe("auth.config callbacks", () => {
    it("keeps plan details public while requiring sign-in for other dashboard pages", () => {
        const authorized = authConfig.callbacks?.authorized;
        expect(authorized).toBeTypeOf("function");

        const check = (path: string, loggedIn: boolean) => authorized?.({
            auth: loggedIn ? { user: { id: "user-1" } } : null,
            request: { nextUrl: new URL(`https://www.codyn.app${path}`) },
        } as never);

        expect(check("/dashboard/plans", false)).toBe(true);
        expect(check("/dashboard/plans/", false)).toBe(true);
        expect(check("/dashboard", false)).toBe(false);
        expect(check("/dashboard/settings", false)).toBe(false);
        expect(check("/dashboard", true)).toBe(true);
    });

    it("binds the GitHub callback to both its state and PKCE verifier", () => {
        const provider = authConfig.providers[0];
        expect(typeof provider === "function" ? provider() : provider).toMatchObject({
            options: {
                checks: ["pkce", "state"],
                authorization: { params: { scope: "read:user user:email repo" } },
            },
        });
    });

    it("uses token.sub as fallback id in jwt callback", async () => {
        const jwt = authConfig.callbacks?.jwt;
        expect(jwt).toBeTypeOf("function");

        const result = await jwt?.({
            token: { sub: "user_sub_id" },
            profile: undefined,
            account: undefined,
            user: undefined,
            trigger: "update",
            session: null,
            isNewUser: false,
        } as never);

        expect(result?.id).toBe("user_sub_id");
        expect(result?.error).toBeUndefined();
    });

    it("marks session as invalid when no user id can be resolved", async () => {
        const session = authConfig.callbacks?.session;
        expect(session).toBeTypeOf("function");

        const result = await session?.({
            session: {
                expires: "2099-01-01T00:00:00.000Z",
                user: {
                    name: "Test",
                    email: "test@example.com",
                    image: null,
                },
            },
            token: {},
            user: undefined,
            newSession: undefined,
            trigger: "update",
        } as never);

        const resultWithError = result as { error?: string } | undefined;
        expect(resultWithError?.error).toBe(INVALID_SESSION_ERROR_CODE);
    });
});
