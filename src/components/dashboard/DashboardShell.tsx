'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  ChevronLeft,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Star,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoMark } from '@/components/LogoMark';

const navigation = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Recent scans', href: '/dashboard/scans', icon: History },
  { label: 'My repositories', href: '/dashboard/repos', icon: BookOpen },
  { label: 'Starred', href: '/dashboard/starred', icon: Star },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function Navigation({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard navigation" className="flex-1 space-y-1.5 px-3 py-5">
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={`dashboard-focus group flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium transition-all ${
              active
                ? 'border-[#00d2ff]/25 bg-[#00d2ff]/10 text-[#8deaff] shadow-[0_0_22px_rgba(0,210,255,0.08)]'
                : 'border-transparent text-white/55 hover:border-white/8 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[#00d2ff]' : 'group-hover:text-[#00d2ff]'}`} />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="dashboard-grid flex min-h-dvh bg-[#0c0c0c] text-white">
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-white/8 bg-black/70 backdrop-blur-2xl transition-[width] duration-300 md:flex ${
          collapsed ? 'w-[76px]' : 'w-[248px]'
        }`}
      >
        <div className="flex h-20 items-center justify-between px-4">
          <Link href="/" aria-label="Codyn home" className="dashboard-focus flex items-center gap-3 rounded-lg">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#00d2ff]/25 bg-[#00d2ff]/10 text-[#8deaff]">
              <LogoMark className="h-5 w-5" />
            </span>
            {!collapsed && <span className="text-xl font-bold tracking-tight">Codyn</span>}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="dashboard-focus rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="dashboard-focus mx-auto rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label="Expand sidebar"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        )}
        <Navigation collapsed={collapsed} />
        <div className="border-t border-white/8 p-3">
          <Link
            href="/"
            className="dashboard-focus flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/45 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Back to landing</span>}
          </Link>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-black/80 px-4 backdrop-blur-xl md:hidden">
        <Link href="/" className="dashboard-focus flex items-center gap-2 rounded-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#00d2ff]/25 bg-[#00d2ff]/10 text-[#8deaff]">
            <LogoMark className="h-4 w-4" />
          </span>
          Codyn
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="dashboard-focus rounded-xl border border-white/10 bg-white/5 p-2.5 text-white"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-[60] flex w-[290px] flex-col border-r border-white/10 bg-[#0b0d10] md:hidden"
            >
              <div className="flex h-20 items-center justify-between px-5">
                <div className="flex items-center gap-3 text-lg font-bold">
                  <LogoMark className="h-5 w-5 text-[#00d2ff]" /> Codyn
                </div>
                <button type="button" onClick={() => setMobileOpen(false)} className="dashboard-focus rounded-lg p-2 text-white/60" aria-label="Close navigation">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Navigation onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1 pt-16 md:pt-0">
        <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8 xl:p-10">{children}</div>
      </main>
    </div>
  );
}
