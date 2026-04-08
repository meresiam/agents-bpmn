'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Play, Code2, Eye, AlertCircle, Copy, Check } from 'lucide-react';
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

import { parseProcessGraphJsonString, graphToReactFlow } from '@/lib/parse-process-graph';
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

const EXAMPLE_JSON = `{
  "version": 1,
  "layout": "LR",
  "pool": "Exemplo — BPMN 2.0",
  "lanes": ["Participante", "Gestor"],
  "nodes": [
    { "id": "Start", "kind": "startEnd", "label": "Início", "lane": "Participante", "bpmn": { "event": "start" } },
    { "id": "A", "kind": "activity", "phase": "Participante", "label": "Solicitar inscrição", "bpmn": { "task": "userTask" } },
    { "id": "B", "kind": "activity", "phase": "Gestor", "label": "Avaliar pedido", "bpmn": { "task": "userTask" } },
    { "id": "C", "kind": "decision", "label": "Aprovado?", "lane": "Gestor", "bpmn": { "gateway": "exclusive" } },
    { "id": "D", "kind": "automation", "phase": "Participante", "label": "Notificar participante", "bpmn": { "task": "serviceTask" } },
    { "id": "End1", "kind": "startEnd", "label": "Fim — recusado", "lane": "Participante", "bpmn": { "event": "end" } },
    { "id": "End2", "kind": "startEnd", "label": "Fim — ok", "lane": "Participante", "bpmn": { "event": "end" } }
  ],
  "edges": [
    { "from": "Start", "to": "A" },
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "D", "label": "Sim" },
    { "from": "C", "to": "End1", "label": "Não" },
    { "from": "D", "to": "End2" }
  ]
}`;

function FlowPreview({
  nodes: initialNodes,
  edges: initialEdges,
}: {
  nodes: BpmnNode[];
  edges: BpmnEdge[];
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

        <Panel position="top-left">
          <BpmnLegend align="left" />
        </Panel>
        <Panel position="top-right">
          <ExportButton flowRef={flowRef} filename="fluxograma" />
        </Panel>
      </ReactFlow>
      <LaserPointerLayer containerRef={flowRef} />
    </div>
  );
}

export default function ProcessGraphEditor({ initialJson }: { initialJson?: string }) {
  const [code, setCode] = useState(initialJson || EXAMPLE_JSON);
  const [nodes, setNodes] = useState<BpmnNode[]>([]);
  const [edges, setEdges] = useState<BpmnEdge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'split' | 'code' | 'preview'>('split');
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  const processCode = useCallback((jsonText: string) => {
    try {
      const graph = parseProcessGraphJsonString(jsonText);
      const { nodes: rawNodes, edges: rawEdges } = graphToReactFlow(graph);
      const { nodes: layouted, edges: layoutedEdges } = layoutProcessGraph(graph, rawNodes, rawEdges);
      setNodes(layouted);
      setEdges(layoutedEdges);
      setError(null);
      setKey((k) => k + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    processCode(code);
  }, []);

  const handleRun = useCallback(() => processCode(code), [code, processCode]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun]
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-zinc-200 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">Editor — Bravy Graph (JSON)</span>
        </div>

        <div className="flex items-center gap-0.5 bg-zinc-100 rounded-bpmn p-0.5 border border-zinc-200">
          {(['code', 'split', 'preview'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                view === v
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {v === 'code' && <Code2 size={12} className="inline mr-1" />}
              {v === 'preview' && <Eye size={12} className="inline mr-1" />}
              {v === 'code' ? 'JSON' : v === 'split' ? 'Split' : 'Preview'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Play size={12} />
            Renderizar
            <span className="text-zinc-400 text-[10px] font-normal">⌘↵</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {(view === 'code' || view === 'split') && (
          <div
            style={{ width: view === 'split' ? '40%' : '100%', flexShrink: 0 }}
            className="flex flex-col border-r border-zinc-200 overflow-hidden bg-zinc-950"
          >
            <div className="px-3 py-1.5 bg-zinc-900 text-zinc-500 text-[10px] font-mono font-medium tracking-wide flex items-center justify-between border-b border-zinc-800">
              <span>process.graph.json</span>
              <span>{code.split('\n').length} linhas</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full p-4 bg-zinc-950 text-zinc-300 font-mono text-[13px] resize-none outline-none leading-relaxed selection:bg-zinc-700/80 selection:text-zinc-100"
              spellCheck={false}
              placeholder='{ "version": 1, "layout": "LR", "nodes": [...], "edges": [...] }'
            />
          </div>
        )}

        {(view === 'preview' || view === 'split') && (
          <div style={{ flex: 1 }}>
            {error ? (
              <div className="h-full flex items-center justify-center p-4">
                <div className="flex items-center gap-2 bg-red-50/95 border border-red-200/90 rounded-bpmn px-6 py-4 text-sm text-red-700 max-w-lg shadow-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              </div>
            ) : nodes.length > 0 ? (
              <ReactFlowProvider key={key}>
                <FlowPreview nodes={nodes} edges={edges} />
              </ReactFlowProvider>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 bg-zinc-100">
                <div className="text-center">
                  <Code2 size={48} className="mx-auto mb-3 opacity-25 text-zinc-500" />
                  <p className="text-sm font-medium text-zinc-500">Edite o JSON e clique em Renderizar</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
