import { SAMPLE_SCANS, ScanRecord } from './codyn-dashboard';

const SCANS_KEY = 'codyn.scan-history.v1';
const STARRED_KEY = 'codyn.starred-repositories.v1';
const USERNAME_KEY = 'codyn.github-username.v1';

export function readScans(): ScanRecord[] {
  if (typeof window === 'undefined') return SAMPLE_SCANS;
  try {
    const stored = window.localStorage.getItem(SCANS_KEY);
    return stored ? (JSON.parse(stored) as ScanRecord[]) : SAMPLE_SCANS;
  } catch {
    return SAMPLE_SCANS;
  }
}

export function recordScan(scan: ScanRecord) {
  if (typeof window === 'undefined') return;
  const next = [scan, ...readScans().filter((item) => item.owner !== scan.owner || item.repo !== scan.repo)].slice(0, 30);
  window.localStorage.setItem(SCANS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('codyn:scans-updated'));
}

export function readStarred(): string[] {
  if (typeof window === 'undefined') return ['facebook/react', 'vercel/next.js', 'tailwindlabs/tailwindcss'];
  try {
    const stored = window.localStorage.getItem(STARRED_KEY);
    return stored ? (JSON.parse(stored) as string[]) : ['facebook/react', 'vercel/next.js', 'tailwindlabs/tailwindcss'];
  } catch {
    return [];
  }
}

export function toggleStarred(fullName: string) {
  const current = readStarred();
  const next = current.includes(fullName) ? current.filter((item) => item !== fullName) : [fullName, ...current];
  window.localStorage.setItem(STARRED_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('codyn:starred-updated'));
  return next;
}

export function readGitHubUsername() {
  if (typeof window === 'undefined') return 'vercel';
  return window.localStorage.getItem(USERNAME_KEY) || 'vercel';
}

export function writeGitHubUsername(username: string) {
  window.localStorage.setItem(USERNAME_KEY, username.trim());
}
