'use client';

import * as React from 'react';
import { useEffect, useRef, useCallback, useTransition, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow,
  FileUp,
  Building2,
  Pencil,
  ArrowUpIcon,
  Paperclip,
  XIcon,
  LoaderIcon,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Auto-resize textarea hook ────────────────────────────────────────────────
interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

// ─── Command suggestions (contexto BPMN) ──────────────────────────────────────
interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  {
    icon: <Workflow className="w-4 h-4" />,
    label: 'Novo fluxo',
    description: 'Criar fluxograma BPMN a partir de descrição',
    prefix: '/novo-fluxo',
  },
  {
    icon: <FileUp className="w-4 h-4" />,
    label: 'Transcrição',
    description: 'Anexar polido Plaud ou transcrição de reunião',
    prefix: '/transcricao',
  },
  {
    icon: <Building2 className="w-4 h-4" />,
    label: 'Cliente',
    description: 'Selecionar tenant alvo do fluxograma',
    prefix: '/cliente',
  },
  {
    icon: <Pencil className="w-4 h-4" />,
    label: 'Editar',
    description: 'Modificar fluxo existente por prompt',
    prefix: '/editar',
  },
];

export type ChatAttachment = {
  id: string;
  name: string;
  size: number;
  file: File;
};

export interface TenantOption {
  tenantId: string;
  processCount: number;
}

