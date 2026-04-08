'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code2, Workflow, Maximize2, Minimize2, Copy, Check, MessageSquare, Share2 } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { graphToReactFlow } from '@/lib/parse-process-graph';
import { layoutProcessGraph } from '@/lib/layout';
import { BpmnNode, BpmnEdge, formatProcessGraphPoolLabel } from '@/lib/types';
import { getProcess, ProcessDetail } from '@/services/process.service';
import { useAuth } from '@/contexts/auth.context';
import { CommentsPanel } from '@/components/shared/CommentsPanel';
import { ActivityNode } from './nodes/ActivityNode';
import { DecisionNode } from './nodes/DecisionNode';
import { StartEndNode } from './nodes/StartEndNode';
import { AutomationNode } from './nodes/AutomationNode';
import { GroupNode } from './nodes/GroupNode';
import { BpmnPoolNode } from './nodes/BpmnPoolNode';
import { ExportButton } from './ExportButton';
import { BpmnLegend } from './BpmnLegend';
import { LaserPointerLayer } from './LaserPointerLayer';
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

function FlowCanvas({
  initialNodes,
  initialEdges,
  title,
  slug,
  pool,
}: {
  initialNodes: BpmnNode[];
  initialEdges: BpmnEdge[];
  title: string;
  slug: string;
  pool?: string;
}) {
  const edgesWithStyle = useMemo(() => withBpmnEdgeStyle(initialEdges), [initialEdges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(edgesWithStyle);
  const flowRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={flowRef} className="relative" style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-100"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={0.55} color={diagramInline.dot} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={diagramInline.minimapNode}
          maskColor="rgb(244 244 245 / 0.65)"
          className="!bg-white/90"
        />

        <Panel position="top-left">
          <div className="flex flex-col gap-2 items-start max-w-md">
            <div className="bg-white/95 backdrop-blur-sm border border-zinc-200 rounded-bpmn px-4 py-2.5 shadow-md w-full">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] block">
                {slug}
              </span>
              {pool && (
                <p className="text-[10px] text-zinc-800 mt-1 leading-snug border-l-[3px] border-zinc-600 pl-2.5 mb-1">
                  Pool: {pool}
                </p>
              )}
              <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">{title}</h2>
            </div>
            <BpmnLegend align="left" />
          </div>
        </Panel>

        <Panel position="top-right">
          <ExportButton
            flowRef={flowRef}
            filename={`${slug}-${title}`.replace(/\s+/g, '-').toLowerCase()}
          />
        </Panel>
      </ReactFlow>
      <LaserPointerLayer containerRef={flowRef} />
    </div>
  );
}

export default function ProcessView() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const processId = params.id as string;

  const [proc, setProc] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/share/${processId}`;
    void navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2000);
  }, [processId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!processId || !isAuthenticated) return;
    setLoading(true);
    getProcess(processId)
      .then(setProc)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [processId, isAuthenticated]);

  const handleCopyGraphJson = useCallback(() => {
    if (!proc) return;
    void navigator.clipboard.writeText(JSON.stringify(proc.graph, null, 2));
    setCodeCopied(true);
    window.setTimeout(() => setCodeCopied(false), 2000);
  }, [proc]);

  const { nodes, edges } = useMemo(() => {
    if (!proc) return { nodes: [], edges: [] };
    const { nodes: raw, edges: rawEdges } = graphToReactFlow(proc.graph);
    return layoutProcessGraph(proc.graph, raw, rawEdges);
  }, [proc]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </div>
    );
  }

  if (error || !proc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="text-center">
          <Workflow size={48} className="mx-auto mb-4 text-zinc-300" />
          <h1 className="text-xl font-bold text-zinc-800 mb-2">Processo nao encontrado</h1>
          <p className="text-sm text-zinc-500 mb-6">O processo solicitado nao existe ou voce nao tem acesso.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            Voltar ao inicio
          </Link>
        </div>
      </div>
    );
  }

  if (fullscreen) {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => setFullscreen(false)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-bpmn text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-all shadow-sm"
          >
            <Minimize2 size={12} />
            Sair
          </button>
        </div>
        <ReactFlowProvider>
          <FlowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            title={proc.title}
            slug={proc.slug}
            pool={formatProcessGraphPoolLabel(proc.graph) ?? proc.graph.pool}
          />
        </ReactFlowProvider>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-zinc-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">
              {proc.slug}
            </span>
            <h1 className="text-sm font-semibold text-zinc-900 tracking-tight">{proc.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${
              shareCopied
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            {shareCopied ? (
              <>
                <Check size={12} />
                Link copiado!
              </>
            ) : (
              <>
                <Share2 size={12} />
                Compartilhar
              </>
            )}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${
              showComments
                ? 'bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm'
                : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            <MessageSquare size={12} />
            Comentarios
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${
              showCode
                ? 'bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm'
                : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            <Code2 size={12} />
            Codigo
          </button>
          <button
            onClick={() => setFullscreen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 border border-zinc-200 hover:bg-zinc-100 rounded-bpmn text-xs font-semibold transition-all"
          >
            <Maximize2 size={12} />
            Fullscreen
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showCode && (
          <div style={{ width: 380, flexShrink: 0 }} className="border-r border-zinc-200 flex flex-col overflow-hidden bg-zinc-950">
            <div className="px-3 py-1.5 bg-zinc-900 text-zinc-500 text-[10px] font-mono font-medium tracking-wide border-b border-zinc-800 flex items-center justify-between gap-2">
              <span>graph.json</span>
              <button
                type="button"
                onClick={handleCopyGraphJson}
                aria-label={codeCopied ? 'JSON copiado' : 'Copiar JSON'}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-sans font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                {codeCopied ? (
                  <>
                    <Check size={11} className="text-green-500" aria-hidden />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy size={11} aria-hidden />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <pre className="flex-1 p-4 bg-zinc-950 text-zinc-300 font-mono text-[11px] overflow-auto leading-relaxed selection:bg-zinc-700/80 selection:text-zinc-100">
              {JSON.stringify(proc.graph, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ flex: 1 }}>
          <ReactFlowProvider>
            <FlowCanvas
              initialNodes={nodes}
              initialEdges={edges}
              title={proc.title}
              slug={proc.slug}
              pool={formatProcessGraphPoolLabel(proc.graph) ?? proc.graph.pool}
            />
          </ReactFlowProvider>
        </div>

        {showComments && (
          <CommentsPanel processId={proc.id} />
        )}
      </div>
    </div>
  );
}
