import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExternalLink, Github, Mail, Settings, ShieldCheck, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_ADMIN_GITHUB_USERNAME } from "@/lib/admin-auth";
import { buildInvalidSessionSignOutRedirect, getSessionAuthState } from "@/lib/session-guard";

export default async function SettingsPage() {
    const session = await auth();
    const authState = getSessionAuthState(session);

    if (authState === "unauthenticated") redirect("/signin?callbackUrl=%2Fdashboard%2Fsettings");
    if (authState === "invalid") redirect(buildInvalidSessionSignOutRedirect());

    const user = session?.user;
    if (!user) redirect("/signin?callbackUrl=%2Fdashboard%2Fsettings");

    const username = user.username || "GitHub user";
    const isAdmin = username.toLowerCase() === DEFAULT_ADMIN_GITHUB_USERNAME.toLowerCase();

    return (
        <div className="space-y-8 pb-10">
            <header className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                    <Settings className="h-5 w-5 text-cyan-300" />
                </span>
                <div>
                    <h1 className="text-3xl font-bold">Account settings</h1>
                    <p className="mt-1 text-sm text-zinc-500">Review your connected account and Codyn access.</p>
                </div>
            </header>

            <section className="codyn-panel flex flex-col gap-6 rounded-3xl border border-white/10 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-cyan-500/25 bg-zinc-900">
                    {user.image ? (
                        <Image src={user.image} alt={user.name || username} width={96} height={96} className="h-full w-full object-cover" />
                    ) : (
                        <User className="h-10 w-10 text-zinc-500" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">GitHub account</p>
                    <h2 className="mt-2 truncate text-2xl font-semibold">{user.name || username}</h2>
                    <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-400 sm:flex-row sm:flex-wrap sm:gap-5">
                        <span className="inline-flex items-center gap-2"><Github className="h-4 w-4" /> @{username}</span>
                        {user.email && <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> {user.email}</span>}
                    </div>
                </div>
                {user.username && (
                    <a href={`https://github.com/${encodeURIComponent(user.username)}`} target="_blank" rel="noreferrer" className="repo-button shrink-0">
                        View GitHub <ExternalLink className="h-4 w-4" />
                    </a>
                )}
            </section>

            <div className="grid gap-5 md:grid-cols-2">
                <section className="codyn-panel rounded-2xl border border-white/10 p-6">
                    <ShieldCheck className="h-6 w-6 text-blue-300" />
                    <h2 className="mt-4 text-lg font-semibold">Security and access</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">Authentication is managed by GitHub. Codyn does not store a separate password for your account.</p>
                    <a href="https://github.com/settings/security" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200">
                        Manage GitHub security <ExternalLink className="h-4 w-4" />
                    </a>
                </section>

                <section className="codyn-panel rounded-2xl border border-white/10 p-6">
                    <Mail className="h-6 w-6 text-cyan-300" />
                    <h2 className="mt-4 text-lg font-semibold">Support and privacy</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">For account or data requests, contact devaanshdubey@gmail.com.</p>
                    <div className="mt-5 flex gap-4 text-sm">
                        <Link href="/privacy" className="text-cyan-300 hover:text-cyan-200">Privacy</Link>
                        <Link href="/terms" className="text-cyan-300 hover:text-cyan-200">Terms</Link>
                    </div>
                </section>
            </div>

            {isAdmin && (
                <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-6">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">Administrator</p>
                    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Admin analytics access is enabled</h2>
                            <p className="mt-1 text-sm text-zinc-400">View visitors, queries, scans, reports, and storage metrics.</p>
                        </div>
                        <Link href="/admin/stats" className="codyn-primary-action inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold">Open analytics</Link>
                    </div>
                </section>
            )}
        </div>
    );
}
