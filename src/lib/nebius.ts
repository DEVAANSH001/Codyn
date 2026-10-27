const BASE_URL = "https://api.tokenfactory.nebius.com/v1";

export type NebiusCatalogModel = { id: string; status: string; type: string };

export async function listNebiusModelCatalog(): Promise<NebiusCatalogModel[]> {
  const response = await fetch("https://tokenfactory.nebius.com/api/public/models_info", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Premium model catalog returned ${response.status}`);
  const payload = await response.json() as { status?: string; type?: string; flavors?: { model_id?: unknown }[] }[];
  return payload.flatMap((item) => (item.flavors ?? []).flatMap((flavor) => typeof flavor.model_id === "string"
    ? [{ id: flavor.model_id, status: item.status ?? "unknown", type: item.type ?? "unknown" }]
    : [])).sort((a, b) => a.id.localeCompare(b.id));
}

export async function listNebiusModels(): Promise<string[]> {
  const catalog = await listNebiusModelCatalog();
  return catalog.filter((model) => model.status === "active" && model.type !== "embedding").map((model) => model.id);
}

export async function* answerWithNebius(prompt: string, modelId: string): AsyncGenerator<string> {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) throw new Error("NEBIUS_API_KEY is not configured.");
  const boundedPrompt = prompt.length > 120_000
    ? `${prompt.slice(0, 90_000)}\n[Some repository context was omitted to keep this request within its limit.]\n${prompt.slice(-30_000)}`
    : prompt;
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: boundedPrompt }], max_tokens: 2048, stream: true }),
  });
  if (!response.ok || !response.body) throw new Error(`Premium model request failed (${response.status}).`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
        try {
          const payload = JSON.parse(line.slice(6)) as { choices?: { delta?: { content?: string } }[] };
          const content = payload.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch { /* malformed event */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