interface AnimatedAIChatProps {
  onSubmit?: (payload: { prompt: string; attachments: ChatAttachment[] }) => void;
  isLoading?: boolean;
  placeholder?: string;
  title?: string;
  subtitle?: string;
  /** Quando presente, renderiza um selector de cliente acima do composer (SUPER_ADMIN). */
  tenantOptions?: TenantOption[];
  selectedTenantId?: string | null;
  onSelectTenant?: (tenantId: string) => void;
  /** Texto streaming do LLM, mostrado no toast inferior enquanto isLoading=true. */
  streamingText?: string;
  /** Stats heuristicas extraidas do stream parcial. */
  streamingStats?: { nodes: number; edges: number };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AnimatedAIChat({
  onSubmit,
  isLoading = false,
  placeholder = 'Descreva um fluxo, cole uma transcrição ou anexe um arquivo…',
  title = 'Como posso ajudar hoje?',
  subtitle = 'Descreva um processo, suba uma transcrição ou edite um fluxo',
  tenantOptions,
  selectedTenantId,
  onSelectTenant,
  streamingText,
  streamingStats,
}: AnimatedAIChatProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [, startTransition] = useTransition();
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [inputFocused, setInputFocused] = useState(false);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show command palette when typing /
  useEffect(() => {
    if (value.startsWith('/') && !value.includes(' ')) {
      setShowCommandPalette(true);
      const idx = COMMAND_SUGGESTIONS.findIndex((c) => c.prefix.startsWith(value));
      setActiveSuggestion(idx >= 0 ? idx : -1);
    } else {
      setShowCommandPalette(false);
    }
  }, [value]);

  // Track mouse for ambient glow
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Close command palette on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector('[data-command-button]');
      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tenantRequired = !!tenantOptions && tenantOptions.length > 0;
  const tenantMissing = tenantRequired && !selectedTenantId;

  const handleSubmit = () => {
    if (!value.trim() && attachments.length === 0) return;
    if (tenantMissing) return;
    if (onSubmit) {
      onSubmit({ prompt: value.trim(), attachments });
      return;
    }
    // Local stub used only in standalone/demo. With onSubmit wired, parent owns lifecycle.
    startTransition(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setValue('');
        setAttachments([]);
        adjustHeight(true);
      }, 1800);
    });
  };

  /** Reset input/attachments — chamado pelo pai quando o backend conclui a chamada. */
  const reset = useCallback(() => {
    setValue('');
    setAttachments([]);
    adjustHeight(true);
  }, [adjustHeight]);

  // Limpa quando o pai termina o loading (transição true → false).
  const prevLoading = useRef(isLoading);
  useEffect(() => {
    if (prevLoading.current && !isLoading) reset();
    prevLoading.current = isLoading;
  }, [isLoading, reset]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < COMMAND_SUGGESTIONS.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : COMMAND_SUGGESTIONS.length - 1,
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestion >= 0) selectCommand(activeSuggestion);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectCommand = (index: number) => {
    const cmd = COMMAND_SUGGESTIONS[index];
    setValue(cmd.prefix + ' ');
    setShowCommandPalette(false);
    setRecentCommand(cmd.label);
    setTimeout(() => setRecentCommand(null), 2000);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const next: ChatAttachment[] = files.map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      size: f.size,
      file: f,
    }));
    setAttachments((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const busy = isLoading || isTyping;
  const canSend =
    (value.trim().length > 0 || attachments.length > 0) && !busy && !tenantMissing;

  return (
    <div className="relative flex flex-col w-full flex-1 lg:flex-none items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      {/* Main column */}
      <div className="w-full max-w-2xl mx-auto relative">
        <motion.div
          className="relative z-10 space-y-6 sm:space-y-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Heading */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="inline-block"
            >
              <h1 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fg-primary to-fg-secondary pb-1">
                {title}
              </h1>
              <motion.div
                className="h-px bg-gradient-to-r from-transparent via-aila-violet/40 to-transparent"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.7 }}
              />
            </motion.div>
            <motion.p
              className="text-xs sm:text-sm text-fg-tertiary px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Tenant selector (SUPER_ADMIN) */}
          {tenantRequired && (
            <motion.div
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-fg-tertiary">
                Cliente
              </span>
              <select
                value={selectedTenantId ?? ''}
                onChange={(e) => onSelectTenant?.(e.target.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold uppercase tracking-tight bg-surface-elevated border rounded-aila text-fg-primary focus:outline-none focus:ring-1 focus:ring-aila-violet/40',
                  tenantMissing
                    ? 'border-aila-warning/40 ring-1 ring-aila-warning/30'
                    : 'border-border-app',
                )}
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {tenantOptions!.map((t) => (
                  <option key={t.tenantId} value={t.tenantId}>
                    {t.tenantId.toUpperCase()} ({t.processCount})
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Composer card */}
          <motion.div
            className="relative backdrop-blur-2xl bg-surface-elevated/80 rounded-aila border border-border-app shadow-sm"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Command palette */}
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute left-3 right-3 bottom-full mb-2 backdrop-blur-xl bg-surface-elevated rounded-aila z-50 shadow-md border border-border-app overflow-hidden"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="py-1">
                    {COMMAND_SUGGESTIONS.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.prefix}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer',
                          activeSuggestion === index
                            ? 'bg-surface-hover text-fg-primary'
                            : 'text-fg-secondary hover:bg-surface-hover/60',
                        )}
                        onClick={() => selectCommand(index)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-fg-tertiary">
                          {suggestion.icon}
                        </div>
                        <div className="font-medium">{suggestion.label}</div>
                        <div className="text-fg-tertiary text-xs ml-1">
                          {suggestion.prefix}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea */}
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={placeholder}
                rows={1}
                className={cn(
                  'w-full px-1 py-1',
                  'resize-none bg-transparent border-none',
                  'text-fg-primary text-sm leading-relaxed',
                  'focus:outline-none',
                  'placeholder:text-fg-tertiary',
                  'min-h-[60px]',
                )}
                style={{ overflow: 'hidden' }}
              />
            </div>

            {/* Attachments */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  className="px-4 pb-3 flex gap-2 flex-wrap"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {attachments.map((att) => (
                    <motion.div
                      key={att.id}
                      className="flex items-center gap-2 text-xs bg-surface-hover py-1.5 px-3 rounded-aila text-fg-secondary border border-border-app"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Paperclip className="w-3 h-3 text-fg-tertiary" />
                      <span className="font-medium truncate max-w-[180px]">{att.name}</span>
                      <span className="text-[10px] text-fg-tertiary">
                        {(att.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="text-fg-tertiary hover:text-fg-primary transition-colors"
                        aria-label="Remover anexo"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toolbar */}
            <div className="p-3 border-t border-border-app flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  accept=".md,.txt,.pdf,.docx,.json,.csv,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a"
                  onChange={handleFileChange}
                />
                <motion.button
                  type="button"
                  onClick={handleAttachClick}
                  whileTap={{ scale: 0.94 }}
                  className="p-2 text-fg-tertiary hover:text-fg-primary rounded-aila transition-colors hover:bg-surface-hover"
                  title="Anexar arquivo (transcrição, PDF, áudio)"
                  aria-label="Anexar arquivo"
                >
                  <Paperclip className="w-4 h-4" />
                </motion.button>
                <motion.button
                  type="button"
                  data-command-button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCommandPalette((prev) => !prev);
                  }}
                  whileTap={{ scale: 0.94 }}
                  className={cn(
                    'p-2 text-fg-tertiary hover:text-fg-primary rounded-aila transition-colors hover:bg-surface-hover',
                    showCommandPalette && 'bg-surface-hover text-fg-primary',
                  )}
                  title="Comandos"
                  aria-label="Comandos"
                >
                  <Command className="w-4 h-4" />
                </motion.button>
                {recentCommand && (
                  <span className="text-[11px] text-fg-tertiary ml-1">
                    {recentCommand} aplicado
                  </span>
                )}
              </div>

              <motion.button
                type="button"
                onClick={handleSubmit}
                whileHover={canSend ? { scale: 1.02 } : undefined}
                whileTap={canSend ? { scale: 0.98 } : undefined}
                disabled={!canSend}
                className={cn(
                  'px-4 py-2 rounded-aila text-sm font-semibold transition-all',
                  'flex items-center gap-2',
                  canSend
                    ? 'bg-aila-violet text-aila-cream shadow-sm hover:shadow-aila-glow'
                    : 'bg-surface-hover text-fg-tertiary cursor-not-allowed',
                )}
              >
                {busy ? (
                  <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                ) : (
                  <ArrowUpIcon className="w-4 h-4" />
                )}
                <span>Enviar</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Quick action chips — scroll horizontal no mobile, wrap centrado no desktop */}
          <div className="-mx-4 sm:mx-0 overflow-x-auto sm:overflow-visible">
            <div className="flex sm:flex-wrap items-center justify-start sm:justify-center gap-2 px-4 sm:px-0 min-w-min">
              {COMMAND_SUGGESTIONS.map((suggestion, index) => (
                <motion.button
                  key={suggestion.prefix}
                  onClick={() => selectCommand(index)}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 bg-surface-elevated/60 hover:bg-surface-elevated rounded-aila text-xs sm:text-sm text-fg-secondary hover:text-fg-primary transition-all border border-border-app whitespace-nowrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <span className="text-fg-tertiary">{suggestion.icon}</span>
                  <span className="font-medium">{suggestion.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Streaming preview toast */}
      <AnimatePresence>
        {busy && (
          <motion.div
            className={cn(
              'fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 backdrop-blur-2xl bg-surface-elevated rounded-aila border border-border-app shadow-md overflow-hidden',
              streamingText && streamingText.length > 0
                ? 'w-[min(40rem,calc(100vw-1.5rem))]'
                : 'px-4 py-2 rounded-full',
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {streamingText && streamingText.length > 0 ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border-app">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-aila-violet/15 flex items-center justify-center">
                      <Workflow className="w-3 h-3 text-aila-violet" />
                    </div>
                    <span className="text-xs font-semibold text-fg-secondary">
                      Gerando fluxo
                    </span>
                    <TypingDots />
                  </div>
                  {streamingStats && (streamingStats.nodes > 0 || streamingStats.edges > 0) && (
                    <span className="text-[10px] font-mono text-fg-tertiary">
                      {streamingStats.nodes} nodes · {streamingStats.edges} edges
                    </span>
                  )}
                </div>
                <pre className="px-3 py-2 text-[10px] leading-relaxed font-mono text-fg-tertiary max-h-32 overflow-y-auto whitespace-pre-wrap break-all">
                  {streamingText.slice(-600)}
                </pre>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-aila-violet/15 flex items-center justify-center">
                  <Workflow className="w-3.5 h-3.5 text-aila-violet" />
                </div>
                <div className="flex items-center gap-2 text-sm text-fg-secondary">
                  <span>Processando</span>
                  <TypingDots />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spotlight on input focus */}
      {inputFocused && (
        <motion.div
          className="fixed w-[40rem] h-[40rem] rounded-full pointer-events-none z-0 opacity-[0.04] bg-aila-gradient blur-[96px]"
          animate={{
            x: mousePosition.x - 320,
            y: mousePosition.y - 320,
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-aila-violet rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
