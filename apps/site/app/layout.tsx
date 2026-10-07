import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { Footer, FooterSkeleton } from '../components/layout/footer';
import { Header } from '../components/layout/header';
import { THEME_INIT_SCRIPT } from '../lib/theme';
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
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-fg">
        {/* Reveal animations start hidden; without JS they never run, so show the content. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 focus:outline-none sm:px-6 lg:px-8"
        >
          {children}
        </main>
        <Suspense fallback={<FooterSkeleton />}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
