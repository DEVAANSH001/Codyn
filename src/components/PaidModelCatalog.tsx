"use client";

import { useEffect, useState } from "react";
import { getNebiusModelDetails } from "@/lib/nebius-models";

export function PaidModelCatalog() {
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/models/paid-catalog")
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setModels(Array.isArray(data) ? data.filter((id): id is string => typeof id === "string") : []))
      .catch(() => {});
  }, []);

  if (!models.length) return null;
  return <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 md:p-8">
    <h2 className="text-lg font-semibold text-white">Paid text models</h2>
    <p className="mt-2 text-sm text-zinc-400">Explore the text models in our paid catalog. Each plan includes the models shown on its card.</p>
    <ul className="mt-5 flex flex-wrap gap-2">{models.map((id) => <li key={id} title={id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200">{getNebiusModelDetails(id).name}</li>)}</ul>
  </section>;
}
