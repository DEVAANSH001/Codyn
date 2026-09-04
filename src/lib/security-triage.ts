import type { Finding } from './codyn-dashboard';

export type SourceFile = { path: string; content: string };
export type LockedDependency = { name: string; version: string; path: string };

const rules: { title: string; severity: Finding['severity']; pattern: RegExp; recommendation: string }[] = [
  { title: 'Dynamic code evaluation', severity: 'high', pattern: /\beval\s*\(|\bnew\s+Function\s*\(/, recommendation: 'Avoid executing dynamic strings. Validate data and use an explicit operation allowlist instead.' },
  { title: 'TLS verification disabled', severity: 'high', pattern: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/, recommendation: 'Enable certificate verification and configure a trusted certificate authority.' },
  { title: 'Raw HTML rendering', severity: 'medium', pattern: /dangerouslySetInnerHTML|\.innerHTML\s*=/, recommendation: 'Ensure values are trusted or sanitized by a maintained HTML sanitizer before rendering.' },
  { title: 'Shell execution boundary', severity: 'medium', pattern: /\bexec(?:Sync)?\s*\(|shell\s*:\s*true/, recommendation: 'Review whether untrusted data can reach this call. Prefer argument arrays with shell execution disabled.' },
  { title: 'Potential hard-coded credential', severity: 'high', pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][a-zA-Z0-9_+\/-]{20,}['"]|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i, recommendation: 'Verify whether this is a real credential. If so, revoke it and move secrets to server-side configuration. Do not paste it into chat.' },
];

export function scanPatterns(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (!/\.(tsx?|jsx?|mjs|cjs|py|go|java|rb|php|ya?ml)$/i.test(file.path)) continue;
    const lines = file.content.split('\n');
    for (const [index, line] of lines.entries()) {
      if (/^\s*(\/\/|\*|#)/.test(line)) continue;
      for (const rule of rules) {
        if (rule.pattern.test(line)) findings.push({
          id: `${file.path}:${index + 1}:${rule.title}`, title: rule.title, severity: rule.severity,
          path: file.path, line: index + 1, source: 'pattern',
          description: 'A source pattern matched this location. This is a review candidate, not a verified exploitable vulnerability. Reachability and data flow have not been proven.',
          recommendation: rule.recommendation,
        });
        if (findings.length >= 100) return findings;
      }
    }
  }
  return findings;
}

export function lockedDependencies(files: SourceFile[]): LockedDependency[] {
  const found = new Map<string, LockedDependency>();
  for (const file of files.filter(file => file.path.endsWith('package-lock.json'))) {
    try {
      const lock = JSON.parse(file.content);
      for (const [path, raw] of Object.entries(lock.packages ?? {})) {
        const item = raw as { version?: string; name?: string; link?: boolean };
        const name = item.name || path.split('node_modules/').pop();
        if (!path || item.link || !name || !/^(?:@[\w.-]+\/)?[\w.-]+$/.test(name) || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(item.version || '')) continue;
        found.set(`${name}@${item.version}`, { name, version: item.version!, path: file.path });
      }
    } catch { /* Unsupported or malformed lockfiles are reported by the caller as a coverage limit. */ }
  }
  return [...found.values()];
}

export function summarizeFindings(findings: Finding[]) {
  return findings.reduce((counts, finding) => { counts[finding.severity]++; return counts; }, { high: 0, medium: 0, low: 0 });
}
