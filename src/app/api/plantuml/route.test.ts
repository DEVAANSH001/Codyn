import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/plantuml", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.PLANTUML_SERVER_URL;
    });

    it("rejects remote include directives", async () => {
        const request = new NextRequest("http://localhost/api/plantuml", {
            method: "POST",
            body: JSON.stringify({ source: "@startuml\n!includeurl https://example.com/theme.puml\n@enduml" }),
        });
        const response = await POST(request);
        expect(response.status).toBe(400);
    });

    it("keeps rendering local unless an administrator configures a renderer", async () => {
        const request = new NextRequest("http://localhost/api/plantuml", {
            method: "POST",
            body: JSON.stringify({ source: "@startuml\nactor User\n@enduml" }),
        });
        const response = await POST(request);
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({
            error: "PlantUML preview is not configured. You can still copy or download the generated source.",
        });
    });

    it("proxies valid source to the explicitly configured renderer", async () => {
        process.env.PLANTUML_SERVER_URL = "http://plantuml.internal/svg";
        const fetchMock = vi.fn().mockResolvedValue(new Response("<svg><text>ok</text></svg>", { status: 200 }));
        vi.stubGlobal("fetch", fetchMock);
        const request = new NextRequest("http://localhost/api/plantuml", {
            method: "POST",
            body: JSON.stringify({ source: "@startuml\nactor User\n@enduml" }),
        });
        const response = await POST(request);
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("image/svg+xml");
        expect(fetchMock).toHaveBeenCalledWith("http://plantuml.internal/svg", expect.objectContaining({ method: "POST" }));
    });
});
