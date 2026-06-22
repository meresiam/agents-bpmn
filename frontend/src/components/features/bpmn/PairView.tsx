'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Workflow, Pencil, Sparkles, Loader2, Wand2, FileText } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { graphToReactFlow } from '@/lib/parse-process-graph';
import { layoutProcessGraph } from '@/lib/layout';
import { BpmnNode, BpmnEdge, formatProcessGraphPoolLabel } from '@/lib/types';
import { getProcessPair, updateProcess, ProcessDetail } from '@/services/process.service';
import { analyzeGap, Gap, GapAnalysisResult, GeneratedGraph } from '@/services/chat.service';
import { useAuth } from '@/contexts/auth.context';
import { GapPanel } from './GapPanel';
import { PopPanel } from './PopPanel';
import { generatePop, PopResult } from '@/services/pop.service';
import { EditWithAIDialog } from '@/components/features/chat/EditWithAIDialog';
import { SUGGEST_TO_BE_PROMPT, TO_BE_HINTS, buildGapEditPrompt } from '@/lib/to-be-prompts';
import { ActivityNode } from './nodes/ActivityNode';
import { DecisionNode } from './nodes/DecisionNode';
import { StartEndNode } from './nodes/StartEndNode';
import { AutomationNode } from './nodes/AutomationNode';
import { GroupNode } from './nodes/GroupNode';
import { BpmnPoolNode } from './nodes/BpmnPoolNode';
import { ExportButton } from './ExportButton';
import { withBpmnEdgeStyle } from '@/lib/react-flow-theme';
import { diagramInline } from '@/lib/diagram-tokens';

const nodeTypes = {
  activity: ActivityNode,
  decision: DecisionNode,
  startEnd: StartEndNode,
  automation: AutomationNode,
  group: GroupNode,
  bpmnPool: BpmnPoolNode,
};

type Face = 'asIs' | 'toBe';

const FACE_META: Record<Face, { label: string; sub: string; accent: string; chip: string }> = {
  asIs: {
    label: 'AS-IS',
    sub: 'Como é hoje',
    accent: 'border-fg-secondary',
    chip: 'bg-fg-secondary/10 text-fg-secondary border-fg-secondary/30',
  },
  toBe: {
    label: 'TO-BE',
    sub: 'Como deveria ser',
    accent: 'border-aila-violet',
    chip: 'bg-aila-violet/10 text-aila-violet border-aila-violet/30',
  },
};

