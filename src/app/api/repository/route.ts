import { NextRequest, NextResponse } from 'next/server';
import { parseRepositoryInput } from '@/lib/codyn-dashboard';
import { getSnapshot, GitHubError, readRepoFile } from '@/lib/github-public';

export async function GET(request: NextRequest) {
  const parsed = parseRepositoryInput(request.nextUrl.searchParams.get('repo') || '');
  if (!parsed) return NextResponse.json({ error: 'Invalid owner/repository.' }, { status: 400 });
  try {
    const path = request.nextUrl.searchParams.get('path');
    const snapshot = await getSnapshot(parsed.owner, parsed.repo);
    if (path) {
      if (request.nextUrl.searchParams.get('revision') !== snapshot.revision) return NextResponse.json({ error: 'Repository revision changed. Reload the workspace before reading more files.' }, { status: 409 });
      return NextResponse.json({ path, content: await readRepoFile(parsed.owner, parsed.repo, path, snapshot), revision: snapshot.revision });
    }
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: error instanceof GitHubError ? error.message : 'GitHub could not be reached. Please retry.' }, { status: error instanceof GitHubError ? error.status : 502 });
  }
}
