'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpIcon,
  Check,
  ChevronDown,
  ChevronRight,
  LoaderIcon,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  generateGraphStream,
  GeneratedGraph,
} from '@/services/chat.service';
import type { ProcessGraphJson } from '@/types/process.types';
import { computeGraphDiff, type GraphDiff } from '@/lib/graph-diff';

const GraphPreviewCanvas = dynamic(
  () => import('./GraphPreviewCanvas').then((m) => m.GraphPreviewCanvas),
  { ssr: false },
);

interface EditWithAIDialogProps {
  processId: string;
  currentGraph: ProcessGraphJson;
  tenantId: string;
  /** Pré-preenche o textarea (ex: recomendação de um gap vinda do GapPanel). */
  initialPrompt?: string;
  /** Título do cabeçalho. Default: "Editar fluxo com IA". Ex: "Sugerir TO-BE com IA" (4.C.1). */
  title?: string;
  /** Sugestões rápidas (chips). Default: dicas de edição pontual. */
  hints?: string[];
  /** Quem chama controla open/close pra preservar o lugar onde o botao mora. */
  onClose: () => void;
  /** Chamado quando o usuario aplica a edicao. Recebe o novo grafo + meta. */
  onApply: (next: GeneratedGraph) => Promise<void> | void;
}

const DEFAULT_HINTS = [
  'Adicione uma etapa de validacao antes do envio',
  'Remova a decisao "Cliente novo?" e mantenha o caminho positivo',
  'Renomeie a lane "Comercial" para "Vendas"',
  'Inclua uma automacao de notificacao por WhatsApp ao final',
];

