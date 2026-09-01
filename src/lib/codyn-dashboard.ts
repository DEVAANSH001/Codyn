export type ScanDepth = 'quick' | 'deep';

export type ScanRecord = {
  id: string;
  owner: string;
  repo: string;
  depth: ScanDepth;
  createdAt: string;
  issues: { high: number; medium: number; low: number };
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
  const cleaned = input.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/^github\.com\//i, '').replace(/\.git$/i, '');
  const [owner, repo] = cleaned.split('/').filter(Boolean);
  if (!owner || !repo || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
  return { owner, repo };
}

export function issueTotal(scan: ScanRecord) {
  return scan.issues.high + scan.issues.medium + scan.issues.low;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
