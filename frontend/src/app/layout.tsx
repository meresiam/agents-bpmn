import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/layout/Providers';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Bravy BPMN — Ferramenta interna',
  description: 'Visualizador BPMN 2.0 interno Bravy (JSON Bravy Graph).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-zinc-100 text-zinc-900 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