export function EditWithAIDialog({
  processId,
  currentGraph,
  tenantId,
  initialPrompt,
  title = 'Editar fluxo com IA',
  hints = DEFAULT_HINTS,
  onClose,
  onApply,
}: EditWithAIDialogProps) {
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [streamStats, setStreamStats] = useState({ nodes: 0, edges: 0 });
  const [preview, setPreview] = useState<GeneratedGraph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [diffExpanded, setDiffExpanded] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const diff: GraphDiff | null = useMemo(() => {
    if (!preview) return null;
    return computeGraphDiff(currentGraph, preview.graph as ProcessGraphJson);
  }, [preview, currentGraph]);

  // Auto-focus no textarea quando abrir
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ESC fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !generating && !applying) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, generating, applying]);

  const runEdit = useCallback(async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);
    setPreview(null);
    setStreamText('');
    setStreamStats({ nodes: 0, edges: 0 });
    let buffer = '';

    abortRef.current = new AbortController();
    try {
      const result = await generateGraphStream(
        {
          prompt: prompt.trim(),
          files: [],
          mode: 'edit',
          existingGraph: currentGraph,
          tenantId,
          processId,
        },
        {
          signal: abortRef.current.signal,
          onDelta: ({ text }) => {
            buffer += text;
            setStreamText(buffer);
            setStreamStats({
              nodes: buffer.match(/"id"\s*:/g)?.length ?? 0,
              edges: buffer.match(/"from"\s*:/g)?.length ?? 0,
            });
          },
        },
      );
      setPreview(result);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message);
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [prompt, generating, currentGraph, tenantId, processId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void runEdit();
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      await onApply(preview);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = () => {
    if (generating) {
      abortRef.current?.abort();
      setGenerating(false);
      return;
    }
    onClose();
  };

  const nextNodeCount = preview ? (preview.graph as { nodes: unknown[] }).nodes.length : 0;
  const nextEdgeCount = preview ? (preview.graph as { edges: unknown[] }).edges.length : 0;
  const prevNodeCount = currentGraph.nodes?.length ?? 0;
  const prevEdgeCount = currentGraph.edges?.length ?? 0;

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
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={16} className="text-aila-violet shrink-0" />
            <h2 className="font-display text-lg font-semibold text-fg-primary tracking-tight truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={generating || applying}
            className="p-2 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors disabled:opacity-40"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Prompt area */}
          <div className="px-4 sm:px-6 py-4 border-b border-border-app bg-surface space-y-3 shrink-0">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={generating}
              placeholder="Descreva a mudanca. Ex: adicione uma etapa de aprovacao antes do envio."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40 resize-none"
            />

            <div className="flex flex-wrap gap-1.5">
              {hints.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => setPrompt(hint)}
                  disabled={generating}
                  className="text-[11px] px-2 py-1 bg-surface-hover hover:bg-surface-hover/80 text-fg-tertiary hover:text-fg-secondary rounded-aila border border-border-app transition-colors disabled:opacity-40"
                >
                  {hint}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-fg-tertiary">
                {prevNodeCount} nodes · {prevEdgeCount} edges no fluxo atual ·
                <span className="ml-1 font-mono">Cmd+Enter</span> envia
              </p>
              <button
                type="button"
                onClick={runEdit}
                disabled={!prompt.trim() || generating}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-aila transition-all',
                  prompt.trim() && !generating
                    ? 'bg-aila-violet text-aila-cream shadow-sm hover:shadow-aila-glow'
                    : 'bg-surface-hover text-fg-tertiary cursor-not-allowed',
                )}
              >
                {generating ? (
                  <LoaderIcon className="w-3.5 h-3.5 animate-[spin_2s_linear_infinite]" />
                ) : (
                  <ArrowUpIcon className="w-3.5 h-3.5" />
                )}
                {generating ? 'Gerando…' : 'Gerar edicao'}
              </button>
            </div>
          </div>

          {/* Stream / preview area */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {error && !generating && (
              <div className="m-4 p-3 bg-aila-error/10 border border-aila-error/30 rounded-aila text-xs text-aila-error">
                {error}
              </div>
            )}

            {generating && (
              <div className="flex flex-col h-full">
                <div className="px-4 py-2 border-b border-border-app flex items-center justify-between bg-surface">
                  <span className="text-[11px] font-semibold text-fg-secondary">
                    Streaming resposta
                  </span>
                  <span className="text-[10px] font-mono text-fg-tertiary">
                    {streamStats.nodes} nodes · {streamStats.edges} edges
                  </span>
                </div>
                <pre className="flex-1 px-4 py-3 text-[11px] leading-relaxed font-mono text-fg-tertiary overflow-auto whitespace-pre-wrap break-all bg-zinc-50 dark:bg-zinc-950">
                  {streamText || '…'}
                </pre>
              </div>
            )}

            {!generating && preview && diff && (
              <div className="flex flex-col h-full">
                <div className="px-4 py-2 border-b border-border-app flex items-center justify-between bg-surface">
                  <div className="flex items-center gap-2">
                    <Check size={13} className="text-aila-success" />
                    <span className="text-[11px] font-semibold text-fg-secondary">
                      Preview do fluxo editado
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-fg-tertiary">
                    {nextNodeCount} nodes ({diffLabel(prevNodeCount, nextNodeCount)}) ·{' '}
                    {nextEdgeCount} edges ({diffLabel(prevEdgeCount, nextEdgeCount)}) · gerado em{' '}
                    {(preview.llmMs / 1000).toFixed(1)}s
                  </span>
                </div>

                {diff.warnings.length > 0 && (
                  <div className="px-4 py-2 bg-aila-warning/10 border-b border-aila-warning/30">
                    {diff.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-aila-warning leading-relaxed">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                <DiffPanel diff={diff} expanded={diffExpanded} onToggle={() => setDiffExpanded((v) => !v)} />

                <div className="flex-1 min-h-0 bg-zinc-100 dark:bg-zinc-900">
                  <GraphPreviewCanvas graph={preview.graph} />
                </div>
              </div>
            )}

            {!generating && !preview && !error && (
              <div className="flex items-center justify-center h-full text-xs text-fg-tertiary">
                Descreva uma mudanca acima e clique em Gerar edicao.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-border-app shrink-0">
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setStreamText('');
              setError(null);
            }}
            disabled={!preview && !streamText && !error}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} />
            Limpar
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={applying}
              className="px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary rounded-aila transition-colors disabled:opacity-40"
            >
              {generating ? 'Cancelar' : 'Fechar'}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!preview || applying || generating}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-aila transition-all',
                preview && !applying && !generating
                  ? 'bg-aila-violet text-aila-cream shadow-sm hover:shadow-aila-glow'
                  : 'bg-surface-hover text-fg-tertiary cursor-not-allowed',
              )}
            >
              <Check size={14} />
              {applying ? 'Aplicando…' : 'Aplicar edicao'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function diffLabel(prev: number, next: number): string {
  const delta = next - prev;
  if (delta === 0) return 'sem mudanca';
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function DiffPanel({
  diff,
  expanded,
  onToggle,
}: {
  diff: GraphDiff;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { added, removed, modified, edgesAdded, edgesRemoved, lanesAdded, lanesRemoved } = diff;
  const noChanges =
    added.length === 0 &&
    removed.length === 0 &&
    modified.length === 0 &&
    edgesAdded.length === 0 &&
    edgesRemoved.length === 0 &&
    lanesAdded.length === 0 &&
    lanesRemoved.length === 0;

  if (noChanges) {
    return (
      <div className="px-4 py-2 border-b border-border-app bg-surface text-[11px] text-fg-tertiary">
        Nenhuma diferença detectada — o LLM devolveu o mesmo grafo.
      </div>
    );
  }

  return (
    <div className="border-b border-border-app bg-surface">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="text-[11px] font-semibold text-fg-secondary">Diferenças aplicadas pelo LLM</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {added.length > 0 && (
            <span className="text-aila-success flex items-center gap-0.5">
              <Plus size={10} />
              {added.length}
            </span>
          )}
          {removed.length > 0 && (
            <span className="text-aila-error flex items-center gap-0.5">
              <Minus size={10} />
              {removed.length}
            </span>
          )}
          {modified.length > 0 && (
            <span className="text-aila-violet flex items-center gap-0.5">
              <Pencil size={10} />
              {modified.length}
            </span>
          )}
          <span className="text-fg-tertiary ml-1">
            edges {diffSign(edgesAdded.length - edgesRemoved.length)}
            {Math.abs(edgesAdded.length - edgesRemoved.length)}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-1 space-y-2 max-h-44 overflow-y-auto text-[11px] leading-relaxed">
          {added.length > 0 && (
            <DiffSection
              icon={<Plus size={11} className="text-aila-success" />}
              title={`Nodes adicionados (${added.length})`}
              items={added.map((n) => (
                <span key={n.id}>
                  <span className="font-mono text-aila-success">{n.id}</span>{' '}
                  <span className="text-fg-secondary">{n.label}</span>
                  {n.lane && <span className="text-fg-tertiary"> · {n.lane}</span>}
                </span>
              ))}
            />
          )}
          {removed.length > 0 && (
            <DiffSection
              icon={<Minus size={11} className="text-aila-error" />}
              title={`Nodes removidos (${removed.length})`}
              items={removed.map((n) => (
                <span key={n.id}>
                  <span className="font-mono text-aila-error line-through">{n.id}</span>{' '}
                  <span className="text-fg-tertiary line-through">{n.label}</span>
                </span>
              ))}
            />
          )}
          {modified.length > 0 && (
            <DiffSection
              icon={<Pencil size={11} className="text-aila-violet" />}
              title={`Nodes modificados (${modified.length})`}
              items={modified.map((m) => (
                <span key={m.id}>
                  <span className="font-mono text-aila-violet">{m.id}</span>{' '}
                  {m.changes.map((c, i) => (
                    <span key={i} className="text-fg-tertiary">
                      {c.field}: <span className="line-through">{c.from || '∅'}</span> →{' '}
                      <span className="text-fg-secondary">{c.to || '∅'}</span>
                      {i < m.changes.length - 1 && ' · '}
                    </span>
                  ))}
                </span>
              ))}
            />
          )}
          {(lanesAdded.length > 0 || lanesRemoved.length > 0) && (
            <div className="flex flex-wrap gap-1 text-[10px]">
              {lanesAdded.map((l) => (
                <span key={l} className="px-1.5 py-0.5 bg-aila-success/10 text-aila-success rounded-aila">
                  + lane {l}
                </span>
              ))}
              {lanesRemoved.map((l) => (
                <span key={l} className="px-1.5 py-0.5 bg-aila-error/10 text-aila-error rounded-aila">
                  − lane {l}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DiffSection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: React.ReactNode[];
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="font-semibold text-fg-secondary">{title}</span>
      </div>
      <ul className="space-y-0.5 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-fg-secondary">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function diffSign(n: number): string {
  if (n > 0) return '+';
  if (n < 0) return '−';
  return '±';
}