/** Render read-only de um graph BPMN — reusa o mesmo pipeline do ProcessView. */
function ReadOnlyDiagram({ proc }: { proc: ProcessDetail }) {
  const flowRef = useRef<HTMLDivElement>(null);

  const { nodes, edges } = useMemo(() => {
    const { nodes: raw, edges: rawEdges } = graphToReactFlow(proc.graph);
    const laid = layoutProcessGraph(proc.graph, raw, rawEdges);
    if (proc.layoutOverrides) {
      const overrides = proc.layoutOverrides as Record<string, { x: number; y: number }>;
      laid.nodes = laid.nodes.map((n) => {
        const ov = overrides[n.id];
        return ov ? { ...n, position: { x: ov.x, y: ov.y } } : n;
      });
    }
    return laid as { nodes: BpmnNode[]; edges: BpmnEdge[] };
  }, [proc]);

  const edgesWithStyle = useMemo(() => withBpmnEdgeStyle(edges), [edges]);
  const pool = formatProcessGraphPoolLabel(proc.graph) ?? proc.graph.pool;

  return (
    <div ref={flowRef} className="relative w-full h-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edgesWithStyle}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
          minZoom={0.1}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
          className="bg-[var(--diagram-surface)]"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={0.55} color={diagramInline.dot} />
          <Controls showInteractive={false} />
          {pool && (
            <Panel position="top-left">
              <div className="bg-surface-elevated/95 backdrop-blur-sm border border-border-app rounded-bpmn px-3 py-1.5 shadow-md max-w-[60vw] sm:max-w-xs">
                <p className="text-[10px] text-fg-primary leading-snug border-l-[3px] border-fg-secondary pl-2 line-clamp-2">
                  Pool: {pool}
                </p>
              </div>
            </Panel>
          )}
          <Panel position="top-right">
            <ExportButton flowRef={flowRef} filename={`${proc.slug}-${proc.title}`.replace(/\s+/g, '-').toLowerCase()} />
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

/** Cabeçalho de uma face: chip + título + link pro editor. */
function FaceHeader({ face, proc }: { face: Face; proc: ProcessDetail }) {
  const meta = FACE_META[face];
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-border-app bg-surface-elevated/80 backdrop-blur-sm border-l-[3px] ${meta.accent}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border ${meta.chip}`}>{meta.label}</span>
          <span className="text-[10px] text-fg-tertiary">{meta.sub}</span>
        </div>
        <h2 className="text-xs sm:text-sm font-semibold text-fg-primary truncate mt-0.5">{proc.title}</h2>
      </div>
      <Link
        href={`/bpmn/${proc.id}`}
        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-bpmn text-xs font-semibold text-fg-secondary border border-border-app hover:bg-surface-hover transition-all"
        title="Abrir no editor"
      >
        <Pencil size={12} /> <span className="hidden sm:inline">Editor</span>
      </Link>
    </div>
  );
}

export default function PairView() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const processId = params.id as string;

  const [asIs, setAsIs] = useState<ProcessDetail | null>(null);
  const [toBe, setToBe] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Mobile: qual face mostrar (abas empilhadas — mobile-first, Nielsen H8).
  const [mobileFace, setMobileFace] = useState<Face>('asIs');

  // Análise de GAP (Epic 4.B)
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapPanelOpen, setGapPanelOpen] = useState(false);
  const [gapError, setGapError] = useState<string | null>(null);
  // Gap sendo aplicado no TO-BE (abre o EditWithAIDialog pré-preenchido)
  const [applyingGap, setApplyingGap] = useState<Gap | null>(null);
  // Epic 4.C.1 — geração assistida do TO-BE (otimiza o AS-IS via IA)
  const [suggestingToBe, setSuggestingToBe] = useState(false);

  // POP (Wave 6) — geração + painel
  const [pop, setPop] = useState<PopResult | null>(null);
  const [popLoading, setPopLoading] = useState(false);
  const [popPanelOpen, setPopPanelOpen] = useState(false);
  const [popError, setPopError] = useState<string | null>(null);

  const runGeneratePop = useCallback(async () => {
    if (!processId) return;
    setPopLoading(true);
    setPopError(null);
    setPopPanelOpen(true);
    try {
      const result = await generatePop(processId);
      setPop(result);
    } catch (err) {
      setPopError((err as Error).message);
      setPopPanelOpen(false);
    } finally {
      setPopLoading(false);
    }
  }, [processId]);

  const runAnalyze = useCallback(async () => {
    if (!processId) return;
    setGapLoading(true);
    setGapError(null);
    setGapPanelOpen(true);
    try {
      const result = await analyzeGap(processId);
      setGapResult(result);
    } catch (err) {
      setGapError((err as Error).message);
      setGapPanelOpen(false);
    } finally {
      setGapLoading(false);
    }
  }, [processId]);

  const handleApplyToBe = useCallback((gap: Gap) => {
    // Pré-preenche o editor de IA do TO-BE com a recomendação do gap.
    setApplyingGap(gap);
  }, []);

  const handleApplyAIEdit = useCallback(
    async (next: GeneratedGraph) => {
      if (!toBe) return;
      const updated = await updateProcess(toBe.id, { graph: next.graph });
      setToBe(updated);
      setApplyingGap(null);
    },
    [toBe],
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!processId || !isAuthenticated) return;
    setLoading(true);
    getProcessPair(processId)
      .then((pair) => {
        setAsIs(pair.asIs);
        setToBe(pair.toBe);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [processId, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-sm text-fg-secondary">Carregando comparação…</p>
      </div>
    );
  }

  if (error || !asIs || !toBe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center px-6">
          <Workflow size={48} className="mx-auto mb-4 text-fg-tertiary" />
          <h1 className="text-xl font-bold text-fg-primary mb-2">Par não encontrado</h1>
          <p className="text-sm text-fg-secondary mb-6">Este processo não tem um par AS-IS / TO-BE vinculado.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-fg-primary text-surface text-sm font-semibold rounded-bpmn hover:opacity-90 transition-colors shadow-sm">
            <ArrowLeft size={14} /> Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="bg-surface-elevated/90 backdrop-blur-md border-b border-border-app px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link href={`/bpmn/${asIs.id}`} className="text-fg-tertiary hover:text-fg-primary transition-colors shrink-0" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-fg-secondary uppercase tracking-[0.08em] truncate">{asIs.tenantId}</span>
            <h1 className="text-xs sm:text-sm font-semibold text-fg-primary truncate">Comparação AS-IS · TO-BE</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented control — só no mobile (no desktop os dois aparecem lado a lado) */}
          <div className="flex sm:hidden items-center gap-1 bg-surface rounded-bpmn border border-border-app p-0.5">
            {(['asIs', 'toBe'] as Face[]).map((f) => (
              <button
                key={f}
                onClick={() => setMobileFace(f)}
                className={`px-3 py-1.5 rounded-[6px] text-[11px] font-bold uppercase tracking-wide transition-all ${
                  mobileFace === f ? 'bg-fg-primary text-surface' : 'text-fg-secondary'
                }`}
              >
                {FACE_META[f].label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSuggestingToBe(true)}
            className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-bpmn text-xs font-semibold border border-aila-violet/30 bg-aila-violet/5 text-aila-violet hover:bg-aila-violet/10 transition-all disabled:opacity-50"
            title="Sugerir TO-BE otimizado a partir do AS-IS via IA"
            aria-label="Sugerir TO-BE"
          >
            <Wand2 size={14} className="sm:hidden" />
            <Wand2 size={12} className="hidden sm:inline" />
            <span className="hidden sm:inline">Sugerir TO-BE</span>
          </button>

          <button
            onClick={gapResult ? () => setGapPanelOpen(true) : runAnalyze}
            disabled={gapLoading}
            className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-bpmn text-xs font-semibold border border-aila-violet/30 bg-aila-violet/5 text-aila-violet hover:bg-aila-violet/10 transition-all disabled:opacity-50"
            title="Analisar GAP do processo"
            aria-label="Analisar GAP"
          >
            {gapLoading ? <Loader2 size={14} className="animate-spin sm:hidden" /> : <Sparkles size={14} className="sm:hidden" />}
            {gapLoading ? <Loader2 size={12} className="animate-spin hidden sm:inline" /> : <Sparkles size={12} className="hidden sm:inline" />}
            <span className="hidden sm:inline">{gapLoading ? 'Analisando…' : gapResult ? 'Ver GAP' : 'Analisar GAP'}</span>
          </button>

          <button
            onClick={pop ? () => setPopPanelOpen(true) : runGeneratePop}
            disabled={popLoading}
            className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-bpmn text-xs font-semibold bg-fg-primary text-surface hover:opacity-90 transition-all disabled:opacity-50"
            title="Gerar o POP (Procedimento Operacional Padrão) do TO-BE"
            aria-label="Gerar POP"
          >
            {popLoading ? <Loader2 size={14} className="animate-spin sm:hidden" /> : <FileText size={14} className="sm:hidden" />}
            {popLoading ? <Loader2 size={12} className="animate-spin hidden sm:inline" /> : <FileText size={12} className="hidden sm:inline" />}
            <span className="hidden sm:inline">{popLoading ? 'Gerando…' : pop ? 'Ver POP' : 'Gerar POP'}</span>
          </button>
        </div>
      </header>

      {(gapError || popError) && (
        <div className="px-4 py-2 bg-aila-error/10 border-b border-aila-error/30 text-xs text-aila-error">
          {gapError || popError}
        </div>
      )}

      {/* Desktop: split lado a lado */}
      <div className="hidden sm:flex flex-1 overflow-hidden divide-x divide-border-app">
        <section className="flex-1 flex flex-col min-w-0">
          <FaceHeader face="asIs" proc={asIs} />
          <div className="flex-1 relative"><ReadOnlyDiagram proc={asIs} /></div>
        </section>
        <section className="flex-1 flex flex-col min-w-0">
          <FaceHeader face="toBe" proc={toBe} />
          <div className="flex-1 relative"><ReadOnlyDiagram proc={toBe} /></div>
        </section>
      </div>

      {/* Mobile: uma face por vez (abas) */}
      <div className="flex sm:hidden flex-1 flex-col overflow-hidden">
        {mobileFace === 'asIs' ? (
          <>
            <FaceHeader face="asIs" proc={asIs} />
            <div className="flex-1 relative"><ReadOnlyDiagram proc={asIs} /></div>
          </>
        ) : (
          <>
            <FaceHeader face="toBe" proc={toBe} />
            <div className="flex-1 relative"><ReadOnlyDiagram proc={toBe} /></div>
          </>
        )}
      </div>

      {/* Painel de GAP (Epic 4.B.3) */}
      <AnimatePresence>
        {gapPanelOpen && gapResult && (
          <GapPanel
            key="gap-panel"
            result={gapResult}
            onClose={() => setGapPanelOpen(false)}
            onReanalyze={runAnalyze}
            onApplyToBe={handleApplyToBe}
            reanalyzing={gapLoading}
          />
        )}
      </AnimatePresence>

      {/* Painel do POP (Wave 6) */}
      <AnimatePresence>
        {popPanelOpen && pop && (
          <PopPanel
            key={`pop-${pop.id}`}
            result={pop}
            currentToBeVersion={toBe.version}
            onClose={() => setPopPanelOpen(false)}
            onRegenerate={runGeneratePop}
            regenerating={popLoading}
          />
        )}
      </AnimatePresence>

      {/* Sugerir TO-BE: otimiza o AS-IS via IA e persiste no TO-BE (Epic 4.C.1) */}
      {suggestingToBe && (
        <EditWithAIDialog
          processId={toBe.id}
          currentGraph={asIs.graph}
          tenantId={toBe.tenantId}
          title="Sugerir TO-BE com IA"
          hints={TO_BE_HINTS}
          initialPrompt={SUGGEST_TO_BE_PROMPT}
          onClose={() => setSuggestingToBe(false)}
          onApply={async (next) => {
            await handleApplyAIEdit(next);
            setSuggestingToBe(false);
          }}
        />
      )}

      {/* Aplicar gap no TO-BE via edição de IA — com gancho de automação/IA AILA (Epic 4.B.3 + 4.C.2) */}
      {applyingGap && (
        <EditWithAIDialog
          processId={toBe.id}
          currentGraph={toBe.graph}
          tenantId={toBe.tenantId}
          initialPrompt={buildGapEditPrompt(applyingGap)}
          onClose={() => setApplyingGap(null)}
          onApply={handleApplyAIEdit}
        />
      )}
    </div>
  );
}
