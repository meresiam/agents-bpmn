'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileDown, RefreshCw, Sparkles, Wrench, Workflow, Users, Loader2, Wand2 } from 'lucide-react';
import type { Gap, GapAnalysisResult } from '@/services/chat.service';
import { exportGapReportPdf } from '@/lib/export-gap-pdf';

const TIPO_LABEL: Record<Gap['tipo'], string> = {
  GARGALO: 'Gargalo',
  RETRABALHO: 'Retrabalho',
  ETAPA_MANUAL: 'Etapa manual',
  FALTA_DE_DADO: 'Falta de dado',
  RISCO_COMPLIANCE: 'Risco / compliance',
  ESPERA: 'Espera',
  OUTRO: 'Outro',
};

const SEV_TONE: Record<Gap['severidade'], string> = {
  ALTA: 'bg-aila-error/10 text-aila-error border-aila-error/30',
  MEDIA: 'bg-aila-warning/10 text-aila-warning border-aila-warning/30',
  BAIXA: 'bg-aila-success/10 text-aila-success border-aila-success/30',
};

const ABORDAGEM_META: Record<Gap['solucao']['abordagem'], { label: string; icon: typeof Wrench }> = {
  IA: { label: 'IA', icon: Sparkles },
  AUTOMACAO: { label: 'Automação', icon: Wrench },
  PROCESSO: { label: 'Processo', icon: Workflow },
  PESSOAS: { label: 'Pessoas', icon: Users },
};

function GapCard({ gap, index, onApply }: { gap: Gap; index: number; onApply?: (g: Gap) => void }) {
  const Abordagem = ABORDAGEM_META[gap.solucao.abordagem];
  return (
    <div className="rounded-bpmn border border-border-app bg-surface-elevated p-3.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-fg-primary leading-snug">
          <span className="text-fg-tertiary mr-1.5">{index + 1}.</span>
          {gap.titulo}
        </h4>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-surface-hover text-fg-secondary border border-border-app">
          {TIPO_LABEL[gap.tipo]}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${SEV_TONE[gap.severidade]}`}>
          {gap.severidade}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
            gap.solucao.precisaIA
              ? 'bg-aila-violet/10 text-aila-violet border-aila-violet/30'
              : 'bg-fg-secondary/10 text-fg-secondary border-fg-secondary/30'
          }`}
        >
          <Abordagem.icon size={10} />
          {gap.solucao.precisaIA ? 'Precisa IA' : `Sem IA · ${Abordagem.label}`}
        </span>
      </div>

      {gap.localizacao && (
        <p className="text-[11px] text-fg-tertiary mb-1.5">
          <span className="font-semibold">Onde:</span> {gap.localizacao}
        </p>
      )}
      <p className="text-xs text-fg-secondary leading-relaxed mb-1.5">
        <span className="font-semibold text-fg-primary">Recomendação:</span> {gap.recomendacao}
      </p>
      {gap.solucao.descricao && (
        <p className="text-xs text-fg-secondary leading-relaxed">
          <span className="font-semibold text-fg-primary">Solução:</span> {gap.solucao.descricao}
        </p>
      )}

      {onApply && (
        <button
          onClick={() => onApply(gap)}
          className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-bpmn text-[11px] font-semibold border border-aila-violet/30 bg-aila-violet/5 text-aila-violet hover:bg-aila-violet/10 transition-all"
        >
          <Wand2 size={12} /> Aplicar no TO-BE
        </button>
      )}
    </div>
  );
}

export function GapPanel({
  result,
  onClose,
  onReanalyze,
  onApplyToBe,
  reanalyzing,
}: {
  result: GapAnalysisResult;
  onClose: () => void;
  onReanalyze: () => void;
  /** Só passado quando há um TO-BE pra materializar a melhoria. */
  onApplyToBe?: (gap: Gap) => void;
  reanalyzing?: boolean;
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportGapReportPdf(result);
    } catch (err) {
      console.error('Export GAP PDF falhou', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.22 }}
      className="fixed sm:absolute inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-surface border-l border-border-app shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-app bg-surface-elevated/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={16} className="text-aila-violet shrink-0" />
          <h3 className="text-sm font-semibold text-fg-primary truncate">Análise de GAP</h3>
          <span className="text-[10px] text-fg-tertiary font-mono shrink-0">{result.gaps.length} gaps</span>
        </div>
        <button onClick={onClose} className="p-1.5 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-bpmn transition-colors" aria-label="Fechar">
          <X size={16} />
        </button>
      </div>

      {/* Resumo */}
      <div className="px-4 py-3 border-b border-border-app bg-surface-elevated/40 shrink-0">
        <p className="text-xs text-fg-secondary leading-relaxed">{result.resumo}</p>
      </div>

      {/* Lista de gaps */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {result.gaps.map((gap, i) => (
          <GapCard key={gap.id} gap={gap} index={i} onApply={onApplyToBe} />
        ))}
      </div>

      {/* Footer ações */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border-app bg-surface-elevated/80 backdrop-blur-sm shrink-0">
        <button
          onClick={onReanalyze}
          disabled={reanalyzing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold text-fg-secondary border border-border-app hover:bg-surface-hover transition-all disabled:opacity-50"
        >
          {reanalyzing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {reanalyzing ? 'Analisando…' : 'Reanalisar'}
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold bg-fg-primary text-surface hover:opacity-90 transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
          Exportar PDF
        </button>
      </div>
    </motion.aside>
  );
}
