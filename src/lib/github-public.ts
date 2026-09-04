import type { RepositorySummary } from './codyn-dashboard';
import { parseRepositoryInput, validUsername } from './codyn-dashboard';

type GitHubRepository = { id: number; name: string; full_name: string; owner: { login: string }; description: string | null; language: string | null; stargazers_count: number; forks_count: number; private: boolean; html_url: string; updated_at: string; default_branch: string };
export type GitHubUser = { login: string; name: string | null; avatarUrl: string; bio: string | null; publicRepos: number; htmlUrl: string };
export type RepoFile = { path: string; type: 'blob' | 'tree'; size?: number; sha: string; mode: string };
export type RepoSnapshot = {
  repository: RepositorySummary; defaultBranch: string; revision: string;
  files: RepoFile[]; readme: string; languages: Record<string, number>;
  commits: { sha: string; message: string; date: string; author: string; url: string }[];
  truncated: boolean; warnings: string[];
};

export class GitHubError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

async function githubFetch<T>(path: string, cache: 'revalidate' | 'none' = 'revalidate'): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Codyn', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(cache === 'none' ? { cache: 'no-store' as const } : { next: { revalidate: 300 } }), signal: AbortSignal.timeout(15000), redirect: 'follow',
  });
  if (!response.ok) {
    if (response.status === 404) throw new GitHubError('Public GitHub repository or profile not found.', 404);
    if (response.status === 403 || response.status === 429) throw new GitHubError('GitHub rate limit or access restriction. Try again later, or configure a read-only GITHUB_TOKEN on the server.', 429);
    if (response.status === 409) throw new GitHubError('This repository is empty. Add a commit before analyzing it.', 422);
    throw new GitHubError(`GitHub is unavailable (${response.status}). Please retry.`);
  }
  return response.json() as Promise<T>;
}

function repoPath(owner: string, repo: string) {
  if (!parseRepositoryInput(`${owner}/${repo}`)) throw new GitHubError('Invalid repository name.', 400);
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
function normalize(repo: GitHubRepository): RepositorySummary {
  if (repo.private) throw new GitHubError('This workspace supports public repositories only.', 403);
  return { id: repo.id, name: repo.name, fullName: repo.full_name, owner: repo.owner.login, description: repo.description, language: repo.language, stars: repo.stargazers_count, forks: repo.forks_count, private: false, htmlUrl: repo.html_url, updatedAt: repo.updated_at };
}
export async function getGitHubUser(username: string): Promise<GitHubUser> {
  if (!validUsername(username)) throw new GitHubError('Invalid GitHub username.', 400);
  const data = await githubFetch<{ login: string; name: string | null; avatar_url: string; bio: string | null; public_repos: number; html_url: string }>(`/users/${username}`);
  return { login: data.login, name: data.name, avatarUrl: data.avatar_url, bio: data.bio, publicRepos: data.public_repos, htmlUrl: data.html_url };
}
export async function getUserRepositories(username: string): Promise<RepositorySummary[]> {
  if (!validUsername(username)) throw new GitHubError('Invalid GitHub username.', 400);
  const repos = await githubFetch<GitHubRepository[]>(`/users/${username}/repos?per_page=100&sort=updated&type=owner`);
  return repos.filter(repo => !repo.private).map(normalize);
}
export async function getRepository(owner: string, repo: string) { return normalize(await githubFetch<GitHubRepository>(repoPath(owner, repo))); }
export async function getRepositories(names: string[]) {
  const settled = await Promise.allSettled(names.slice(0, 20).map(name => { const [owner, repo] = name.split('/'); return getRepository(owner, repo); }));
  return { repositories: settled.flatMap(result => result.status === 'fulfilled' ? [result.value] : []), unavailable: names.filter((_, i) => settled[i]?.status === 'rejected') };
}

export function isReadableFile(file: RepoFile): boolean {
  return file.type === 'blob' && file.mode !== '120000' && (file.size ?? 0) <= 128000 &&
    !/(^|\/)(\.env(?:\..*)?|id_rsa|id_ed25519|credentials(?:\..*)?|node_modules|vendor|dist|build|\.git)(\/|$)/i.test(file.path) &&
    !/\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|woff2?|ttf|mp4|lockb|pem|key|p12|pfx|exe|dll|svg)$/i.test(file.path);
}

