import type { Metadata } from 'next';
import { Cormorant_Garamond, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';
import { ThemeBootstrap } from '@/components/layout/ThemeBootstrap';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'AILA BPMN — Mapeamento de processos',
  description: 'AILA BPMN — visualizador e mapeador de processos BPMN 2.0 da AILA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeBootstrap />
      </head>
      <body className="bg-surface text-fg-primary antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
