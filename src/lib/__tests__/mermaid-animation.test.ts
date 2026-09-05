import { describe, expect, it } from "vitest";
import {
    capBeadCount,
    resolveRouteBeadCount,
    shouldAnimateDedicatedPreview,
    shouldEnableLoopingBeads,
    supportsRouteBeadAnimation,
} from "@/lib/mermaid-animation";

describe("mermaid-animation", () => {
    it("disables looping beads when reduced motion is preferred", () => {
        expect(shouldEnableLoopingBeads(true)).toBe(false);
        expect(shouldEnableLoopingBeads(false)).toBe(true);
    });

    it("caps bead count to a minimal production maximum", () => {
        expect(capBeadCount(0, 2)).toBe(0);
        expect(capBeadCount(1, 2)).toBe(1);
        expect(capBeadCount(8, 2)).toBe(2);
    });

    it("enables beads only for supported route-like diagrams", () => {
        expect(supportsRouteBeadAnimation("flowchart LR\nA-->B")).toBe(true);
        expect(supportsRouteBeadAnimation("sequenceDiagram\nA->>B: hi")).toBe(true);
        expect(supportsRouteBeadAnimation("stateDiagram-v2\n[*] --> A")).toBe(true);
        expect(supportsRouteBeadAnimation("mindmap\n  Root")).toBe(false);
        expect(supportsRouteBeadAnimation("classDiagram\nclass Repo")).toBe(false);
        expect(resolveRouteBeadCount("mindmap\n  Root", 10, 2)).toBe(0);
        expect(resolveRouteBeadCount("flowchart LR\nA-->B", 10, 2)).toBe(2);
    });

    it("disables dedicated preview re-animation for mindmap and xychart", () => {
        expect(shouldAnimateDedicatedPreview("mindmap\n  Root", false)).toBe(false);
        expect(shouldAnimateDedicatedPreview("xychart\n  bar [1,2,3]", false)).toBe(false);
        expect(shouldAnimateDedicatedPreview("flowchart LR\nA-->B", false)).toBe(true);
        expect(shouldAnimateDedicatedPreview("flowchart LR\nA-->B", true)).toBe(false);
    });
});
