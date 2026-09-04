import { NextRequest, NextResponse } from 'next/server';
import { parseRepositoryInput } from '@/lib/codyn-dashboard';
import { getSnapshot, GitHubError, readRepoFileAtRevision } from '@/lib/github-public';

export async function GET(request: NextRequest) {
  const parsed = parseRepositoryInput(request.nextUrl.searchParams.get('repo') || '');
  if (!parsed) return NextResponse.json({ error: 'Invalid owner/repository.' }, { status: 400 });
  try {
    const path = request.nextUrl.searchParams.get('path');
    if (path) {
      const revision = request.nextUrl.searchParams.get('revision') || '';
      return NextResponse.json({ path, content: await readRepoFileAtRevision(parsed.owner, parsed.repo, path, revision), revision });
    }
    return NextResponse.json(await getSnapshot(parsed.owner, parsed.repo));
  } catch (error) {
    return NextResponse.json({ error: error instanceof GitHubError ? error.message : 'GitHub could not be reached. Please retry.' }, { status: error instanceof GitHubError ? error.status : 502 });
  }
}
