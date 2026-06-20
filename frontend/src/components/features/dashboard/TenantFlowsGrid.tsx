'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Workflow, ArrowUpRight, Clock } from 'lucide-react';
import type { ProcessCategory, ProcessSummary } from '@/services/process.service';

const CATEGORY_LABEL: Record<ProcessCategory, string> = {
  COMERCIAL: 'Comercial',
  MARKETING: 'Marketing',
  FINANCEIRO: 'Financeiro',
  OPERACOES: 'Operações',
  RH: 'RH',
  ATENDIMENTO: 'Atendimento',
  ONBOARDING: 'Onboarding',
  LOGISTICA: 'Logística',
  JURIDICO: 'Jurídico',
  TI: 'TI',
  OUTRO: 'Outro',
};

const CATEGORY_TONE: Record<
  ProcessCategory,
  { dot: string; chipBg: string; chipText: string; thumbHue: string }
> = {
  COMERCIAL: { dot: '#4CB3F6', chipBg: 'bg-aila-blue/10', chipText: 'text-aila-blue', thumbHue: 'from-aila-blue/30 to-aila-cyan/10' },
  MARKETING: { dot: '#E63DE0', chipBg: 'bg-aila-magenta/10', chipText: 'text-aila-magenta', thumbHue: 'from-aila-magenta/30 to-aila-purple/10' },
  FINANCEIRO: { dot: '#34C4F9', chipBg: 'bg-aila-cyan/10', chipText: 'text-aila-cyan', thumbHue: 'from-aila-cyan/30 to-aila-blue/10' },
  OPERACOES: { dot: '#8D80EC', chipBg: 'bg-aila-violet/10', chipText: 'text-aila-violet', thumbHue: 'from-aila-violet/30 to-aila-purple/10' },
  RH: { dot: '#CE4EE1', chipBg: 'bg-aila-purple/10', chipText: 'text-aila-purple', thumbHue: 'from-aila-purple/30 to-aila-magenta/10' },
  ATENDIMENTO: { dot: '#60A5FA', chipBg: 'bg-aila-info/10', chipText: 'text-aila-info', thumbHue: 'from-aila-info/30 to-aila-blue/10' },
  ONBOARDING: { dot: '#34D399', chipBg: 'bg-aila-success/10', chipText: 'text-aila-success', thumbHue: 'from-aila-success/30 to-aila-cyan/10' },
  LOGISTICA: { dot: '#FBBF24', chipBg: 'bg-aila-warning/10', chipText: 'text-aila-warning', thumbHue: 'from-aila-warning/30 to-aila-cyan/10' },
  JURIDICO: { dot: '#F87171', chipBg: 'bg-aila-error/10', chipText: 'text-aila-error', thumbHue: 'from-aila-error/30 to-aila-magenta/10' },
  TI: { dot: '#777777', chipBg: 'bg-aila-graphite-500/10', chipText: 'text-aila-graphite-400', thumbHue: 'from-aila-graphite-500/30 to-aila-graphite-700/10' },
  OUTRO: { dot: '#BBBBBB', chipBg: 'bg-surface-hover', chipText: 'text-fg-secondary', thumbHue: 'from-surface-hover to-surface' },
};

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'agora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `há ${day} ${day === 1 ? 'dia' : 'dias'}`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `há ${mon} ${mon === 1 ? 'mês' : 'meses'}`;
  const yr = Math.floor(mon / 12);
  return `há ${yr} ${yr === 1 ? 'ano' : 'anos'}`;
}

