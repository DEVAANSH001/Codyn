import { auth } from "@/lib/auth";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentScans from "@/components/dashboard/RecentScans";
import { redirect } from "next/navigation";
import { buildInvalidSessionSignOutRedirect, getSessionAuthState, getSessionUserId } from "@/lib/session-guard";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
    const session = await auth();
    const authState = getSessionAuthState(session);

    if (authState === "unauthenticated") {
        redirect("/signin?callbackUrl=%2Fdashboard");
    }
    if (authState === "invalid") {
        redirect(buildInvalidSessionSignOutRedirect());
    }

    const userId = getSessionUserId(session);
    const user = session?.user;
    if (!userId) {
        redirect(buildInvalidSessionSignOutRedirect());
    }
    if (!user) {
        redirect("/");
    }

    const conversations = await prisma.chatConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { id: true, scope: true, owner: true, repo: true, username: true, updatedAt: true },
    }).catch(() => []);

    return (
        <div className="space-y-8">
            <WelcomeBanner user={user} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <RecentScans
                        userId={userId}
                        limit={5}
                        showViewAll
                        conversations={conversations.map((conversation) => ({
                            id: conversation.id,
                            label: conversation.scope === "repo" ? `${conversation.owner}/${conversation.repo}` : conversation.username ?? "Profile",
                            query: conversation.scope === "repo" ? `${conversation.owner}/${conversation.repo}` : conversation.username ?? "",
                            updatedAt: conversation.updatedAt.toISOString(),
                        }))}
                    />
                </div>
                <div className="space-y-8">
                    <QuickStats />
                </div>
            </div>
        </div>
    );
}
