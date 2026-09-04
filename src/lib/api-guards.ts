import { NextRequest, NextResponse } from 'next/server';

// A process-local safety budget, not a replacement for an authenticated edge quota.
const counts = new Map<string, { count: number; until: number }>();
export function guardMutation(request: NextRequest, budget = 10): NextResponse | null {
  const origin = request.headers.get('origin');
  const allowedOrigin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : request.nextUrl.origin;
  if (origin !== allowedOrigin) return NextResponse.json({ error: 'Same-origin requests only.' }, { status: 403 });
  if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'JSON required.' }, { status: 415 });
  if (Number(request.headers.get('content-length') || 0) > 30000) return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
  const now = Date.now();
  // A global per-process bucket also prevents spoofed client headers bypassing the cap.
  const key = request.nextUrl.pathname;
  const bucket = counts.get(key);
  if (bucket && bucket.until > now && bucket.count >= budget) return NextResponse.json({ error: 'This server is at its analysis budget for the next minute. Please retry shortly.' }, { status: 429, headers: { 'Retry-After': '60' } });
  counts.set(key, bucket && bucket.until > now ? { ...bucket, count: bucket.count + 1 } : { count: 1, until: now + 60000 });
  return null;
}
export async function readJsonBody(request: NextRequest) {
  if (!request.body) throw new Error('Missing request body.');
  const reader = request.body.getReader(); const decoder = new TextDecoder();
  let text = ''; let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 30000) { await reader.cancel(); throw new Error('Request too large.'); }
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}
