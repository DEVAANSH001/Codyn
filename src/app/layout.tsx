import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Codyn — Autonomous AI for Real-World Work',
  description: 'Give Codyn a goal. Its autonomous AI agents plan, browse, use tools, and deliver the finished result.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
