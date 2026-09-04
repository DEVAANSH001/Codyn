import assert from 'node:assert/strict';
import test from 'node:test';
import { clearScans, readDefaultDepth, readScans, readStarred, recordScan, toggleStarred, writeDefaultDepth } from '../src/lib/dashboard-storage';

test('local state persists preferences and reports without fabricated defaults', () => {
  const data = new Map<string,string>();
  const original = globalThis.window;
  globalThis.window = { localStorage: { getItem: (key:string) => data.get(key) ?? null, setItem: (key:string,value:string) => data.set(key,value) }, dispatchEvent: () => true } as unknown as Window & typeof globalThis;
  try {
    assert.deepEqual(readScans(), []); assert.deepEqual(readStarred(), []);
    writeDefaultDepth('quick'); assert.equal(readDefaultDepth(), 'quick');
    toggleStarred('facebook/react'); assert.deepEqual(readStarred(), ['facebook/react']);
    toggleStarred('facebook/react'); assert.deepEqual(readStarred(), []);
    recordScan({ id: 'test', owner: 'owner', repo: 'repo', depth: 'quick', createdAt: new Date().toISOString(), issues: { high: 0, medium: 0, low: 0 } });
    assert.equal(readScans().length, 1); clearScans(); assert.equal(readScans().length, 0);
    data.set('codyn.scan-history.v2', '{broken'); assert.deepEqual(readScans(), []);
    data.set('codyn.starred-repositories.v1', 'null'); assert.deepEqual(readStarred(), []);
  } finally { globalThis.window = original; }
});
