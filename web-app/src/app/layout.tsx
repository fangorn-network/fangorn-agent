import type { Metadata } from 'next'
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Fangorn Agent',
  description: 'Talk with your Fangorn Agent, a personal AI assistant from Fangorn',
};

export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="h-screen overflow-hidden"><Providers>{children}</Providers></body>
    </html>
  );
}
