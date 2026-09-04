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

export const SAMPLE_SCANS: ScanRecord[] = [
  {
    id: 'vercel-nextjs-001',
    owner: 'vercel',
    repo: 'next.js',
    depth: 'deep',
    createdAt: '2026-08-31T11:30:00.000Z',
    issues: { high: 0, medium: 2, low: 5 },
  },
  {
    id: 'facebook-react-001',
    owner: 'facebook',
    repo: 'react',
    depth: 'quick',
    createdAt: '2026-08-29T09:15:00.000Z',
    issues: { high: 0, medium: 0, low: 2 },
  },
  {
    id: 'tailwindlabs-tailwindcss-001',
    owner: 'tailwindlabs',
    repo: 'tailwindcss',
    depth: 'deep',
    createdAt: '2026-08-26T15:45:00.000Z',
    issues: { high: 1, medium: 3, low: 8 },
  },
];

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
