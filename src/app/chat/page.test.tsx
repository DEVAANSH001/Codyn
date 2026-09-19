import { describe, expect, it, vi } from "vitest";

vi.mock("./ChatPageClient", () => ({
    default: () => null,
}));

vi.mock("@/lib/auth", () => ({
    auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/services/history-service", () => ({
    getRecentSearches: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/session-guard", () => ({
    getSessionUserId: vi.fn().mockReturnValue(undefined),
}));

import { metadata } from "./page";

describe("chat metadata", () => {
    it("uses a generic, noindex chat preview card", () => {
        expect(metadata.title).toBe("Chat");
        expect(metadata.description).toContain("Paste a GitHub repository or developer profile");
        expect(metadata.robots?.index).toBe(false);
        expect(metadata.robots?.follow).toBe(true);
        expect(metadata.openGraph?.images?.[0]?.url).toBe("/og/homepage.png");
        expect(metadata.twitter?.images?.[0]).toBe("/og/homepage.png");
    });
});
