'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  FileDown,
  RefreshCw,
  FileText,
  Loader2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  AlertTriangle,
  Save,
} from 'lucide-react';
import {
  PopResult,
  PopContent,
  PopPasso,
  PopResponsavel,
  PopStatus,
  illustratePop,
  updatePop,
  popImageSrc,
} from '@/services/pop.service';
import { exportPopPdf } from '@/lib/export-pop-pdf';

const linesToList = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function Field({
  label,
  value,
  onChange,
  rows = 2,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-fg-tertiary">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full resize-y rounded-bpmn border border-border-app bg-surface px-2.5 py-1.5 text-xs text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
      />
    </label>
  );
}

function StepCard({
  passo,
  index,
  total,
  onPatch,
  onMove,
  onRemove,
  onIllustrate,
  illustrating,
}: {
  passo: PopPasso;
  index: number;
  total: number;
  onPatch: (patch: Partial<PopPasso>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onIllustrate: () => void;
  illustrating: boolean;
}) {
  return (
    <div className="rounded-bpmn border border-border-app bg-surface-elevated p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-aila-violet">Passo {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1 text-fg-tertiary hover:text-fg-primary disabled:opacity-30"
            aria-label="Mover acima"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1 text-fg-tertiary hover:text-fg-primary disabled:opacity-30"
            aria-label="Mover abaixo"
          >
            <ArrowDown size={13} />
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-fg-tertiary hover:text-aila-error"
            aria-label="Remover passo"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <Field label="Ação" value={passo.acao} onChange={(v) => onPatch({ acao: v })} rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Responsável" value={passo.responsavel} onChange={(v) => onPatch({ responsavel: v })} rows={1} />
        <Field label="Ponto de controle" value={passo.pontoControle} onChange={(v) => onPatch({ pontoControle: v })} rows={1} />
        <Field label="Entrada" value={passo.entrada} onChange={(v) => onPatch({ entrada: v })} rows={1} />
        <Field label="Saída" value={passo.saida} onChange={(v) => onPatch({ saida: v })} rows={1} />
      </div>

      {passo.imagemUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={popImageSrc(passo.imagemUrl)}
          alt={`Ilustração do passo ${index + 1}`}
          className="w-full rounded-bpmn border border-border-app"
        />
      )}

      <button
        onClick={onIllustrate}
        disabled={illustrating}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-bpmn text-[11px] font-semibold border border-aila-violet/30 bg-aila-violet/5 text-aila-violet hover:bg-aila-violet/10 transition-all disabled:opacity-50"
      >
        {illustrating ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
        {passo.imagemUrl ? 'Regenerar imagem' : 'Ilustrar passo'}
      </button>
    </div>
  );
}

export function PopPanel({
  result,
  currentToBeVersion,
  onClose,
  onRegenerate,
  regenerating,
}: {
  result: PopResult;
  /** version atual do TO-BE — pra detectar POP desatualizado (6.C.3). */
  currentToBeVersion?: number;
  onClose: () => void;
  onRegenerate: () => void;
  regenerating?: boolean;
}) {
  const [content, setContent] = useState<PopContent>(result.content);
  const [materiaisText, setMateriaisText] = useState((result.content.materiais ?? []).join('\n'));
  const [indicadoresText, setIndicadoresText] = useState((result.content.indicadores ?? []).join('\n'));
  const [riscosText, setRiscosText] = useState((result.content.riscos ?? []).join('\n'));
  const [status, setStatus] = useState<PopStatus>(result.status);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [illustratingAll, setIllustratingAll] = useState(false);
  const [illustratingStep, setIllustratingStep] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stale =
    typeof currentToBeVersion === 'number' && content.processVersion !== currentToBeVersion;

  const buildContent = useCallback(
    (): PopContent => ({
      ...content,
      materiais: linesToList(materiaisText),
      indicadores: linesToList(indicadoresText),
      riscos: linesToList(riscosText),
    }),
    [content, materiaisText, indicadoresText, riscosText],
  );

  const loadFromResult = useCallback((r: PopResult) => {
    setContent(r.content);
    setMateriaisText((r.content.materiais ?? []).join('\n'));
    setIndicadoresText((r.content.indicadores ?? []).join('\n'));
    setRiscosText((r.content.riscos ?? []).join('\n'));
    setStatus(r.status);
    setDirty(false);
  }, []);

  const touch = () => setDirty(true);

  const patchPasso = (index: number, patch: Partial<PopPasso>) => {
    setContent((c) => ({ ...c, passos: c.passos.map((p, i) => (i === index ? { ...p, ...patch } : p)) }));
    touch();
  };

  const movePasso = (index: number, dir: -1 | 1) => {
    setContent((c) => {
      const passos = [...c.passos];
      const j = index + dir;
      if (j < 0 || j >= passos.length) return c;
      [passos[index], passos[j]] = [passos[j], passos[index]];
      return { ...c, passos: passos.map((p, i) => ({ ...p, ordem: i + 1 })) };
    });
    touch();
  };

  const removePasso = (index: number) => {
    setContent((c) => ({
      ...c,
      passos: c.passos.filter((_, i) => i !== index).map((p, i) => ({ ...p, ordem: i + 1 })),
    }));
    touch();
  };

  const patchResponsavel = (index: number, patch: Partial<PopResponsavel>) => {
    setContent((c) => ({
      ...c,
      responsaveis: c.responsaveis.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
    touch();
  };
  const addResponsavel = () => {
    setContent((c) => ({ ...c, responsaveis: [...c.responsaveis, { papel: '', descricao: '' }] }));
    touch();
  };
  const removeResponsavel = (index: number) => {
    setContent((c) => ({ ...c, responsaveis: c.responsaveis.filter((_, i) => i !== index) }));
    touch();
  };

  const persist = useCallback(async (): Promise<PopResult> => {
    const updated = await updatePop(result.id, { content: buildContent() });
    loadFromResult(updated);
    return updated;
  }, [result.id, buildContent, loadFromResult]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await persist();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const next: PopStatus = status === 'APPROVED' ? 'DRAFT' : 'APPROVED';
    setSaving(true);
    setError(null);
    try {
      // Salva edições pendentes junto com a mudança de status.
      const updated = await updatePop(result.id, {
        content: dirty ? buildContent() : undefined,
        status: next,
      });
      loadFromResult(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Ilustrar salva edições pendentes antes (o backend trabalha sobre o content persistido).
  const handleIllustrateStep = async (ordem: number) => {
    setIllustratingStep(ordem);
    setError(null);
    try {
      if (dirty) await persist();
      const updated = await illustratePop(result.id, [ordem]);
      loadFromResult(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIllustratingStep(null);
    }
  };

  const handleIllustrateAll = async () => {
    setIllustratingAll(true);
    setError(null);
    try {
      if (dirty) await persist();
      const updated = await illustratePop(result.id);
      loadFromResult(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIllustratingAll(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPopPdf(buildContent());
    } catch (err) {
      console.error('Export POP PDF falhou', err);
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
      className="fixed sm:absolute inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-surface border-l border-border-app shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-app bg-surface-elevated/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={16} className="text-aila-violet shrink-0" />
          <h3 className="text-sm font-semibold text-fg-primary truncate">POP</h3>
          <span className="text-[10px] text-fg-tertiary font-mono shrink-0">v{result.version}</span>
          <button
            onClick={handleToggleStatus}
            disabled={saving}
            className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border transition-colors ${
              status === 'APPROVED'
                ? 'bg-aila-success/10 text-aila-success border-aila-success/30'
                : 'bg-aila-warning/10 text-aila-warning border-aila-warning/30'
            }`}
            title="Alternar status DRAFT / APPROVED"
          >
            {status === 'APPROVED' ? 'Aprovado' : 'Rascunho'}
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-bpmn transition-colors"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      {stale && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-aila-warning/10 border-b border-aila-warning/30">
          <AlertTriangle size={14} className="text-aila-warning shrink-0 mt-0.5" />
          <p className="text-[11px] text-aila-warning leading-snug">
            POP gerado da v{content.processVersion}, mas o TO-BE está na v{currentToBeVersion}. Considere regerar.
          </p>
        </div>
      )}

      {error && (
        <div className="px-4 py-2 bg-aila-error/10 border-b border-aila-error/30 text-[11px] text-aila-error">
          {error}
        </div>
      )}

      {/* Corpo editável */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <Field label="Título" value={content.titulo} onChange={(v) => { setContent((c) => ({ ...c, titulo: v })); touch(); }} rows={1} />
        <Field label="Objetivo" value={content.objetivo} onChange={(v) => { setContent((c) => ({ ...c, objetivo: v })); touch(); }} />
        <Field label="Escopo" value={content.escopo} onChange={(v) => { setContent((c) => ({ ...c, escopo: v })); touch(); }} />

        {/* Responsáveis */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-fg-tertiary">Responsáveis</span>
            <button onClick={addResponsavel} className="inline-flex items-center gap-1 text-[11px] text-aila-violet hover:underline">
              <Plus size={11} /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {content.responsaveis.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <div className="flex-1 grid grid-cols-2 gap-1.5">
                  <input
                    value={r.papel}
                    onChange={(e) => patchResponsavel(i, { papel: e.target.value })}
                    placeholder="Papel"
                    className="rounded-bpmn border border-border-app bg-surface px-2 py-1.5 text-xs text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
                  />
                  <input
                    value={r.descricao}
                    onChange={(e) => patchResponsavel(i, { descricao: e.target.value })}
                    placeholder="O que faz"
                    className="rounded-bpmn border border-border-app bg-surface px-2 py-1.5 text-xs text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
                  />
                </div>
                <button onClick={() => removeResponsavel(i)} className="p-1.5 text-fg-tertiary hover:text-aila-error" aria-label="Remover">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Materiais e sistemas (1 por linha)" value={materiaisText} onChange={(v) => { setMateriaisText(v); touch(); }} rows={3} />

        {/* Passos */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-fg-tertiary">
              Passos ({content.passos.length})
            </span>
            <button
              onClick={handleIllustrateAll}
              disabled={illustratingAll || content.passos.length === 0}
              className="inline-flex items-center gap-1 text-[11px] text-aila-violet hover:underline disabled:opacity-50"
            >
              {illustratingAll ? <Loader2 size={11} className="animate-spin" /> : <ImageIcon size={11} />}
              Ilustrar todos
            </button>
          </div>
          <div className="space-y-3">
            {content.passos.map((p, i) => (
              <StepCard
                key={i}
                passo={p}
                index={i}
                total={content.passos.length}
                onPatch={(patch) => patchPasso(i, patch)}
                onMove={(dir) => movePasso(i, dir)}
                onRemove={() => removePasso(i)}
                onIllustrate={() => handleIllustrateStep(p.ordem)}
                illustrating={illustratingStep === p.ordem || illustratingAll}
              />
            ))}
          </div>
        </div>

        <Field label="Indicadores (1 por linha)" value={indicadoresText} onChange={(v) => { setIndicadoresText(v); touch(); }} rows={3} />
        <Field label="Riscos e cuidados (1 por linha)" value={riscosText} onChange={(v) => { setRiscosText(v); touch(); }} rows={3} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border-app bg-surface-elevated/80 backdrop-blur-sm shrink-0">
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-bpmn text-xs font-semibold text-fg-secondary border border-border-app hover:bg-surface-hover transition-all disabled:opacity-50"
          title="Regerar o POP a partir do TO-BE atual"
        >
          {regenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Regerar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-bpmn text-xs font-semibold text-fg-secondary border border-border-app hover:bg-surface-hover transition-all disabled:opacity-40"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {dirty ? 'Salvar' : 'Salvo'}
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold bg-fg-primary text-surface hover:opacity-90 transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
          Exportar PDF
        </button>
      </div>
    </motion.aside>
  );
}
