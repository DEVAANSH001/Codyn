import { Suspense } from "react";
import type { Metadata } from "next";
import { createSeoMetadata } from "@/lib/seo";
import ChatPageClient from "./ChatPageClient";
import { auth } from "@/lib/auth";
import { getRecentSearches } from "@/lib/services/history-service";
import { getSessionUserId } from "@/lib/session-guard";
import { prisma } from "@/lib/db";

const CHAT_ROBOTS: NonNullable<Metadata["robots"]> = {
    index: false,
    follow: true,
    googleBot: {
        index: false,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
    },
};

const staticMetadata = createSeoMetadata({
    title: "Chat",
    description: "Paste a GitHub repository or developer profile to analyze it with Codyn.",
    canonical: "/chat",
    ogTitle: "Codyn chat",
    ogDescription: "Chat with GitHub repositories and developer profiles using Agentic CAG.",
});
staticMetadata.robots = CHAT_ROBOTS;

export const metadata: Metadata = staticMetadata;

export default async function ChatPage() {
    const session = await auth();
    const userId = getSessionUserId(session);
    const recentSearches = userId
        ? await getRecentSearches(userId).catch((error) => {
            console.error("Failed to load connected account history:", error);
            return [];
        })
        : [];
    const conversations = userId ? await prisma.chatConversation.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 30, select: { id: true, scope: true, owner: true, repo: true, username: true, updatedAt: true } }).catch(() => []) : [];

    return (
        <Suspense fallback={null}>
            <ChatPageClient recentSearches={recentSearches} conversations={conversations.map((item) => ({ id: item.id, label: item.scope === "repo" ? `${item.owner}/${item.repo}` : item.username ?? "Profile", query: item.scope === "repo" ? `${item.owner}/${item.repo}` : item.username ?? "", updatedAt: item.updatedAt.toISOString() }))} isSessionActive={Boolean(userId)} />
        </Suspense>
    );
}
