import { describe, expect, it, vi } from "vitest";

const { listCatalog } = vi.hoisted(() => ({ listCatalog: vi.fn() }));
vi.mock("@/lib/nebius", () => ({ listNebiusModelCatalog: listCatalog }));

import { GET } from "./route";

describe("paid model catalog", () => {
  it("lists only active text models", async () => {
    listCatalog.mockResolvedValue([
      { id: "text-1", status: "active", type: "text2text" },
      { id: "text-1", status: "active", type: "text2text" },
      { id: "vision-1", status: "active", type: "image2text" },
      { id: "text-2", status: "inactive", type: "text2text" },
    ]);
    expect(await (await GET()).json()).toEqual(["text-1"]);
  });
});
