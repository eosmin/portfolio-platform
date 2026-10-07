import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { Footer } from '../components/layout/footer';
import { Header } from '../components/layout/header';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Full-stack TypeScript portfolio',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-fg">
        {/* Reveal animations start hidden; without JS they never run, so show the content. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="focus:outline-none mx-auto w-full max-w-5xl flex-1 px-4 py-8"
        >
          {children}
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
