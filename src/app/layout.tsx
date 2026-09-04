import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Codyn — Chat With Your Codebase',
  description: 'Explore public GitHub repositories with source-grounded AI, architecture context, and bounded security triage.',
  metadataBase: new URL(/^https?:\/\//.test(process.env.APP_URL || '') ? process.env.APP_URL! : 'http://localhost:3000'),
  openGraph: { title: 'Codyn — Talk with your codebase.', description: 'Repository intelligence, reimagined.', images: [{ url: '/og.png', width: 1729, height: 910, alt: 'Codyn — Talk with your codebase.' }] },
  twitter: { card: 'summary_large_image', title: 'Codyn — Talk with your codebase.', description: 'Repository intelligence, reimagined.', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
