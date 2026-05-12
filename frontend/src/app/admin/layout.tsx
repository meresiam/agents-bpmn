'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import { AilaLogo } from '@/components/brand/AilaLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    if (!isSuperAdmin) {
      window.location.href = '/';
    }
  }, [isLoading, isAuthenticated, isSuperAdmin]);

  if (isLoading || !isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-sm text-fg-secondary">Carregando…</p>
      </div>
    );
  }

  const tabs = [
    { href: '/admin', label: 'Usuários', icon: Users, exact: true },
    { href: '/admin/tenants', label: 'Clientes', icon: Building2, exact: false },
  ];

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-sm border-b border-border-app">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 -ml-1 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <AilaLogo size={22} wordmarkSuffix="BPMN" />
          <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2 py-1 rounded-aila bg-aila-violet/10 border border-aila-violet/20">
            <ShieldCheck size={12} className="text-aila-violet" />
            <span className="text-[10px] font-semibold tracking-wider uppercase text-aila-violet">
              Admin
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 -mt-1">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Seções do painel">
            {tabs.map((tab) => {
              const active = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                    active
                      ? 'border-aila-violet text-fg-primary'
                      : 'border-transparent text-fg-tertiary hover:text-fg-primary',
                  )}
                >
                  <Icon size={13} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