function ThumbnailDecorative({ tone }: { tone: (typeof CATEGORY_TONE)[ProcessCategory] }) {
  return (
    <div className={`relative h-28 w-full overflow-hidden bg-gradient-to-br ${tone.thumbHue}`}>
      {/* Diagonal dot grid evocando BPMN canvas */}
      <svg className="absolute inset-0 w-full h-full opacity-50" aria-hidden>
        <defs>
          <pattern id={`bpmn-dots-${tone.dot.replace('#', '')}`} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill={tone.dot} opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#bpmn-dots-${tone.dot.replace('#', '')})`} />
      </svg>
      {/* Mini graph schematic: 3 retângulos + 1 losango + linhas */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 110" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <g stroke={tone.dot} strokeWidth="1.2" fill="var(--surface-elevated)" opacity="0.85">
          <circle cx="24" cy="55" r="6" />
          <rect x="48" y="44" width="42" height="22" rx="4" />
          <polygon points="118,55 130,43 142,55 130,67" />
          <rect x="158" y="32" width="42" height="22" rx="4" />
          <rect x="158" y="60" width="42" height="22" rx="4" />
          <circle cx="220" cy="55" r="6" strokeWidth="2" />
        </g>
        <g stroke={tone.dot} strokeWidth="1" opacity="0.55" fill="none">
          <path d="M30 55 L48 55" />
          <path d="M90 55 L118 55" />
          <path d="M142 55 L158 43" />
          <path d="M142 55 L158 71" />
          <path d="M200 43 L214 49" />
          <path d="M200 71 L214 61" />
        </g>
      </svg>
    </div>
  );
}

interface TenantFlowsGridProps {
  tenantId: string | null;
  processes: ProcessSummary[];
  loading: boolean;
}

export function TenantFlowsGrid({ tenantId, processes, loading }: TenantFlowsGridProps) {
  if (!tenantId) return null;

  return (
    <section className="w-full max-w-6xl px-4 sm:px-6 mt-8 sm:mt-12 mb-8 sm:mb-10">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-tertiary mb-1">
            Cliente
          </p>
          <h2 className="font-display text-2xl font-semibold text-fg-primary tracking-tight leading-none">
            {tenantId.toUpperCase()}
            <span className="text-fg-tertiary font-normal text-base ml-2">
              · {processes.length} {processes.length === 1 ? 'fluxo' : 'fluxos'}
            </span>
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-aila border border-border-app bg-surface-elevated/40 h-[220px] animate-pulse"
            />
          ))}
        </div>
      ) : processes.length === 0 ? (
        <div className="rounded-aila border border-dashed border-border-app bg-surface-elevated/30 py-14 px-6 text-center">
          <Workflow className="w-8 h-8 mx-auto mb-3 text-fg-tertiary" />
          <p className="text-sm text-fg-secondary mb-1">
            Nenhum fluxo mapeado pra <span className="font-semibold text-fg-primary">{tenantId.toUpperCase()}</span> ainda.
          </p>
          <p className="text-xs text-fg-tertiary">
            Descreva um processo no chat acima pra gerar o primeiro.
          </p>
        </div>
      ) : (
        <motion.ul
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {processes.map((p) => {
            const tone = CATEGORY_TONE[p.category];
            return (
              <motion.li
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } },
                }}
              >
                <Link
                  href={`/bpmn/${p.id}`}
                  className="group block rounded-aila border border-border-app bg-surface-elevated overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-aila-glow hover:border-aila-violet/40"
                >
                  <ThumbnailDecorative tone={tone} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full ${tone.chipBg} ${tone.chipText}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tone.dot }} />
                          {CATEGORY_LABEL[p.category]}
                        </span>
                        {p.processKind !== 'SINGLE' && (
                          <span
                            className={`inline-flex items-center text-[9px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full border ${
                              p.processKind === 'TO_BE'
                                ? 'border-aila-violet/30 bg-aila-violet/10 text-aila-violet'
                                : 'border-fg-secondary/30 bg-fg-secondary/10 text-fg-secondary'
                            }`}
                          >
                            {p.processKind === 'TO_BE' ? 'TO-BE' : 'AS-IS'}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight
                        size={14}
                        className="text-fg-tertiary group-hover:text-aila-violet group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5"
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-fg-primary tracking-tight line-clamp-2 mb-1 group-hover:text-aila-violet transition-colors">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-[11px] text-fg-secondary line-clamp-2 leading-snug mb-3">
                        {p.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-app/60">
                      <span className="inline-flex items-center gap-1 text-[10px] text-fg-tertiary font-mono">
                        <Clock size={10} />
                        {formatRelative(p.updatedAt)}
                      </span>
                      <span className="text-[10px] text-fg-tertiary font-mono tracking-tight">
                        v.{p.version} · {p.slug}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </section>
  );
}
