import { ArrowRight, ScanSearch } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <section className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
      <div className="dashboard-panel max-w-2xl rounded-[28px] p-8 text-center sm:p-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#00d2ff]/25 bg-[#00d2ff]/10 text-[#00d2ff]">
          <ScanSearch className="h-7 w-7" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#00d2ff]">Workspace ready</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Your Codyn intelligence dashboard</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/55">
          The dashboard foundation is in place. Repository analysis, scan history, and saved projects are the next milestones.
        </p>
        <Link href="/" className="dashboard-focus mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#00d2ff]">
          Return to Codyn <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
