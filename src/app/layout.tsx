import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { Toaster } from 'sonner';
import JsonLd from './components/json-ld';
import { Providers } from '@/components/Providers';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0c0c0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Codyn — Chat With Your Codebase',
  description: 'Explore public GitHub repositories with source-grounded AI, architecture context, and bounded security triage.',
  metadataBase: new URL(/^https?:\/\//.test(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '') ? (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL)! : 'http://localhost:3000'),
  openGraph: { title: 'Codyn — Talk with your codebase.', description: 'Repository intelligence, reimagined.', images: [{ url: '/og.png', width: 1729, height: 910, alt: 'Codyn — Talk with your codebase.' }] },
  twitter: { card: 'summary_large_image', title: 'Codyn — Talk with your codebase.', description: 'Repository intelligence, reimagined.', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <JsonLd />
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: '#121417',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
