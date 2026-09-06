import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.resolve(process.cwd(), "src/components/ChatInput.tsx"), "utf8");

describe("ChatInput Enter submission", () => {
    it("submits Enter on every device while reserving Shift+Enter for a newline", () => {
        expect(source).toContain('e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing');
        expect(source).not.toContain("!e.shiftKey && !isMobile");
    });
});
