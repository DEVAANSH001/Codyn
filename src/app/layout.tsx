import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Codyn — Chat With Your Codebase',
  description: 'Codyn - AI-native codebase intelligence platform',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
