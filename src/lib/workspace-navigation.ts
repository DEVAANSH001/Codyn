import { parseRepositoryInput, validUsername } from './codyn-dashboard';

/** The RepoMind application accepts either an owner/repository or a profile. */
export function parseWorkspaceInput(input: string): string | null {
  const repository = parseRepositoryInput(input);
  if (repository) return `${repository.owner}/${repository.repo}`;
  const username = input.trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/\/$/, '');
  return validUsername(username) ? username : null;
}

export function workspaceHref(input: string, prompt?: string): string | null {
  const query = parseWorkspaceInput(input);
  if (!query) return null;
  const params = new URLSearchParams({ q: query });
  if (prompt) params.set('prompt', prompt);
  return `/chat?${params.toString()}`;
}
