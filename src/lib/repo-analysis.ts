import { getSnapshot, isReadableFile, readRepoFile } from './github-public';
import type { RepoSnapshot } from './github-public';
import type { Finding, ScanDepth, ScanRecord } from './codyn-dashboard';
import { lockedDependencies, scanPatterns, summarizeFindings } from './security-triage';

export class AnalysisError extends Error {}

export async function collectContext(owner: string, repo: string, depth: ScanDepth, question = '', snapshot?: RepoSnapshot) {
  const data = snapshot ?? await getSnapshot(owner, repo);
  const terms: string[] = question.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  const candidates = data.files.filter(isReadableFile).filter(file => /\.(md|json|tsx?|jsx?|mjs|cjs|py|go|java|rb|php|ya?ml)$/i.test(file.path));
  const score = (path: string) => {
    const lower = path.toLowerCase();
    return (/package(-lock)?\.json$|readme\.md$/.test(lower) ? 40 : 0) + (/auth|security|api|route|server|index|app|main/.test(lower) ? 15 : 0) + terms.reduce((sum, term) => sum + (lower.includes(term) ? 8 : 0), 0) - lower.split('/').length;
  };
  const selected = candidates.sort((a, b) => score(b.path) - score(a.path)).slice(0, depth === 'deep' ? 24 : 8);
  const files: { path: string; content: string }[] = [];
  const skipped: string[] = [];
  let characters = 0;
  for (let start = 0; start < selected.length; start += 4) {
    const batch = await Promise.allSettled(selected.slice(start, start + 4).map(async file => ({ path: file.path, content: await readRepoFile(owner, repo, file.path, data) })));
    for (const [index, result] of batch.entries()) {
      if (result.status === 'rejected') { skipped.push(selected[start + index].path); continue; }
      const file = result.value;
      if (characters + file.content.length > 180000) { skipped.push(file.path); continue; }
      characters += file.content.length; files.push(file);
    }
  }
  return { snapshot: data, files, skipped, eligible: candidates.length };
}

export async function runTriage(owner: string, repo: string, depth: ScanDepth): Promise<ScanRecord> {
  const { snapshot, files, skipped, eligible } = await collectContext(owner, repo, depth, 'auth security api server');
  if (!files.length) throw new AnalysisError('No supported source files could be read. No scan result was produced.');
  const findings = scanPatterns(files);
  const limitations = [
    `Read ${files.length} of ${eligible} eligible files at revision ${snapshot.revision.slice(0, 7)}. ${depth === 'deep' ? 'Deep' : 'Quick'} mode caps selection at ${depth === 'deep' ? 24 : 8} files, 128 KB each, and 180,000 total characters.`,
    'Pattern matches require human review. No runtime exploitation, taint analysis, or AI verification was performed. Absence of findings does not establish that a repository is secure.',
    'Dependency coverage: npm package-lock v2/v3 exact versions only; up to 30 unique packages, including development dependencies. Other ecosystems and version ranges are not checked.',
  ];
  if (snapshot.truncated) limitations.push('The GitHub file tree was truncated; files outside it are not analyzed.');
  if (skipped.length) limitations.push(`${skipped.length} selected files were unavailable or exceeded the context budget.`);
  const dependencies = lockedDependencies(files).slice(0, 30);
  if (!dependencies.length) limitations.push('No supported exact-version lockfile packages were read. No dependency advisory check was performed.');
  else {
    try {
      const response = await fetch('https://api.osv.dev/v1/querybatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ queries: dependencies.map(dep => ({ package: { name: dep.name, ecosystem: 'npm' }, version: dep.version })) }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('OSV unavailable');
      const result: { results: { vulns?: { id: string }[]; next_page_token?: string }[] } = await response.json();
      if (!Array.isArray(result.results) || result.results.length !== dependencies.length) throw new Error('OSV incomplete');
      result.results.forEach((item, index) => {
        const dep = dependencies[index];
        if (item.next_page_token) limitations.push(`OSV results for ${dep.name} are paginated; this report includes the first page only.`);
        for (const vuln of (item.vulns ?? []).slice(0, 10)) {
          if (!/^[a-zA-Z0-9-]+$/.test(vuln.id)) continue;
          findings.push({ id: `${dep.name}:${dep.version}:${vuln.id}`, title: `${vuln.id} · ${dep.name}@${dep.version}`, severity: 'medium', source: 'dependency', path: dep.path,
            description: 'OSV returned an advisory for this exact lockfile version. Medium is a review priority, not a CVSS severity assessment. Application reachability has not been verified.', recommendation: 'Read the advisory and upgrade to a fixed version compatible with your project.', url: `https://osv.dev/vulnerability/${vuln.id}` } satisfies Finding);
        }
      });
      limitations.push(`Queried OSV for ${dependencies.length} exact package versions at scan time.`);
    } catch { limitations.push('OSV was unavailable. Dependency advisory checks did not complete; source-pattern results only.'); }
  }
  return { id: crypto.randomUUID(), owner, repo, depth, createdAt: new Date().toISOString(), revision: snapshot.revision, filesChecked: files.length, findings, issues: summarizeFindings(findings), limitations };
}
