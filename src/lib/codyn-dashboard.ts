export type ScanDepth = 'quick' | 'deep';

export type ScanRecord = {
  id: string;
  owner: string;
  repo: string;
  depth: ScanDepth;
  createdAt: string;
  issues: { high: number; medium: number; low: number };
  filesChecked?: number;
  findings?: Finding[];
  limitations?: string[];
  revision?: string;
};

export type Finding = {
  id: string; title: string; severity: 'high' | 'medium' | 'low';
  path: string; line?: number; description: string; recommendation: string;
  source: 'pattern' | 'dependency'; url?: string;
};

export type RepositorySummary = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  private: boolean;
  htmlUrl: string;
  updatedAt: string;
};

export function parseRepositoryInput(input: string): { owner: string; repo: string } | null {
  if (typeof input !== 'string' || input.length > 250) return null;
  const cleaned = input.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/^github\.com\//i, '').replace(/\/$/, '');
  const parts = cleaned.split('/');
  if (parts.length !== 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, '');
  if (!validUsername(owner) || !/^[\w.-]{1,100}$/.test(repo) || /^\.+$/.test(repo)) return null;
  return { owner, repo };
}

export function validUsername(value: string): boolean {
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value);
}

export function issueTotal(scan: ScanRecord) {
  return scan.issues.high + scan.issues.medium + scan.issues.low;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
