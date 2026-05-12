'use client';

import { useParams } from 'next/navigation';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Workflow } from 'lucide-react';
import { AilaLogo } from '@/components/brand/AilaLogo';
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
import { getSharedProcess, ProcessDetail } from '@/services/process.service';
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
  pool,
}: {
  initialNodes: BpmnNode[];
  initialEdges: BpmnEdge[];
  title: string;
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
        className="bg-[var(--diagram-surface)]"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={0.55} color={diagramInline.dot} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={diagramInline.minimapNode}
          maskColor="rgb(0 0 0 / 0.45)"
          style={{ backgroundColor: 'var(--surface-elevated)' }}
        />

        <Panel position="top-left">
          <div className="flex flex-col gap-2 items-start w-[calc(100vw-7rem)] sm:w-auto sm:max-w-md">
            <div className="bg-surface-elevated/95 backdrop-blur-sm border border-border-app rounded-bpmn px-3 py-2 sm:px-4 sm:py-2.5 shadow-md w-full">
              {pool && (
                <p className="text-[10px] text-fg-primary leading-snug border-l-[3px] border-fg-secondary pl-2.5 mb-1 line-clamp-2">
                  Pool: {pool}
                </p>
              )}
              <h2 className="text-xs sm:text-sm font-semibold text-fg-primary tracking-tight line-clamp-2">
                {title}
              </h2>
            </div>
            <BpmnLegend align="left" />
          </div>
        </Panel>

        <Panel position="top-right">
          <ExportButton
            flowRef={flowRef}
            filename={title.replace(/\s+/g, '-').toLowerCase()}
          />
        </Panel>
      </ReactFlow>
      <LaserPointerLayer containerRef={flowRef} />
    </div>
  );
}

export default function PublicProcessView() {
  const params = useParams();
  const processId = params.id as string;

  const [proc, setProc] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!processId) return;
    getSharedProcess(processId)
      .then(setProc)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [processId]);

  const { nodes, edges } = useMemo(() => {
    if (!proc) return { nodes: [], edges: [] };
    const { nodes: raw, edges: rawEdges } = graphToReactFlow(proc.graph);
    return layoutProcessGraph(proc.graph, raw, rawEdges);
  }, [proc]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-sm text-fg-secondary">Carregando...</p>
      </div>
    );
  }

  if (error || !proc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <Workflow size={48} className="mx-auto mb-4 text-fg-tertiary" />
          <h1 className="font-display text-2xl font-semibold text-fg-primary mb-2 tracking-tight">
            Fluxo nao encontrado
          </h1>
          <p className="text-sm text-fg-secondary">Este link pode estar expirado ou incorreto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <header className="bg-surface-elevated/90 backdrop-blur-md border-b border-border-app px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <AilaLogo size={28} showWordmark={false} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-semibold text-fg-primary tracking-tight truncate">
              {proc.title}
            </h1>
            {proc.description && (
              <p className="hidden sm:block text-[11px] text-fg-secondary max-w-md truncate">
                {proc.description}
              </p>
            )}
          </div>
        </div>
        <span className="hidden sm:inline text-[10px] text-fg-tertiary font-semibold tracking-[0.08em] uppercase shrink-0">
          AILA BPMN
        </span>
      </header>

      <div style={{ flex: 1 }}>
        <ReactFlowProvider>
          <FlowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            title={proc.title}
            pool={formatProcessGraphPoolLabel(proc.graph) ?? proc.graph.pool}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
