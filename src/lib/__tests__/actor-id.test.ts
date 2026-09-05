import { describe, expect, it } from "vitest";

import {
    getAnonymousActorId,
    getAnonymousCookieIdFromActorId,
    isValidAnonymousCookieId,
} from "@/lib/actor-id";

describe("actor-id helpers", () => {
    it("prefers valid anonymous cookie ids over header hashing", () => {
        const headers = new Headers({
            "x-forwarded-for": "203.0.113.10",
            "user-agent": "Mozilla/5.0",
        });

        expect(getAnonymousActorId(headers, "abcdef123456abcdef123456")).toBe("anon_abcdef123456abcdef123456");
    });

    it("falls back to deterministic hash when cookie id is missing", () => {
        const headers = new Headers({
            "x-forwarded-for": "203.0.113.10",
            "user-agent": "Mozilla/5.0",
        });
        const actorId = getAnonymousActorId(headers, null);
        expect(actorId).toMatch(/^anon_[a-f0-9]{24}$/);
    });

    it("validates and extracts cookie ids safely", () => {
        expect(isValidAnonymousCookieId("abcdef123456abcdef123456")).toBe(true);
        expect(isValidAnonymousCookieId("bad-value")).toBe(false);
        expect(getAnonymousCookieIdFromActorId("anon_abcdef123456abcdef123456")).toBe("abcdef123456abcdef123456");
        expect(getAnonymousCookieIdFromActorId("anon_bad")).toBeNull();
    });
});
