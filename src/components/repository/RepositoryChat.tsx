'use client';

import { ArrowUp, Bot, CircleStop, FileCode2, LoaderCircle, Sparkles } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { SafeMarkdown } from './SafeMarkdown';
import type { ScanDepth } from '@/lib/codyn-dashboard';

type Message = { role: 'user' | 'assistant'; text: string; sources?: string[]; revision?: string };
const suggestions = ['Explain the architecture and main entry points.', 'How do I run this project locally?', 'Trace how a request flows through this repository.', 'Which security boundaries should I review?'];

export function RepositoryChat({ fullName, depth }: { fullName: string; depth: ScanDepth }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [messages, status]);

  async function ask(value: string) {
    if (!value.trim() || busy) return;
    setQuestion(''); setError(''); setBusy(true); setStatus('Connecting…');
    const history = messages.slice(-6);
    setMessages(previous => [...previous, { role: 'user', text: value }, { role: 'assistant', text: '' }]);
    const controller = new AbortController(); abort.current = controller;
    let completed = false;
    try {
      const response = await fetch('/api/repository/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repo: fullName, question: value, depth, history }), signal: controller.signal });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'AI request failed.'); }
      if (!response.body) throw new Error('No response stream.');
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
      while (true) {
        const { value: chunk, done } = await reader.read();
        buffer += decoder.decode(chunk, { stream: !done });
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.type === 'status') setStatus(event.text);
          if (event.type === 'error') throw new Error(event.text);
          if (event.type === 'done') completed = true;
          if (event.type === 'delta' || event.type === 'sources') setMessages(previous => previous.map((message, index) => index === previous.length - 1 ? { ...message, ...(event.type === 'delta' ? { text: message.text + event.text } : { sources: event.paths, revision: event.revision }) } : message));
        }
        if (done) break;
      }
      if (!completed) throw new Error('The response was interrupted. Please retry.');
    } catch (reason) { setError(controller.signal.aborted ? 'Response stopped. Any visible answer may be incomplete.' : (reason as Error).message); }
    finally { setBusy(false); setStatus(''); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void ask(question); }

  return <section className="flex min-h-[600px] flex-col">
    <div className="flex-1 space-y-6">
      {!messages.length && <div className="py-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#00d2ff]/20 bg-[#00d2ff]/10 text-[#00d2ff]"><Sparkles size={24} /></span><h2 className="mt-5 text-2xl font-semibold">What would you like to understand?</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/45">Ask about {fullName}. Codyn selects relevant source files and cites the context behind its answer.</p><div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">{suggestions.map(text => <button type="button" key={text} onClick={() => void ask(text)} className="dashboard-focus dashboard-panel rounded-xl p-4 text-left text-sm text-white/65 transition hover:border-[#00d2ff]/30 hover:text-white">{text}</button>)}</div></div>}
      {messages.map((message, index) => <article key={index} className={message.role === 'user' ? 'ml-auto max-w-[90%] rounded-2xl border border-white/10 bg-white/5 p-4' : 'rounded-2xl border border-[#00d2ff]/10 bg-black/20 p-5'}><p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8deaff]">{message.role === 'assistant' && <Bot size={15} />}{message.role === 'user' ? 'You' : 'Codyn'}</p>{message.text ? <SafeMarkdown>{message.text}</SafeMarkdown> : <p className="text-sm text-white/35">{busy ? 'Reading context…' : 'No answer was returned.'}</p>}{message.sources && <details className="mt-4 border-t border-white/8 pt-3 text-xs text-white/40"><summary className="cursor-pointer">{message.sources.length} source files · {message.revision?.slice(0,7)}</summary><div className="mt-2 flex flex-wrap gap-2">{message.sources.map(path => <code key={path} className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-1"><FileCode2 size={12} />{path}</code>)}</div></details>}</article>)}
      <div ref={end} />
    </div>
    <div className="sticky bottom-0 mt-6 bg-[#101318]/95 pt-3 backdrop-blur-xl">
      {error && <p role="alert" className="mb-3 rounded-xl border border-rose-300/20 bg-rose-300/5 p-3 text-sm text-rose-200">{error}</p>}
      {busy && <p role="status" className="mb-3 flex items-center gap-2 text-xs text-[#8deaff]"><LoaderCircle size={14} className="animate-spin" />{status}</p>}
      <form onSubmit={submit} className="flex items-end gap-3 rounded-2xl border border-white/15 bg-black/35 p-3 focus-within:border-[#00d2ff]/40"><label className="flex-1"><span className="sr-only">Ask about this repository</span><textarea value={question} onChange={event => setQuestion(event.target.value)} maxLength={4000} rows={2} placeholder="Ask about architecture, implementation, or security…" className="w-full resize-none bg-transparent p-1 text-sm leading-6 outline-none placeholder:text-white/30" /></label>{busy ? <button type="button" onClick={() => abort.current?.abort()} aria-label="Stop response" className="repo-button"><CircleStop size={20} /></button> : <button type="submit" disabled={!question.trim()} aria-label="Send question" className="dashboard-focus grid h-10 w-10 place-items-center rounded-xl bg-[#00d2ff] text-black disabled:opacity-35"><ArrowUp size={20} /></button>}</form>
      <p className="py-3 text-center text-[11px] leading-5 text-white/35">Submitting sends your question and selected public source files to Google Gemini. Answers can be wrong; verify cited code. Chat stays in this session.</p>
    </div>
  </section>;
}
