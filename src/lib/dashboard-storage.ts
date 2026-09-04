import type { ScanRecord, ScanDepth } from './codyn-dashboard';

const SCANS_KEY = 'codyn.scan-history.v2';
const STARRED_KEY = 'codyn.starred-repositories.v1';
const USERNAME_KEY = 'codyn.github-username.v1';
const DEPTH_KEY = 'codyn.default-depth.v1';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Your browser could not save this data. Check available storage and privacy settings.'); }
}
export function readScans(): ScanRecord[] {
  const scans = read<ScanRecord[]>(SCANS_KEY, []);
  return Array.isArray(scans) ? scans.filter(scan => scan && typeof scan.id === 'string' && typeof scan.owner === 'string' && typeof scan.repo === 'string' && typeof scan.createdAt === 'string' && scan.issues && ['high','medium','low'].every(key => typeof scan.issues[key] === 'number')) : [];
}
export function recordScan(scan: ScanRecord) {
  write(SCANS_KEY, [scan, ...readScans().filter(item => item.id !== scan.id)].slice(0, 30));
  window.dispatchEvent(new Event('codyn:scans-updated'));
}
export function clearScans() { write(SCANS_KEY, []); window.dispatchEvent(new Event('codyn:scans-updated')); }
export function readStarred(): string[] {
  const items = read<string[]>(STARRED_KEY, []);
  return Array.isArray(items) ? items.filter(item => typeof item === 'string').slice(0, 20) : [];
}
export function toggleStarred(fullName: string) {
  const current = readStarred();
  if (!current.includes(fullName) && current.length >= 20) throw new Error('You can save up to 20 repositories on this device.');
  const next = current.includes(fullName) ? current.filter(item => item !== fullName) : [fullName, ...current];
  write(STARRED_KEY, next); window.dispatchEvent(new Event('codyn:starred-updated')); return next;
}
export function readGitHubUsername() { const value = read<string>(USERNAME_KEY, 'vercel'); return typeof value === 'string' ? value : 'vercel'; }
export function writeGitHubUsername(username: string) { write(USERNAME_KEY, username.trim()); }
export function readDefaultDepth(): ScanDepth { return read<string>(DEPTH_KEY, 'deep') === 'quick' ? 'quick' : 'deep'; }
export function writeDefaultDepth(depth: ScanDepth) { write(DEPTH_KEY, depth); }
