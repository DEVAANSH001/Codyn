import { NextRequest, NextResponse } from 'next/server';
import { getGitHubUser, getRepositories, getUserRepositories, GitHubError } from '@/lib/github-public';
import { parseRepositoryInput, validUsername } from '@/lib/codyn-dashboard';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.trim();
  const names = request.nextUrl.searchParams.get('names')?.split(',').map((name) => name.trim()).filter(Boolean) ?? [];

  try {
    if (username) {
      if (!validUsername(username)) return NextResponse.json({ error: 'Invalid GitHub username.' }, { status: 400 });
      const [user, repositories] = await Promise.all([getGitHubUser(username), getUserRepositories(username)]);
      return NextResponse.json({ user, repositories });
    }
    if (names.length) {
      if (names.length > 20 || names.some(name => !parseRepositoryInput(name))) return NextResponse.json({ error: 'Provide at most 20 valid owner/repository names.' }, { status: 400 });
      return NextResponse.json(await getRepositories(names));
    }
    return NextResponse.json({ error: 'Provide a GitHub username or repository names.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof GitHubError ? error.message : 'Unable to load GitHub data. Please retry.' }, { status: error instanceof GitHubError ? error.status : 502 });
  }
}