export async function getSnapshot(owner: string, repo: string): Promise<RepoSnapshot> {
  const base = repoPath(owner, repo);
  const raw = await githubFetch<GitHubRepository>(base);
  const repository = normalize(raw);
  const commitsRaw = await githubFetch<{ sha: string; commit: { message: string; author: { name: string; date: string } }; html_url: string }[]>(`${base}/commits?per_page=5`);
  const revision = commitsRaw[0]?.sha;
  if (!revision) throw new GitHubError('No commits are available for this repository.', 422);
  const tree = await githubFetch<{ tree: RepoFile[]; truncated: boolean }>(`${base}/git/trees/${revision}?recursive=1`, 'none');
  const warnings: string[] = [];
  const [readmeResult, languageResult] = await Promise.allSettled([
    githubFetch<{ content: string; encoding: string }>(`${base}/readme?ref=${revision}`),
    githubFetch<Record<string, number>>(`${base}/languages`),
  ]);
  if (readmeResult.status === 'rejected') warnings.push('README could not be loaded.');
  if (languageResult.status === 'rejected') warnings.push('Language statistics could not be loaded.');
  return {
    repository, defaultBranch: raw.default_branch, revision, files: tree.tree.slice(0, 5000),
    readme: readmeResult.status === 'fulfilled' ? Buffer.from(readmeResult.value.content, 'base64').toString('utf8').slice(0, 30000) : '',
    languages: languageResult.status === 'fulfilled' ? languageResult.value : {},
    commits: commitsRaw.map(commit => ({ sha: commit.sha, message: commit.commit.message.split('\n')[0], date: commit.commit.author?.date || '', author: commit.commit.author?.name || 'Unknown', url: commit.html_url })),
    truncated: tree.truncated || tree.tree.length > 5000, warnings,
  };
}

export async function readRepoFile(owner: string, repo: string, path: string, snapshot?: RepoSnapshot) {
  const context = snapshot ?? await getSnapshot(owner, repo);
  const file = context.files.find(file => file.path === path);
  if (!file || !isReadableFile(file)) throw new GitHubError('This file is excluded, binary, too large, or not in the current tree.', 422);
  const data = await githubFetch<{ content: string; size: number; encoding: string }>(`${repoPath(owner, repo)}/git/blobs/${file.sha}`, 'none');
  if (data.size > 128000 || data.encoding !== 'base64') throw new GitHubError('This file cannot be previewed.', 422);
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  if (content.includes('\u0000')) throw new GitHubError('Binary files cannot be previewed.', 422);
  return content;
}

export async function readRepoFileAtRevision(owner: string, repo: string, path: string, revision: string) {
  if (!/^[0-9a-f]{40}$/i.test(revision) || !path || path.length > 400 || path.startsWith('/') || path.includes('\\') || path.split('/').some(part => !part || part === '.' || part === '..')) throw new GitHubError('Invalid file reference.', 400);
  await getRepository(owner, repo); // Enforce the public-repository boundary before content access.
  const safePath = path.split('/').map(encodeURIComponent).join('/');
  const data = await githubFetch<{ content?: string; size: number; encoding?: string; type: string; path: string }>(`${repoPath(owner, repo)}/contents/${safePath}?ref=${revision}`, 'none');
  if (data.type !== 'file' || data.size > 128000 || data.encoding !== 'base64' || !data.content || !isReadableFile({ path: data.path, type: 'blob', size: data.size, sha: revision, mode: '100644' })) throw new GitHubError('This file is excluded, binary, too large, symlinked, or not in the pinned revision.', 422);
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  if (content.includes('\u0000')) throw new GitHubError('Binary files cannot be previewed.', 422);
  return content;
}
