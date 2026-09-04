import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RepositoryWorkspace } from '@/components/repository/RepositoryWorkspace';
import { parseRepositoryInput } from '@/lib/codyn-dashboard';

type Props = { params: Promise<{ owner: string; repo: string }>; searchParams: Promise<{ scan?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = await params;
  const title = `${owner}/${repo} — Codyn`;
  const description = `Explore ${owner}/${repo} source, architecture, and security review candidates with Codyn.`;
  return { title, description, openGraph: { title, description, images: [] }, twitter: { title, description, images: [] } };
}
export default async function RepositoryPage({ params, searchParams }: Props) {
  const { owner, repo } = await params;
  if (!parseRepositoryInput(`${owner}/${repo}`)) notFound();
  const { scan } = await searchParams;
  return <RepositoryWorkspace key={`${owner}/${repo}`} owner={owner} repo={repo} initialDepth={scan === 'quick' ? 'quick' : 'deep'} />;
}
