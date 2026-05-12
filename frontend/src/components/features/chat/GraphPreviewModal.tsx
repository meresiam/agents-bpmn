'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Save, X, RefreshCw, AlertCircle, Sparkles, Paperclip } from 'lucide-react';
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

const fieldMotion = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 backdrop-blur-md p-4 sm:p-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className="relative flex flex-col w-full max-w-6xl max-h-[calc(100vh-2rem)] bg-surface-elevated rounded-aila border border-border-app shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-border-app shrink-0">
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-aila-violet/10 border border-aila-violet/30 shrink-0">
              <Sparkles className="w-4 h-4 text-aila-violet" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-[22px] font-semibold text-fg-primary tracking-tight leading-tight truncate">
                Preview do fluxo
              </h2>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full bg-surface-hover text-fg-secondary">
                  {nodeCount} nodes
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full bg-surface-hover text-fg-secondary">
                  {edgeCount} edges
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full bg-aila-violet/10 text-aila-violet">
                  {result.tenantId.toUpperCase()}
                </span>
                <span className="text-[10px] text-fg-tertiary tracking-tight">
                  · gerado em {(result.llmMs / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors disabled:opacity-40 shrink-0"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body: canvas + sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 min-h-[300px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-border-app bg-[var(--diagram-surface)]">
            <GraphPreviewCanvas graph={result.graph} />
          </div>

          {/* Edit panel */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } }}
            className="lg:w-[340px] shrink-0 p-5 sm:p-6 overflow-y-auto bg-surface space-y-4"
          >
            <motion.div variants={fieldMotion}>
              <label className="block text-[10px] font-semibold tracking-[0.08em] uppercase text-fg-tertiary mb-1.5">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-aila-violet/40 focus:border-aila-violet/40 transition-shadow"
              />
            </motion.div>

            <motion.div variants={fieldMotion}>
              <label className="block text-[10px] font-semibold tracking-[0.08em] uppercase text-fg-tertiary mb-1.5">
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
                className="w-full px-3 py-2 text-sm font-mono bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-aila-violet/40 focus:border-aila-violet/40 transition-shadow"
              />
            </motion.div>

            <motion.div variants={fieldMotion}>
              <label className="block text-[10px] font-semibold tracking-[0.08em] uppercase text-fg-tertiary mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProcessCategory)}
                disabled={saving}
                className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary focus:outline-none focus:ring-2 focus:ring-aila-violet/40 focus:border-aila-violet/40 transition-shadow"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div variants={fieldMotion}>
              <label className="block text-[10px] font-semibold tracking-[0.08em] uppercase text-fg-tertiary mb-1.5">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-aila-violet/40 focus:border-aila-violet/40 resize-none transition-shadow"
              />
            </motion.div>

            {result.attachments.length > 0 && (
              <motion.div variants={fieldMotion}>
                <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-fg-tertiary mb-1.5">
                  Anexos usados
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {result.attachments.map((a) => (
                    <li
                      key={a.name}
                      className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-surface-elevated text-fg-primary border border-border-app max-w-full"
                    >
                      <Paperclip size={10} className="text-fg-tertiary shrink-0" />
                      <span className="truncate">{a.name}</span>
                      {a.truncated && (
                        <span className="text-[9px] uppercase tracking-tight font-semibold text-aila-warning shrink-0">
                          trunc
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-2.5 bg-aila-error/10 border border-aila-error/30 rounded-aila"
              >
                <AlertCircle className="w-4 h-4 text-aila-error shrink-0 mt-0.5" />
                <p className="text-xs text-aila-error">{saveError}</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-7 py-3.5 border-t border-border-app shrink-0 bg-surface-elevated">
          <motion.button
            type="button"
            onClick={onRegenerate}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors disabled:opacity-40"
          >
            <motion.span
              animate={saving ? { rotate: 360 } : { rotate: 0 }}
              transition={saving ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
              className="inline-flex"
            >
              <RefreshCw size={13} className="group-hover:rotate-[-45deg] transition-transform" />
            </motion.span>
            Refazer
          </motion.button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary rounded-aila transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <motion.button
              type="button"
              onClick={() => onSave({ slug, title, description, category })}
              disabled={!canSave}
              whileHover={canSave ? { y: -1 } : undefined}
              whileTap={canSave ? { y: 0, scale: 0.98 } : undefined}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-aila transition-all',
                canSave
                  ? 'bg-aila-gradient text-aila-cream shadow-aila-glow hover:shadow-aila-glow'
                  : 'bg-surface-hover text-fg-tertiary cursor-not-allowed',
              )}
            >
              <Save size={14} />
              {saving ? 'Salvando…' : 'Salvar fluxo'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
