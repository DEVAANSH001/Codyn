"use client";

import { useSession } from "next-auth/react";
import {
    LayoutDashboard,
    History,
    Star,
    Settings,
    ChevronLeft,
    Menu,
    LogOut,
    BookOpen
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogoMark } from "@/components/LogoMark";

const menuItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: History, label: "Recent Scans", href: "/dashboard/scans" },
    { icon: BookOpen, label: "My Repos", href: "/dashboard/repos" },
    { icon: Star, label: "Starred Repos", href: "/dashboard/starred" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const pathname = usePathname();
    const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
    const hasInvalidSession = status !== "loading" && Boolean(session?.user) && !sessionUserId;

    useEffect(() => {
        if (hasInvalidSession) {
            signOut({ callbackUrl: "/?error=invalid_session" });
        }
    }, [hasInvalidSession]);

    if (hasInvalidSession) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                    <h1 className="text-xl font-semibold mb-2">Session Validation Failed</h1>
                    <p className="text-zinc-300 text-sm">
                        Your session is invalid. Redirecting you to sign in again.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-black text-white">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex flex-col border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}
            >
                <div className="p-6 flex items-center justify-between">
                    {!isCollapsed && (
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <LogoMark className="h-8 w-8 text-cyan-300" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">Codyn</span>
                        </Link>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white"
                    >
                        <ChevronLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${isActive
                                    ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400 transition-colors'}`} />
                                {!isCollapsed && (
                                    <div className="flex items-center justify-between flex-1">
                                        <span className="font-medium">{item.label}</span>
                                        {item.label === "Settings" && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                                                Soon
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {!isCollapsed && <span className="font-medium">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-4 flex items-center justify-between z-40">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <LogoMark className="h-8 w-8 text-cyan-300" />
                    </div>
                    <span className="font-bold text-lg">Codyn</span>
                </Link>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 hover:bg-white/5 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-white/5 z-[70] p-6 flex flex-col md:hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="font-bold text-xl">Codyn</span>
                                <button onClick={() => setIsMobileOpen(false)} className="p-2 text-zinc-500">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            </div>
                            <nav className="flex-1 space-y-4">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${pathname === item.href ? 'bg-cyan-600/10 text-cyan-400' : 'text-zinc-400'
                                            }`}
                                    >
                                        <item.icon className="w-6 h-6" />
                                        <div className="flex items-center justify-between flex-1">
                                            <span className="font-medium text-lg">{item.label}</span>
                                            {item.label === "Settings" && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                                                    Soon
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <main className="flex-1 pt-16 md:pt-0 overflow-auto relative">
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
