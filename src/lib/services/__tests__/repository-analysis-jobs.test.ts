import { describe, expect, it } from "vitest";
import { selectRepositoryQueueAction } from "@/lib/services/repository-analysis-jobs";

describe("selectRepositoryQueueAction", () => {
    it("reuses a completed immutable revision instead of scheduling duplicate work", () => {
        expect(selectRepositoryQueueAction("READY", false)).toBe("REUSE_READY");
    });

    it("uses an existing active job and only queues failed or cancelled revisions again", () => {
        expect(selectRepositoryQueueAction("INDEXING", true)).toBe("REUSE_ACTIVE");
        expect(selectRepositoryQueueAction("FAILED", false)).toBe("QUEUE");
        expect(selectRepositoryQueueAction("CANCELLED", false)).toBe("QUEUE");
    });
});
