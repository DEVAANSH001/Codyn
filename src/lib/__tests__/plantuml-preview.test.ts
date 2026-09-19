import { describe, expect, it } from "vitest";
import { layoutPlantUmlGraph, parsePlantUmlPreview } from "@/lib/plantuml-preview";

describe("PlantUML local preview", () => {
    it("parses grouped system-design nodes and relationships", () => {
        const graph = parsePlantUmlPreview(`
@startuml
title Checkout system
actor "Customer" as user
package "Application" {
  component "API" as api
  database "Orders" as db
}
user --> api : HTTPS
api --> db : SQL
@enduml`);

        expect(graph.title).toBe("Checkout system");
        expect(graph.nodes).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: "user", kind: "actor" }),
            expect.objectContaining({ id: "api", group: "Application" }),
            expect.objectContaining({ id: "db", kind: "database" }),
        ]));
        expect(graph.edges).toHaveLength(2);
    });

    it("assigns stable preview positions without a server renderer", () => {
        const graph = parsePlantUmlPreview("@startuml\nactor User as user\ncomponent API as api\nuser --> api\n@enduml");
        const layout = layoutPlantUmlGraph(graph);
        expect(layout.positions.get("user")?.x).toBeLessThan(layout.positions.get("api")?.x ?? 0);
        expect(layout.width).toBeGreaterThanOrEqual(720);
    });
});
