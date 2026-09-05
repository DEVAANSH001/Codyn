import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { collectContextMock, generateContentStreamMock } = vi.hoisted(() => ({
  collectContextMock: vi.fn(),
  generateContentStreamMock: vi.fn(),
}));

vi.mock('@/lib/repo-analysis', () => ({
  collectContext: collectContextMock,
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContentStream: generateContentStreamMock };
  },
}));

import { POST } from '@/app/api/repository/chat/route';

function request(body: object) {
  return new NextRequest('http://localhost/api/repository/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/repository/chat', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    collectContextMock.mockReset();
    generateContentStreamMock.mockReset();
  });

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  });

  it('streams status, pinned sources, model output, and completion', async () => {
    collectContextMock.mockResolvedValue({
      snapshot: {
        revision: '1234567890abcdef',
        repository: { fullName: 'owner/repo', description: 'Example repository' },
        files: [{ path: 'src/index.ts' }, { path: 'README.md' }],
      },
      files: [{ path: 'src/index.ts', content: 'export const value = 1;' }],
      skipped: [],
    });
    generateContentStreamMock.mockResolvedValue(
      (async function* () {
        yield { text: 'The entry point is ' };
        yield { text: '`src/index.ts`.' };
      })(),
    );

    const response = await POST(
      request({
        repo: 'owner/repo',
        question: 'Where is the entry point?',
        depth: 'quick',
        history: [{ role: 'user', text: 'Explain the project.' }],
      }),
    );
    const events = (await response.text())
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/x-ndjson');
    expect(collectContextMock).toHaveBeenCalledWith(
      'owner',
      'repo',
      'quick',
      'Where is the entry point?',
    );
    expect(events).toEqual([
      { type: 'status', text: 'Selecting and reading repository context…' },
      { type: 'sources', paths: ['src/index.ts'], revision: '1234567890abcdef' },
      { type: 'status', text: 'Preparing an answer from 1 files…' },
      { type: 'delta', text: 'The entry point is ' },
      { type: 'delta', text: '`src/index.ts`.' },
      { type: 'done' },
    ]);
  });

  it('returns a useful configuration error without invoking repository reads', async () => {
    delete process.env.GEMINI_API_KEY;
    const response = await POST(
      request({ repo: 'owner/repo', question: 'Explain it', depth: 'quick' }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({ error: expect.stringContaining('GEMINI_API_KEY') }),
    );
    expect(collectContextMock).not.toHaveBeenCalled();
  });

  it('rejects malformed repository chat requests', async () => {
    const response = await POST(
      request({ repo: 'not-a-repository', question: '', depth: 'wide' }),
    );

    expect(response.status).toBe(400);
    expect(collectContextMock).not.toHaveBeenCalled();
  });
});
