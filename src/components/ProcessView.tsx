'use client';

import { useParams } from 'next/navigation';
import { useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code2, Workflow, Maximize2, Minimize2, Copy, Check } from 'lucide-react';
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

import { getProcess } from '@/data/examples';
import { graphToReactFlow } from '@/lib/parse-process-graph';
import { layoutProcessGraph } from '@/lib/layout';
import { BpmnNode, BpmnEdge } from '@/lib/types';
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
  client,
  pool,
}: {
  initialNodes: BpmnNode[];
  initialEdges: BpmnEdge[];
  title: string;
  client: string;
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
                {client}
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
            filename={`${client}-${title}`.replace(/\s+/g, '-').toLowerCase()}
          />
        </Panel>
      </ReactFlow>
      <LaserPointerLayer containerRef={flowRef} />
    </div>
  );
}

export default function ProcessView() {
  const params = useParams();
  const client = params.client as string;
  const process = params.process as string;
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const proc = useMemo(() => getProcess(client, process), [client, process]);

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

  if (!proc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="text-center">
          <Workflow size={48} className="mx-auto mb-4 text-zinc-300" />
          <h1 className="text-xl font-bold text-zinc-800 mb-2">Processo não encontrado</h1>
          <p className="text-sm text-zinc-500 mb-6">
            O processo{' '}
            <code className="bg-white border border-zinc-200 px-2 py-0.5 rounded-md text-xs font-mono text-zinc-800">
              {client}/{process}
            </code>{' '}
            não existe.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            Voltar ao início
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
            client={proc.client.toUpperCase()}
            pool={proc.graph.pool}
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
          <Link href="/" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium">
            <ArrowLeft size={14} />
            Voltar
          </Link>
          <div className="h-4 w-px bg-zinc-200" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">{proc.client}</span>
              <span className="text-xs text-zinc-300">/</span>
              <span className="text-[11px] font-medium text-zinc-500">{proc.process}</span>
            </div>
            <h1 className="text-sm font-semibold text-zinc-900 tracking-tight">{proc.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${
              showCode
                ? 'bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm'
                : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100'
            }`}
          >
            <Code2 size={12} />
            Código
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
                aria-label={codeCopied ? 'JSON copiado' : 'Copiar JSON para a área de transferência'}
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
              client={proc.client.toUpperCase()}
              pool={proc.graph.pool}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
