"use client";

import { useSearchParams } from "next/navigation";
import { ProfileLoader } from "@/components/ProfileLoader";
import { RepoLoader } from "@/components/RepoLoader";
import { parseWorkspaceInput } from "@/lib/workspace-navigation";
import { WorkspaceStart } from "@/components/WorkspaceStart";

export default function ChatPageClient() {
    const searchParams = useSearchParams();
    const rawQuery = searchParams.get("q") ?? "";
    const prompt = searchParams.get("prompt") ?? undefined;
    const query = parseWorkspaceInput(rawQuery);

    if (!query) {
        return <WorkspaceStart invalidQuery={Boolean(rawQuery)} />;
    }

    if (!query.includes("/")) {
        return <div className="codyn-product"><ProfileLoader key={query} username={query} /></div>;
    }

    return <div className="codyn-product"><RepoLoader key={query} query={query} initialPrompt={prompt} /></div>;
}
