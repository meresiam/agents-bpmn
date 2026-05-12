'use client';

import { useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { graphToReactFlow } from '@/lib/parse-process-graph';
import { layoutProcessGraph } from '@/lib/layout';
import type { ProcessGraphJson } from '@/types/process.types';
import { ActivityNode } from '@/components/features/bpmn/nodes/ActivityNode';
import { DecisionNode } from '@/components/features/bpmn/nodes/DecisionNode';
import { StartEndNode } from '@/components/features/bpmn/nodes/StartEndNode';
import { AutomationNode } from '@/components/features/bpmn/nodes/AutomationNode';
import { GroupNode } from '@/components/features/bpmn/nodes/GroupNode';
import { BpmnPoolNode } from '@/components/features/bpmn/nodes/BpmnPoolNode';
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

interface GraphPreviewCanvasProps {
  graph: ProcessGraphJson;
}

function PreviewCanvasInner({ graph }: GraphPreviewCanvasProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const { nodes: raw, edges: rawEdges } = graphToReactFlow(graph);
    return layoutProcessGraph(graph, raw, rawEdges);
  }, [graph]);

  const edgesWithStyle = useMemo(() => withBpmnEdgeStyle(initialEdges), [initialEdges]);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(edgesWithStyle);
  const flowRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={flowRef} className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-100"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={0.55} color={diagramInline.dot} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function GraphPreviewCanvas(props: GraphPreviewCanvasProps) {
  return (
    <ReactFlowProvider>
      <PreviewCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
