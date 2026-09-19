"use client";

import { useSearchParams } from "next/navigation";
import { ProfileLoader } from "@/components/ProfileLoader";
import { RepoLoader } from "@/components/RepoLoader";
import { parseWorkspaceInput } from "@/lib/workspace-navigation";
import { WorkspaceStart } from "@/components/WorkspaceStart";
import type { SearchHistoryItem } from "@/lib/services/history-service";

export default function ChatPageClient({
    recentSearches = [],
    isSessionActive = false,
}: {
    recentSearches?: SearchHistoryItem[];
    isSessionActive?: boolean;
}) {
    const searchParams = useSearchParams();
    const rawQuery = searchParams.get("q") ?? "";
    const prompt = searchParams.get("prompt") ?? undefined;
    const query = parseWorkspaceInput(rawQuery);

    if (!query) {
        return <WorkspaceStart invalidQuery={Boolean(rawQuery)} recentSearches={recentSearches} isSessionActive={isSessionActive} />;
    }

    if (!query.includes("/")) {
        return <div className="codyn-product"><ProfileLoader key={query} username={query} /></div>;
    }

    return <div className="codyn-product"><RepoLoader key={query} query={query} initialPrompt={prompt} /></div>;
}
