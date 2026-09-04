import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function SafeMarkdown({ children }: { children: string }) {
  return <div className="codyn-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
    a: ({ href, children }) => href && /^https?:\/\//i.test(href) ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>,
    img: ({ alt }) => <span className="text-white/35">[Image: {alt || 'repository image'}]</span>,
  }}>{children}</ReactMarkdown></div>;
}
