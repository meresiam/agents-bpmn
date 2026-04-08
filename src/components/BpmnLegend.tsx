'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BookOpen, X } from 'lucide-react';

function LegendRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-zinc-100 last:border-0">
      <div className="flex-shrink-0 w-[52px] h-11 flex items-center justify-center bg-zinc-100 rounded-md border border-zinc-200">
        {icon}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[11px] font-semibold text-zinc-900 leading-tight">{title}</p>
        <p className="text-[10px] text-zinc-500 leading-snug mt-1">{desc}</p>
      </div>
    </div>
  );
}

type BpmnLegendProps = {
  align?: 'left' | 'right';
};

export function BpmnLegend({ align = 'right' }: BpmnLegendProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative z-[20]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="bpmn-legend-panel"
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-bpmn border transition-all shadow-sm ${
          open
            ? 'bg-zinc-100 text-zinc-900 border-zinc-300'
            : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
        }`}
      >
        <BookOpen size={14} className="text-zinc-500 shrink-0" aria-hidden />
        Legenda
      </button>

      {open && (
        <div
          id="bpmn-legend-panel"
          role="dialog"
          aria-label="Legenda dos elementos BPMN"
          className={`absolute top-full mt-2 w-[min(92vw,320px)] max-h-[min(72vh,520px)] overflow-y-auto rounded-bpmn border border-zinc-200 bg-white/98 backdrop-blur-sm shadow-md ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          <div className="sticky top-0 z-[1] flex items-start justify-between gap-2 px-3 py-2.5 border-b border-zinc-100 bg-white/95">
            <div>
              <p className="text-[11px] font-bold text-zinc-900 tracking-tight">Legenda BPMN 2.0</p>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">Símbolos usados neste fluxograma</p>
            </div>
            <button
              type="button"
              onClick={close}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Fechar legenda"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-3 pb-3 pt-1">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-400 mt-2 mb-1">Eventos</p>
            <LegendRow
              title="Início (Start Event)"
              desc="Ponto em que o processo começa. Borda fina."
              icon={
                <svg width="28" height="28" viewBox="0 0 36 36" className="text-zinc-800" aria-hidden>
                  <circle cx="18" cy="18" r="14" fill="white" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              }
            />
            <LegendRow
              title="Fim (End Event)"
              desc="Encerramento do fluxo. Borda mais espessa."
              icon={
                <svg width="28" height="28" viewBox="0 0 36 36" className="text-zinc-800" aria-hidden>
                  <circle cx="18" cy="18" r="13" fill="white" stroke="currentColor" strokeWidth="3.2" />
                </svg>
              }
            />

            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-400 mt-3 mb-1">Tarefas</p>
            <LegendRow
              title="Tarefa / User Task"
              desc="Atividade executada por pessoa. Retângulo arredondado; ícone de usuário quando for interação humana."
              icon={
                <svg width="40" height="26" viewBox="0 0 48 28" className="text-zinc-800" aria-hidden>
                  <rect x="2" y="2" width="44" height="24" rx="6" fill="white" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="14" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1" />
                  <path
                    d="M10 20c0-2.5 2-4 4-4s4 1.5 4 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              }
            />
            <LegendRow
              title="Service Task / Automação"
              desc="Tarefa de sistema (API, fila, integração). Mesmo formato com ícone de engrenagem."
              icon={
                <svg width="40" height="26" viewBox="0 0 48 28" className="text-zinc-800" aria-hidden>
                  <rect x="2" y="2" width="44" height="24" rx="6" fill="white" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="24" cy="14" r="4.5" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="24" cy="14" r="1.8" fill="none" stroke="currentColor" strokeWidth="0.9" />
                  <path d="M24 7v2M24 19v2M17 14h2M29 14h2" stroke="currentColor" strokeWidth="0.9" />
                </svg>
              }
            />

            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-400 mt-3 mb-1">Gateways</p>
            <LegendRow
              title="Exclusive (XOR)"
              desc="Escolha de um único caminho (ex.: Sim ou Não)."
              icon={
                <svg width="36" height="36" viewBox="0 0 48 48" className="text-zinc-800" aria-hidden>
                  <polygon points="24,4 44,24 24,44 4,24" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="17" y1="17" x2="31" y2="31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="31" y1="17" x2="17" y2="31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />
            <LegendRow
              title="Parallel (AND)"
              desc="Todos os caminhos de saída seguem em paralelo."
              icon={
                <svg width="36" height="36" viewBox="0 0 48 48" className="text-zinc-800" aria-hidden>
                  <polygon points="24,4 44,24 24,44 4,24" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="24" y1="14" x2="24" y2="34" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="14" y1="24" x2="34" y2="24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              }
            />
            <LegendRow
              title="Inclusive (OR)"
              desc="Uma ou mais saídas podem ser ativadas conforme a condição."
              icon={
                <svg width="36" height="36" viewBox="0 0 48 48" className="text-zinc-800" aria-hidden>
                  <polygon points="24,4 44,24 24,44 4,24" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              }
            />

            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-400 mt-3 mb-1">Fluxos</p>
            <LegendRow
              title="Sequence Flow"
              desc="Ordem de execução entre elementos. Texto na linha indica condição (ex.: rótulo da decisão)."
              icon={
                <svg width="48" height="22" viewBox="0 0 56 24" className="text-zinc-500" aria-hidden>
                  <line x1="2" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                  <path d="M36 8 L44 12 L36 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                  <rect x="10" y="5" width="18" height="10" rx="2" fill="white" stroke="currentColor" strokeWidth="0.8" />
                  <text x="19" y="12.5" textAnchor="middle" fontSize="6" fill="currentColor" fontFamily="system-ui">
                    Sim
                  </text>
                </svg>
              }
            />

            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-400 mt-3 mb-1">Organização</p>
            <LegendRow
              title="Pool e lanes"
              desc="O retângulo grande é o pool (processo ou participante). Faixas horizontais são lanes — papéis, times ou etapas."
              icon={
                <svg width="48" height="34" viewBox="0 0 56 36" className="text-zinc-800" aria-hidden>
                  <rect x="1" y="1" width="54" height="34" className="fill-zinc-100 stroke-current" strokeWidth="1" rx="1" />
                  <line x1="12" y1="1" x2="12" y2="35" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="22" y1="1" x2="22" y2="35" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="12" y1="12" x2="55" y2="12" className="stroke-zinc-500" strokeWidth="0.6" />
                  <line x1="12" y1="23" x2="55" y2="23" className="stroke-zinc-500" strokeWidth="0.6" />
                </svg>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
