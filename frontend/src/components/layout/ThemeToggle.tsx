'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || 'light';
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('aila-theme', next);
    } catch {
      /* swallow */
    }
  }

  const Icon = theme === 'dark' ? Sun : Moon;
  const label = theme === 'dark' ? 'Trocar para modo claro' : 'Trocar para modo escuro';

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      suppressHydrationWarning
      className={`inline-flex h-9 w-9 items-center justify-center rounded-aila border border-border-app bg-surface-elevated text-fg-secondary hover:text-fg-primary hover:bg-surface-hover transition-colors ${className}`}
    >
      {mounted ? <Icon size={16} /> : <span className="h-4 w-4" aria-hidden />}
    </button>
  );
}
