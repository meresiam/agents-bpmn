'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full sm:max-w-md bg-surface-elevated border border-border-app rounded-t-aila sm:rounded-aila shadow-2xl p-5 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-fg-primary tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
