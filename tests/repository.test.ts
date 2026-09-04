import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRepositoryInput, validUsername } from '../src/lib/codyn-dashboard';
import { isReadableFile, getRepository } from '../src/lib/github-public';
import { lockedDependencies, scanPatterns, summarizeFindings } from '../src/lib/security-triage';

test('accepts repository names and GitHub URLs', () => {
  for (const input of ['facebook/react', 'https://github.com/facebook/react', 'github.com/facebook/react.git', 'https://github.com/facebook/react/']) assert.deepEqual(parseRepositoryInput(input), { owner: 'facebook', repo: 'react' });
});
test('rejects arbitrary hosts, traversal, query strings, and partial names', () => {
  for (const input of ['', 'react', '../repo', 'owner/..', 'https://evil.test/a/b', 'owner/repo/tree/main', 'owner/repo?x=1', 'a/b/../c', 'user//repo', 'owner/%2e%2e', 'https://github.com@evil.test/a/b']) assert.equal(parseRepositoryInput(input), null, input);
});
test('validates public GitHub user syntax', () => {
  assert.ok(validUsername('a')); assert.ok(validUsername('test-user')); assert.ok(!validUsername('-user')); assert.ok(!validUsername('user/anything')); assert.ok(!validUsername('a'.repeat(40)));
});
test('excludes secrets, binary assets, symlinks, build output, and oversized files', () => {
  const base = { type: 'blob' as const, mode: '100644', size: 20, sha: 'a' };
  for (const path of ['.env', '.env.local', 'config/id_rsa', 'private.pem', 'public/logo.png', 'node_modules/x.js', 'dist/app.js']) assert.equal(isReadableFile({ ...base, path }), false, path);
  assert.equal(isReadableFile({ ...base, path: 'src/index.ts', mode: '120000' }), false);
  assert.equal(isReadableFile({ ...base, path: 'large.ts', size: 128001 }), false);
  assert.equal(isReadableFile({ ...base, path: 'src/index.ts' }), true);
});
test('pattern matches are candidates with accurate file lines, without echoing secrets', () => {
  const findings = scanPatterns([{ path: 'server.ts', content: 'const ok = true;\nconst x = eval(input);\nconst token = "abcdefghijklmnopqrstuvw";' }]);
  assert.equal(findings.length, 2); assert.equal(findings[0].line, 2); assert.equal(findings[0].source, 'pattern');
  assert.match(findings[0].description, /not a verified/); assert.ok(!JSON.stringify(findings).includes('abcdefghijklmnopqrstuvw'));
});
test('ignores documentation and comment-only examples', () => {
  assert.equal(scanPatterns([{ path: 'README.md', content: 'eval(input)' }, { path: 'source.ts', content: '// eval(input)\nconst x = 1;' }]).length, 0);
});
test('bounds emitted pattern candidates', () => {
  assert.equal(scanPatterns([{ path: 'large.ts', content: 'eval(input);\n'.repeat(500) }]).length, 100);
});
test('only queries exact lockfile versions, not semver ranges or links', () => {
  const packages = { '': { name: 'root', version: '1.0.0' }, 'node_modules/lodash': { version: '4.17.20' }, 'node_modules/@scope/pkg': { version: '1.2.3-beta.1' }, 'node_modules/range': { version: '^1.0.0' }, 'node_modules/local': { link: true, version: '1.0.0' } };
  const deps = lockedDependencies([{ path: 'package-lock.json', content: JSON.stringify({ packages }) }]);
  assert.deepEqual(deps.map(dep => dep.name), ['lodash', '@scope/pkg']);
  assert.deepEqual(lockedDependencies([{ path: 'package.json', content: '{"dependencies":{"x":"^1.0.0"}}' }]), []);
});
test('malformed lockfile and empty findings remain safe', () => {
  assert.deepEqual(lockedDependencies([{ path: 'package-lock.json', content: 'invalid' }]), []);
  assert.deepEqual(summarizeFindings([]), { high: 0, medium: 0, low: 0 });
});
test('never returns private repository metadata even with a server token', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ private: true }), { status: 200 });
  try { await assert.rejects(() => getRepository('owner', 'private'), /public repositories only/); }
  finally { globalThis.fetch = original; }
});
