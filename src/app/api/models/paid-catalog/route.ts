import { listNebiusModelCatalog } from "@/lib/nebius";

export async function GET() {
  try {
    const catalog = await listNebiusModelCatalog();
    const ids = [...new Set(catalog.filter((model) => model.status === "active" && model.type === "text2text").map((model) => model.id))];
    return Response.json(ids);
  } catch (error) {
    console.error("Paid model catalog unavailable:", error);
    return Response.json({ error: "Unable to load paid models" }, { status: 503 });
  }
}
