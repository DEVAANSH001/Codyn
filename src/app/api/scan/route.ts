import { NextRequest, NextResponse } from 'next/server';
import { guardMutation, readJsonBody } from '@/lib/api-guards';
import { parseRepositoryInput } from '@/lib/codyn-dashboard';
import { AnalysisError, runTriage } from '@/lib/repo-analysis';
import { GitHubError } from '@/lib/github-public';

export const maxDuration = 120;
export async function POST(request: NextRequest) {
  const denied = guardMutation(request, 5); if (denied) return denied;
  let body: { repo?: string; depth?: string };
  try { body = await readJsonBody(request); } catch { return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 }); }
  const parsed = parseRepositoryInput(body?.repo || '');
  if (!parsed || !['quick', 'deep'].includes(body.depth || '')) return NextResponse.json({ error: 'Valid repository and scan depth required.' }, { status: 400 });
  try { return NextResponse.json(await runTriage(parsed.owner, parsed.repo, body.depth as 'quick' | 'deep')); }
  catch (error) { return NextResponse.json({ error: error instanceof GitHubError || error instanceof AnalysisError ? error.message : 'Scan could not complete. No result has been saved. Retry or select another repository.' }, { status: error instanceof GitHubError ? error.status : error instanceof AnalysisError ? 422 : 502 }); }
}
