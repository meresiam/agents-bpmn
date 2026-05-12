'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Save, X, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeneratedGraph } from '@/services/chat.service';
import type { ProcessCategory } from '@/services/process.service';

const GraphPreviewCanvas = dynamic(
  () => import('./GraphPreviewCanvas').then((m) => m.GraphPreviewCanvas),
  { ssr: false },
);

const CATEGORIES: ProcessCategory[] = [
  'COMERCIAL',
  'MARKETING',
  'FINANCEIRO',
  'OPERACOES',
  'RH',
  'ATENDIMENTO',
  'ONBOARDING',
  'LOGISTICA',
  'JURIDICO',
  'TI',
  'OUTRO',
];

interface GraphPreviewModalProps {
  result: GeneratedGraph;
  saving: boolean;
  saveError: string | null;
  onSave: (data: {
    slug: string;
    title: string;
    description: string;
    category: ProcessCategory;
  }) => void;
  onRegenerate: () => void;
  onClose: () => void;
}

export function GraphPreviewModal({
  result,
  saving,
  saveError,
  onSave,
  onRegenerate,
  onClose,
}: GraphPreviewModalProps) {
  const [title, setTitle] = useState(result.suggestedTitle);
  const [slug, setSlug] = useState(result.suggestedSlug);
  const [description, setDescription] = useState(result.suggestedDescription);
  const [category, setCategory] = useState<ProcessCategory>(
    result.suggestedCategory as ProcessCategory,
  );

  const nodeCount = (result.graph as { nodes: unknown[] }).nodes?.length ?? 0;
  const edgeCount = (result.graph as { edges: unknown[] }).edges?.length ?? 0;

  const canSave = title.trim().length > 0 && slug.trim().length > 0 && !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="relative flex flex-col w-full max-w-6xl max-h-[calc(100vh-2rem)] bg-surface-elevated rounded-aila border border-border-app shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-border-app shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-semibold text-fg-primary tracking-tight truncate">
              Preview do fluxo
            </h2>
            <p className="text-[11px] text-fg-tertiary">
              {nodeCount} nodes · {edgeCount} edges · cliente {result.tenantId.toUpperCase()} ·
              gerado em {(result.llmMs / 1000).toFixed(1)}s
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors disabled:opacity-40"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body: canvas + sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 min-h-[300px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-border-app bg-zinc-100 dark:bg-zinc-900">
            <GraphPreviewCanvas graph={result.graph} />
          </div>

          {/* Edit panel */}
          <div className="lg:w-[320px] shrink-0 p-4 sm:p-5 overflow-y-auto bg-surface space-y-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-fg-tertiary mb-1.5">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-fg-tertiary mb-1.5">
                Slug (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, '-')
                      .replace(/-+/g, '-'),
                  )
                }
                disabled={saving}
                className="w-full px-3 py-2 text-sm font-mono bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-fg-tertiary mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProcessCategory)}
                disabled={saving}
                className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-fg-tertiary mb-1.5">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40 resize-none"
              />
            </div>

            {result.attachments.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-fg-tertiary mb-1.5">
                  Anexos usados
                </p>
                <ul className="space-y-1">
                  {result.attachments.map((a) => (
                    <li key={a.name} className="text-xs text-fg-secondary truncate">
                      · {a.name}
                      {a.truncated && (
                        <span className="text-fg-tertiary ml-1">(truncado)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {saveError && (
              <div className="flex items-start gap-2 p-2.5 bg-aila-error/10 border border-aila-error/30 rounded-aila">
                <AlertCircle className="w-4 h-4 text-aila-error shrink-0 mt-0.5" />
                <p className="text-xs text-aila-error">{saveError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-border-app shrink-0">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} />
            Refazer
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary rounded-aila transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave({ slug, title, description, category })}
              disabled={!canSave}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-aila transition-all',
                canSave
                  ? 'bg-aila-violet text-aila-cream shadow-sm hover:shadow-aila-glow'
                  : 'bg-surface-hover text-fg-tertiary cursor-not-allowed',
              )}
            >
              <Save size={14} />
              {saving ? 'Salvando…' : 'Salvar fluxo'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
