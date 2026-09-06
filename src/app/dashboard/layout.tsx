"use client";

import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard, History, Star, Settings, ChevronLeft, Menu, LogOut, BookOpen, Plus, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/LogoMark";

const menuItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: History, label: "Recent Scans", href: "/dashboard/scans" },
    { icon: BookOpen, label: "My Repos", href: "/dashboard/repos" },
    { icon: Star, label: "Starred Repos", href: "/dashboard/starred" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <Link href="/" aria-label="Codyn home" className="inline-flex items-center gap-3 group shrink-0">
            <span className="codyn-brand-mark flex h-9 w-9 items-center justify-center rounded-xl p-1.5">
                <LogoMark className="h-full w-full text-white group-hover:text-[#00d2ff] transition-colors" />
            </span>
            {!compact && <span className="text-xl font-bold tracking-tight">Codyn</span>}
        </Link>
    );
}

function DashboardNav({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
    const pathname = usePathname();

    return (
        <nav aria-label="Dashboard" className="flex-1 space-y-1.5">
            {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        title={compact ? item.label : undefined}
                        className={`codyn-nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${compact ? "justify-center" : ""}`}
                    >
                        <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                        {!compact && <span className="font-medium">{item.label}</span>}
                    </Link>
                );
            })}
        </nav>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const mobilePanel = useRef<HTMLElement>(null);
    const mobileTrigger = useRef<HTMLButtonElement>(null);
    const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
    const hasInvalidSession = status !== "loading" && Boolean(session?.user) && !sessionUserId;

    useEffect(() => {
        if (hasInvalidSession) {
            signOut({ callbackUrl: "/?error=invalid_session" });
        }
    }, [hasInvalidSession]);

    useEffect(() => {
        if (!isMobileOpen) return;

        const panel = mobilePanel.current;
        const trigger = mobileTrigger.current;
        panel?.querySelector<HTMLButtonElement>("button")?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsMobileOpen(false);
            if (event.key !== "Tab" || !panel) return;
            const controls = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            trigger?.focus();
        };
    }, [isMobileOpen]);

    if (hasInvalidSession) {
        return (
            <div className="codyn-product min-h-screen text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                    <h1 className="text-xl font-semibold mb-2">Session Validation Failed</h1>
                    <p className="text-zinc-300 text-sm">Your session is invalid. Redirecting you to sign in again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="codyn-product flex h-dvh overflow-hidden text-white">
            <a href="#dashboard-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3 focus:text-black">
                Skip to dashboard content
            </a>
            <aside className={`codyn-sidebar hidden md:flex shrink-0 flex-col border-r backdrop-blur-xl transition-[width] duration-300 z-50 ${isCollapsed ? "w-20" : "w-64"}`}>
                <div className={`flex items-center p-5 ${isCollapsed ? "flex-col gap-4" : "justify-between"}`}>
                    <Brand compact={isCollapsed} />
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        aria-expanded={!isCollapsed}
                        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                        <ChevronLeft aria-hidden="true" className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
                    </button>
                </div>

                <div className={`pb-6 ${isCollapsed ? "px-3" : "px-5"}`}>
                    <Link href="/chat" aria-label="New analysis" title={isCollapsed ? "New analysis" : undefined} className="codyn-primary-action flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold">
                        <Plus aria-hidden="true" className="h-4 w-4 shrink-0" />
                        {!isCollapsed && "New analysis"}
                    </Link>
                </div>

                <div className={`flex flex-1 flex-col ${isCollapsed ? "px-3" : "px-4"}`}>
                    {!isCollapsed && <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">Workspace</p>}
                    <DashboardNav compact={isCollapsed} />
                </div>

                <div className="m-3 border-t border-white/10 pt-3">
                    {!isCollapsed && session?.user?.name && <p className="truncate px-3 pb-2 text-xs text-zinc-400">{session.user.name}</p>}
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        aria-label="Sign out"
                        title={isCollapsed ? "Sign out" : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 transition-colors hover:bg-red-400/5 hover:text-red-400 ${isCollapsed ? "justify-center" : ""}`}
                    >
                        <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" />
                        {!isCollapsed && "Sign out"}
                    </button>
                </div>
            </aside>

            <header className="codyn-sidebar md:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-xl border-b px-4 flex items-center justify-between z-40">
                <Brand />
                <div className="flex items-center gap-2">
                    <Link href="/chat" className="codyn-primary-action rounded-lg px-3 py-2 text-xs font-semibold">New analysis</Link>
                    <button
                        ref={mobileTrigger}
                        onClick={() => setIsMobileOpen(true)}
                        aria-label="Open dashboard menu"
                        aria-expanded={isMobileOpen}
                        aria-controls="dashboard-mobile-menu"
                        className="p-2 hover:bg-white/5 rounded-lg"
                    >
                        <Menu aria-hidden="true" className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            aria-hidden="true"
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] md:hidden"
                        />
                        <motion.aside
                            ref={mobilePanel}
                            id="dashboard-mobile-menu"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Dashboard menu"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="codyn-sidebar fixed inset-y-0 left-0 w-72 max-w-[90vw] border-r z-[70] p-5 flex flex-col md:hidden"
                        >
                            <div className="mb-7 flex items-center justify-between">
                                <Brand />
                                <button onClick={() => setIsMobileOpen(false)} aria-label="Close dashboard menu" className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white">
                                    <X aria-hidden="true" className="h-5 w-5" />
                                </button>
                            </div>
                            <Link href="/chat" onClick={() => setIsMobileOpen(false)} className="codyn-primary-action mb-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                                <Plus aria-hidden="true" className="h-4 w-4" /> New analysis
                            </Link>
                            <DashboardNav onNavigate={() => setIsMobileOpen(false)} />
                            <button onClick={() => signOut({ callbackUrl: "/" })} className="mt-6 flex items-center gap-3 rounded-xl border-t border-white/10 px-3 py-4 text-sm text-zinc-400 hover:text-red-400">
                                <LogOut aria-hidden="true" className="h-5 w-5" /> Sign out
                            </button>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <main id="dashboard-content" tabIndex={-1} className="codyn-workspace-grid relative min-w-0 flex-1 overflow-auto pt-16 md:pt-0">
                <div className="relative z-10 mx-auto w-full max-w-7xl p-4 md:p-8 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
