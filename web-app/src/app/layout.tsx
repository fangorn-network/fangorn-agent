import type { Metadata } from 'next'
import './globals.css';

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
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  );
}
