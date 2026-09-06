import Link from 'next/link';
import { Github, ArrowLeft } from 'lucide-react';
import { signIn } from '@/lib/auth';
import { LogoMark } from '@/components/LogoMark';

export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<{ callbackUrl?: string; scope?: string; error?: string }>;
}) {
  const params = await searchParams;
  const requestedCallback = params.callbackUrl || '/dashboard';
  const callbackUrl = requestedCallback.startsWith('/') && !requestedCallback.startsWith('//') && !requestedCallback.includes('\\')
    ? requestedCallback : '/dashboard';
  const configured = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && process.env.DATABASE_URL);
  const scope = params.scope?.split(' ').includes('repo') ? 'read:user user:email repo' : 'read:user user:email';

  return <main className="codyn-product codyn-workspace-grid grid min-h-dvh place-items-center px-6 py-12">
    <section className="codyn-panel w-full max-w-md rounded-3xl border border-white/10 p-8 sm:p-10">
      <Link href="/" className="mb-8 inline-flex items-center gap-3"><span className="codyn-brand-mark grid h-10 w-10 place-items-center rounded-xl"><LogoMark className="h-6 w-6 text-cyan-200" /></span><span className="text-xl font-semibold">Codyn</span></Link>
      <h1 className="text-2xl font-semibold">Your code, in one workspace.</h1>
      <p className="mt-4 text-sm leading-7 text-white/50">Sign in with GitHub to access your dashboard, saved conversations, and scan history.</p>
      {params.error && <p role="alert" className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-200">Sign-in could not be completed. Please retry or continue with a public repository.</p>}
      {configured ? <form className="mt-8" action={async () => {
        'use server';
        await signIn('github', { redirectTo: callbackUrl }, { scope });
      }}><button type="submit" className="codyn-primary-action flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"><Github size={18} /> Continue with GitHub</button></form> : <div className="mt-8 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm leading-6 text-white/65">GitHub sign-in and saved accounts have not been connected on this installation yet. Public repository chat, file browsing, and quick security scans are available now.</div>}
      <Link href="/chat" className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-200"><ArrowLeft size={15} /> Continue to public workspace</Link>
    </section>
  </main>;
}
